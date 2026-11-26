"use client";

/**
 * Shared singleton wrapper around the Transformers.js embedding worker.
 *
 * Both the semantic categorization widget and the auto-moderation widget need
 * the same model. Previously each widget spun up its own `Worker`, which meant
 * two independent model states that could drift out of sync (one "ready" while
 * the other was still "loading", or one cleared while the other kept running).
 *
 * This module owns a single worker for the whole page and exposes a tiny
 * observable store so every widget reads the same `status` / `cache` values.
 * The global "manually cleared" flag in `modelCache.ts` gates all downloads:
 * while it is set, nothing triggers a model load.
 */

import {
  broadcastModelCacheCleared,
  isModelCacheManuallyCleared,
  subscribeModelCacheCleared,
} from "@/lib/modelCache";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export type CacheUsage = {
  files: number;
  bytes: number;
  hasModel: boolean;
};

export type EmbeddingSource = "huggingface" | "fallback";

type WorkerResult = {
  id: string;
  text: string;
  vector: Float32Array;
  source: EmbeddingSource;
};

type WorkerStatusResponse = {
  type: "status";
  id: string;
  status: ModelStatus;
  cache: CacheUsage;
};

type WorkerClearCacheResponse = {
  type: "clear-cache";
  id: string;
  ok: boolean;
  cache: CacheUsage;
};

type WorkerReloadResponse = {
  type: "reload";
  id: string;
  ok: boolean;
  status: ModelStatus;
  cache: CacheUsage;
};

type WorkerPreloadResponse = {
  type: "preload";
  id: string;
  ok: boolean;
  status: ModelStatus;
  cache: CacheUsage;
};

type WorkerControlResponse =
  | WorkerStatusResponse
  | WorkerClearCacheResponse
  | WorkerReloadResponse
  | WorkerPreloadResponse;

type PendingResolver = {
  resolve: (vector: Float32Array, source: EmbeddingSource) => void;
};

type ControlResolver = {
  resolve: (response: WorkerControlResponse) => void;
};

export const EMPTY_CACHE: CacheUsage = { files: 0, bytes: 0, hasModel: false };

type StoreState = {
  status: ModelStatus;
  cache: CacheUsage;
  busy: "none" | "clearing" | "reloading";
};

type Listener = () => void;

let worker: Worker | null = null;
const pending = new Map<string, PendingResolver>();
const control = new Map<string, ControlResolver>();

let state: StoreState = {
  status: "loading",
  cache: EMPTY_CACHE,
  busy: "none",
};

const listeners = new Set<Listener>();
let initialized = false;
let unsubscribeFlag: (() => void) | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<StoreState>) {
  state = { ...state, ...patch };
  emit();
}

function ensureWorker(): Worker | null {
  if (typeof window === "undefined") return null;
  if (worker) return worker;

  const instance = new Worker(
    new URL("../components/comms/categorizePost.worker.ts", import.meta.url),
    { type: "module" }
  );

  instance.onmessage = (
    event: MessageEvent<WorkerResult | WorkerControlResponse>
  ) => {
    const data = event.data as WorkerResult | WorkerControlResponse;

    if ("type" in data) {
      const resolver = control.get(data.id);
      if (resolver) {
        control.delete(data.id);
        resolver.resolve(data);
      }
      if (data.type === "status") {
        setState({ status: data.status, cache: data.cache });
      }
      return;
    }

    const resolver = pending.get(data.id);
    if (!resolver) return;
    pending.delete(data.id);
    resolver.resolve(data.vector, data.source);
  };

  instance.onerror = () => setState({ status: "error" });

  worker = instance;
  return worker;
}

function sendControl(
  type: "status" | "clear-cache" | "reload" | "preload"
): Promise<WorkerControlResponse> {
  const instance = ensureWorker();
  if (!instance) {
    return Promise.resolve({
      type: "status",
      id: "unavailable",
      status: "error",
      cache: EMPTY_CACHE,
    } as WorkerStatusResponse);
  }

  return new Promise<WorkerControlResponse>((resolve) => {
    const id = `control:${type}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    control.set(id, { resolve });
    instance.postMessage({ type, id });
  });
}

async function refreshStatus() {
  const response = await sendControl("status");
  if (response.type === "status") {
    setState({ status: response.status, cache: response.cache });
  }
}

async function preload() {
  if (isModelCacheManuallyCleared()) {
    await refreshStatus();
    return;
  }
  setState({ status: "loading" });
  const response = await sendControl("preload");
  if (response.type === "preload") {
    setState({ status: response.status, cache: response.cache });
  }
}

/**
 * Initialise the shared worker exactly once. Safe to call from every widget
 * mount; subsequent calls are no-ops. Kicks off a preload only when the global
 * "manually cleared" flag is not set.
 */
export function initEmbeddingWorker(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  initialized = true;

  ensureWorker();

  // Seed the initial status from the global flag so the very first render is
  // already correct (no flash of "loading" when the cache was cleared).
  state = {
    status: isModelCacheManuallyCleared() ? "idle" : "loading",
    cache: EMPTY_CACHE,
    busy: "none",
  };
  emit();

  unsubscribeFlag = subscribeModelCacheCleared(() => {
    if (isModelCacheManuallyCleared()) {
      setState({ status: "idle" });
      void refreshStatus();
    } else if (state.status !== "ready") {
      void preload();
    }
  });

  // Defer the first network-touching call so it never runs synchronously
  // during render/effect setup.
  window.setTimeout(() => {
    if (isModelCacheManuallyCleared()) {
      void refreshStatus();
    } else {
      void preload();
    }
  }, 0);
}

export function getState(): StoreState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function embed(
  text: string
): Promise<{ vector: Float32Array; source: EmbeddingSource } | null> {
  const instance = ensureWorker();
  if (!instance) return null;

  return new Promise((resolve) => {
    const id = `embed:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    pending.set(id, {
      resolve: (vector, source) => resolve({ vector, source }),
    });
    instance.postMessage({ id, text });
  });
}

export async function clearCache(): Promise<void> {
  setState({ busy: "clearing" });
  try {
    const response = await sendControl("clear-cache");
    if (response.type === "clear-cache") {
      setState({ cache: response.cache, status: "idle" });
      broadcastModelCacheCleared(true);
    }
  } finally {
    setState({ busy: "none" });
  }
}

export async function reloadModel(): Promise<void> {
  setState({ busy: "reloading", status: "loading" });
  broadcastModelCacheCleared(false);
  try {
    const response = await sendControl("reload");
    if (response.type === "reload") {
      setState({ status: response.status, cache: response.cache });
    }
  } finally {
    setState({ busy: "none" });
  }
}

/** Tear down the shared worker (used only in tests / hot reload). */
export function disposeEmbeddingWorker(): void {
  unsubscribeFlag?.();
  unsubscribeFlag = null;
  worker?.terminate();
  worker = null;
  pending.clear();
  control.clear();
  listeners.clear();
  initialized = false;
}
