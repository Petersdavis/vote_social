import { env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

type FeatureExtractionModel = (text: string, options: { pooling: "mean"; normalize: boolean }) => Promise<{
  data: Float32Array | number[];
}>;

type EmbedRequest = {
  type?: "embed";
  id: string;
  text: string;
};

type StatusRequest = {
  type: "status";
  id: string;
};

type ClearCacheRequest = {
  type: "clear-cache";
  id: string;
};

type ReloadRequest = {
  type: "reload";
  id: string;
};

type PreloadRequest = {
  type: "preload";
  id: string;
};

type WorkerRequest =
  | EmbedRequest
  | StatusRequest
  | ClearCacheRequest
  | ReloadRequest
  | PreloadRequest;

type WorkerResponse = EmbedRequest & {
  vector: Float32Array;
  source: "huggingface" | "fallback";
};

type ModelStatus = "idle" | "loading" | "ready" | "error";

type CacheUsage = {
  /** Number of cached model files. */
  files: number;
  /** Total bytes used by the model cache. */
  bytes: number;
  /** Whether the model weights are present in the cache. */
  hasModel: boolean;
};

type StatusResponse = {
  type: "status";
  id: string;
  status: ModelStatus;
  cache: CacheUsage;
};

type ClearCacheResponse = {
  type: "clear-cache";
  id: string;
  ok: boolean;
  cache: CacheUsage;
};

type ReloadResponse = {
  type: "reload";
  id: string;
  ok: boolean;
  status: ModelStatus;
  cache: CacheUsage;
};

type PreloadResponse = {
  type: "preload";
  id: string;
  ok: boolean;
  status: ModelStatus;
  cache: CacheUsage;
};

type WorkerScopeLike = {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(
    message:
      | WorkerResponse
      | StatusResponse
      | ClearCacheResponse
      | ReloadResponse
      | PreloadResponse,
    transfer?: Transferable[]
  ): void;
};

let extractor: FeatureExtractionModel | null = null;
let modelStatus: ModelStatus = "idle";
let loadPromise: Promise<FeatureExtractionModel> | null = null;

function createFallbackVector(text: string): Float32Array {
  const dimensions = 384;
  const vector = new Float32Array(dimensions);
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    vector[0] = 1;
    return vector;
  }

  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const bucket = (charCode * 31 + i * 17) % dimensions;
    vector[bucket] += 1;

    if (i < normalized.length - 1) {
      const bigram =
        normalized.charCodeAt(i) * 131 + normalized.charCodeAt(i + 1) * 17;
      vector[bigram % dimensions] += 1.75;
    }
  }

  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < vector.length; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

async function loadExtractor(): Promise<FeatureExtractionModel> {
  if (extractor) return extractor;
  if (loadPromise) return loadPromise;

  modelStatus = "loading";
  loadPromise = (async () => {
    try {
      const instance = (await pipeline("feature-extraction", MODEL_ID, {
        dtype: "q8",
      })) as FeatureExtractionModel;
      extractor = instance;
      modelStatus = "ready";
      return instance;
    } catch (error) {
      modelStatus = "error";
      throw error;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

async function getExtractor() {
  return loadExtractor();
}

/**
 * Inspect the browser Cache Storage for the transformers.js model cache and
 * report how many files / bytes are stored for this model.
 */
async function readCacheUsage(): Promise<CacheUsage> {
  const empty: CacheUsage = { files: 0, bytes: 0, hasModel: false };

  if (typeof caches === "undefined") return empty;

  try {
    const cacheNames = await caches.keys();
    let files = 0;
    let bytes = 0;
    let hasModel = false;

    for (const cacheName of cacheNames) {
      // transformers.js stores model assets in caches prefixed with
      // "transformers-cache". Only count those to avoid unrelated caches.
      if (!cacheName.startsWith("transformers-cache")) continue;
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      for (const request of requests) {
        const response = await cache.match(request);
        if (!response) continue;
        files += 1;
        const length = Number(response.headers.get("content-length") ?? "0");
        if (Number.isFinite(length) && length > 0) {
          bytes += length;
        } else {
          // Fall back to measuring the body when content-length is absent.
          try {
            const buffer = await response.clone().arrayBuffer();
            bytes += buffer.byteLength;
          } catch {
            // Ignore unreadable entries.
          }
        }
        if (request.url.includes(MODEL_ID)) hasModel = true;
      }
    }

    return { files, bytes, hasModel };
  } catch {
    return empty;
  }
}

async function clearModelCache(): Promise<CacheUsage> {
  // Drop the in-memory model so the next request re-downloads from scratch.
  extractor = null;
  loadPromise = null;
  modelStatus = "idle";

  if (typeof caches === "undefined") return readCacheUsage();

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith("transformers-cache"))
        .map((cacheName) => caches.delete(cacheName))
    );
  } catch {
    // Ignore cache deletion failures; report whatever remains.
  }

  return readCacheUsage();
}

const workerScope = self as unknown as WorkerScopeLike;

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  const type = message.type ?? "embed";

  if (type === "status") {
    const cache = await readCacheUsage();
    const response: StatusResponse = {
      type: "status",
      id: message.id,
      status: modelStatus,
      cache,
    };
    workerScope.postMessage(response);
    return;
  }

  if (type === "clear-cache") {
    const cache = await clearModelCache();
    const response: ClearCacheResponse = {
      type: "clear-cache",
      id: message.id,
      ok: true,
      cache,
    };
    workerScope.postMessage(response);
    return;
  }

  if (type === "reload" || type === "preload") {
    try {
      await loadExtractor();
      const cache = await readCacheUsage();
      const response: ReloadResponse | PreloadResponse = {
        type,
        id: message.id,
        ok: true,
        status: modelStatus,
        cache,
      };
      workerScope.postMessage(response);
    } catch {
      const cache = await readCacheUsage();
      const response: ReloadResponse | PreloadResponse = {
        type,
        id: message.id,
        ok: false,
        status: modelStatus,
        cache,
      };
      workerScope.postMessage(response);
    }
    return;
  }

  const { id, text } = message as EmbedRequest;

  try {
    const model = await getExtractor();
    const output = await model(text, { pooling: "mean", normalize: true });
    const vector = new Float32Array(output.data as Float32Array | number[]);

    const response: WorkerResponse = {
      id,
      text,
      vector,
      source: "huggingface",
    };

    workerScope.postMessage(response, [vector.buffer]);
  } catch {
    const vector = createFallbackVector(text);
    const response: WorkerResponse = {
      id,
      text,
      vector,
      source: "fallback",
    };

    workerScope.postMessage(response, [vector.buffer]);
  }
};

export {};
