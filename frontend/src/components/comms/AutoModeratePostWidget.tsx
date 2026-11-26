"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  CheckCircle2,
  Database,
  Flag,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  forceCollide,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import {
  clearCache as clearCacheShared,
  embed as embedTextShared,
  getState as getEmbeddingWorkerState,
  initEmbeddingWorker,
  reloadModel as reloadModelShared,
  subscribe as subscribeEmbeddingWorker,
} from "@/lib/embeddingWorkerStore";

type ModelStatus = "idle" | "loading" | "ready" | "error";

type CacheUsage = {
  files: number;
  bytes: number;
  hasModel: boolean;
};

type WorkerResult = {
  id: string;
  text: string;
  vector: Float32Array;
  source: "huggingface" | "fallback";
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

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function cosineSimilarity(a?: Float32Array, b?: Float32Array) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

function stableHash(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

/** Posts that should be rejected. Used as the "toxic" reference set. */
const TOXIC_SEEDS = [
  "You are a worthless idiot and nobody wants you here, just shut up and disappear.",
  "All of those people are disgusting parasites who should be run out of town.",
  "I hope something terrible happens to you and your whole family, you deserve it.",
  "Anyone who supports this is a brainless moron and a traitor to this country.",
  "Get out of our neighbourhood, you filth, before we make you leave.",
  "These subhuman scum are ruining everything and deserve to be crushed.",
];

/** Posts that should be accepted. Used as the "non-toxic" reference set. */
const SAFE_SEEDS = [
  "I disagree with the budget plan, but I appreciate the work council is doing.",
  "Can we get more frequent buses on the east route during rush hour?",
  "The new park is lovely and my kids love the splash pad in the summer.",
  "I think we should fund mental health services more generously this year.",
  "Thanks to the volunteers who cleaned up the trail after the storm.",
  "Please fix the potholes on Main Street before winter arrives.",
];

/** Cosine similarity at/above which a post is flagged as toxic. */
const TOXIC_THRESHOLD = 0.45;

// ---------------------------------------------------------------------------
// Worker hook (mirrors CategorizePostWidget so both widgets share behaviour)
// ---------------------------------------------------------------------------

function useEmbeddingWorker() {
  // Read the shared singleton store so both widgets observe the same model
  // status / cache usage. The store owns the single worker for the page.
  const snapshot = useSyncExternalStore(
    subscribeEmbeddingWorker,
    getEmbeddingWorkerState,
    getEmbeddingWorkerState
  );

  useEffect(() => {
    initEmbeddingWorker();
  }, []);

  return {
    modelStatus: snapshot.status,
    cache: snapshot.cache,
    busy: snapshot.busy,
    clearCache: clearCacheShared,
    reloadModel: reloadModelShared,
    embed: embedTextShared,
  };
}

// ---------------------------------------------------------------------------
// Model lifecycle UI (spinner / cleared gate / controls)
// ---------------------------------------------------------------------------

function ModelSpinner({ label = "Loading moderation model…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="max-w-xs text-xs text-slate-400">
        The embedding model is downloading and warming up. This only happens once.
      </p>
    </div>
  );
}

function ModelGate({
  modelStatus,
  cache,
  busy,
  onReload,
  children,
}: {
  modelStatus: ModelStatus;
  cache: CacheUsage;
  busy: "none" | "clearing" | "reloading";
  onReload: () => void;
  children: React.ReactNode;
}) {
  if (modelStatus === "ready") return <>{children}</>;

  if (modelStatus === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Database className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">Model cache cleared</p>
          <p className="max-w-xs text-xs text-slate-400">
            Reload the moderation model to start screening posts again.
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Cache: {formatBytes(cache.bytes)}
            {cache.files > 0 ? ` · ${cache.files} file${cache.files === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={busy !== "none"}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "reloading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Reload model
        </button>
      </div>
    );
  }

  if (modelStatus === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-sm font-semibold text-rose-600">The model failed to load.</p>
        <button
          type="button"
          onClick={onReload}
          disabled={busy !== "none"}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "reloading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Retry
        </button>
      </div>
    );
  }

  return <ModelSpinner />;
}

function ModelControls({
  modelStatus,
  cache,
  busy,
  onClearCache,
  onReload,
}: {
  modelStatus: ModelStatus;
  cache: CacheUsage;
  busy: "none" | "clearing" | "reloading";
  onClearCache: () => void;
  onReload: () => void;
}) {
  const isReady = modelStatus === "ready";
  const isCleared = modelStatus === "idle" && !cache.hasModel;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
        <Database className="h-3.5 w-3.5" />
        Cache: {formatBytes(cache.bytes)}
        {cache.files > 0 ? ` · ${cache.files} file${cache.files === 1 ? "" : "s"}` : ""}
      </span>

      {isCleared ? (
        <button
          type="button"
          onClick={onReload}
          disabled={busy !== "none"}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-700 px-3 py-1 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "reloading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Reload model
        </button>
      ) : (
        <button
          type="button"
          onClick={onClearCache}
          disabled={busy !== "none" || !isReady}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "clearing" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Clear cache
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Moderation data model
// ---------------------------------------------------------------------------

type ModerationVerdict = "accepted" | "review" | "rejected";

type ModeratedPost = {
  id: string;
  text: string;
  source: WorkerResult["source"];
  vector?: Float32Array;
  verdict: ModerationVerdict;
  /** Highest similarity to any toxic seed. */
  toxicScore: number;
  /** Highest similarity to any safe seed. */
  safeScore: number;
  isSeed: boolean;
  /** Set once a human has reviewed the post, overriding the model verdict. */
  reviewed?: "approved" | "reported";
  /** Layout position inside its container (0..1 normalized). */
  x: number;
  y: number;
};

export interface AutoModeratePostWidgetProps {
  toxicSeeds?: string[];
  safeSeeds?: string[];
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
}

function scoreAgainstSeeds(
  vector: Float32Array,
  toxicVectors: Float32Array[],
  safeVectors: Float32Array[]
) {
  let toxicScore = 0;
  let safeScore = 0;
  for (const seed of toxicVectors) {
    toxicScore = Math.max(toxicScore, cosineSimilarity(vector, seed));
  }
  for (const seed of safeVectors) {
    safeScore = Math.max(safeScore, cosineSimilarity(vector, seed));
  }
  return { toxicScore, safeScore };
}

function decideVerdict(toxicScore: number, safeScore: number): ModerationVerdict {
  // The relative check (closer to the toxic set than the safe set) prevents a
  // benign post that merely shares vocabulary with a toxic seed from being
  // flagged. Above the absolute threshold we auto-reject; between the safe set
  // and the threshold we route to human review.
  if (toxicScore > safeScore) {
    if (toxicScore >= TOXIC_THRESHOLD) return "rejected";
    return "review";
  }
  return "accepted";
}

/**
 * Redact a seeded toxic post for display: every non-whitespace character is
 * replaced with "x" so the reference text is never shown verbatim, while the
 * word shape (and therefore the length) is preserved.
 */
function redactText(text: string) {
  return text.replace(/\S/g, "x");
}

/** Whether a post's text must be redacted when rendered. */
function isRedacted(post: ModeratedPost) {
  return post.isSeed && post.verdict === "rejected";
}

/**
 * Renders post text, applying a Gaussian blur on top of the "x" redaction for
 * seeded toxic posts so the original wording cannot be recovered visually.
 */
function PostText({ post, className }: { post: ModeratedPost; className?: string }) {
  if (!isRedacted(post)) {
    return <span className={className}>{post.text}</span>;
  }
  return (
    <span
      className={className}
      style={{ filter: "blur(4px)", userSelect: "none" }}
      aria-label="Redacted toxic reference post"
    >
      {redactText(post.text)}
    </span>
  );
}

function layoutPosition(text: string, index: number) {
  const hash = stableHash(text);
  const angle = ((hash % 360) * Math.PI) / 180;
  const ring = 0.18 + ((index % 4) * 0.16);
  return {
    x: clamp(0.5 + Math.cos(angle) * ring, 0.08, 0.92),
    y: clamp(0.5 + Math.sin(angle) * ring, 0.1, 0.9),
  };
}

// ---------------------------------------------------------------------------
// Force layout
// ---------------------------------------------------------------------------
//
// The clusters are rendered in a square viewBox so circles stay circular. A
// d3-force simulation pulls every node toward the bottom of its container and
// resolves overlaps with a collision force.

/** ViewBox is square, so 1 unit == 1% of the container width. */
const VIEW_SIZE = 100;
/** Node radius in viewBox units (seeds are drawn slightly larger). */
const NODE_RADIUS = 3.4;
/** Extra breathing room between colliding nodes. */
const COLLISION_PADDING = 1.2;
/**
 * Maximum absolute velocity (viewBox units per tick) a node may carry. The
 * gravity (forceY) pull is intentionally gentle, but collision resolution can
 * still impart large impulses; clamping the velocity keeps nodes from shooting
 * across the container.
 */
const MAX_VELOCITY = 1.5;

type ForceNode = SimulationNodeDatum & {
  id: string;
  radius: number;
};

function createForceSimulation(
  nodes: ForceNode[],
  onTick: (nodes: ForceNode[]) => void
): Simulation<ForceNode, undefined> {
  return forceSimulation<ForceNode>(nodes)
    .force("x", forceX(VIEW_SIZE / 2).strength(0.04))
    .force("y", forceY(VIEW_SIZE - NODE_RADIUS - 2).strength(0.08))
    .force(
      "collide",
      forceCollide<ForceNode>()
        .radius((node) => node.radius + COLLISION_PADDING)
        .strength(0.7)
        .iterations(2)
    )
    .alphaDecay(0.035)
    .velocityDecay(0.55)
    .on("tick", () => {
      for (const node of nodes) {
        // Dampen and cap the node velocity so collision impulses and the
        // gravity pull cannot fling nodes across the container.
        const vx = clamp(node.vx ?? 0, -MAX_VELOCITY, MAX_VELOCITY);
        const vy = clamp(node.vy ?? 0, -MAX_VELOCITY, MAX_VELOCITY);
        node.vx = vx;
        node.vy = vy;
        node.x = clamp(node.x ?? VIEW_SIZE / 2, node.radius, VIEW_SIZE - node.radius);
        node.y = clamp(node.y ?? VIEW_SIZE / 2, node.radius, VIEW_SIZE - node.radius);
      }
      onTick(nodes);
    });
}

// ---------------------------------------------------------------------------
// Visualization: two containers of nodes
// ---------------------------------------------------------------------------

const CLUSTER_TONES = {
  accepted: {
    accent: "#2563eb",
    accentSoft: "rgba(37,99,235,0.16)",
    border: "border-blue-200 bg-blue-50/40",
    empty: "Nothing awaiting review",
    Icon: CheckCircle2,
  },
  review: {
    accent: "#d97706",
    accentSoft: "rgba(217,119,6,0.16)",
    border: "border-amber-200 bg-amber-50/40",
    empty: "Nothing awaiting review",
    Icon: ShieldAlert,
  },
  rejected: {
    accent: "#dc2626",
    accentSoft: "rgba(220,38,38,0.16)",
    border: "border-rose-200 bg-rose-50/40",
    empty: "Nothing awaiting review",
    Icon: XCircle,
  },
} as const;

function NodeCluster({
  title,
  posts,
  tone,
  activeId,
  onSelect,
}: {
  title: string;
  posts: ModeratedPost[];
  tone: ModerationVerdict;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const { accent, accentSoft, border, empty, Icon } = CLUSTER_TONES[tone];

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const simulationRef = useRef<Simulation<ForceNode, undefined> | null>(null);

  // Keep a stable signature so the simulation only restarts when the set of
  // nodes changes, not on every parent re-render.
  const nodeSignature = posts.map((post) => post.id).join("|");

  useEffect(() => {
    // Reuse the live positions of nodes that already exist so adding a new
    // node does not reset the layout of the rest of the cluster.
    const nodes: ForceNode[] = posts.map((post) => {
      const radius = post.isSeed ? NODE_RADIUS : NODE_RADIUS - 0.6;
      const existing = positions[post.id];
      return {
        id: post.id,
        radius,
        x: existing?.x ?? post.x * VIEW_SIZE,
        y: existing?.y ?? post.y * VIEW_SIZE,
      };
    });

    if (nodes.length === 0) return;

    const simulation = createForceSimulation(nodes, (ticked) => {
      const next: Record<string, { x: number; y: number }> = {};
      for (const node of ticked) {
        next[node.id] = { x: node.x ?? VIEW_SIZE / 2, y: node.y ?? VIEW_SIZE / 2 };
      }
      setPositions(next);
    });
    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeSignature]);

  return (
    <div className={`flex flex-col overflow-hidden rounded-3xl border ${border}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/60 px-4 py-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-bold"
          style={{ backgroundColor: accentSoft, color: accent }}
        >
          <Icon className="h-4 w-4" />
          {title}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ backgroundColor: accentSoft, color: accent }}
        >
          {posts.length}
        </span>
      </div>

      <div className="relative h-[160px] w-full">
        {posts.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-xs font-medium text-slate-400">
            {empty}
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full"
          >
            {posts.map((post) => {
              const isActive = activeId === post.id;
              const radius = post.isSeed ? NODE_RADIUS : NODE_RADIUS - 0.6;
              const position = positions[post.id] ?? {
                x: post.x * VIEW_SIZE,
                y: post.y * VIEW_SIZE,
              };
              return (
                <g
                  key={post.id}
                  transform={`translate(${position.x}, ${position.y})`}
                  onClick={() => onSelect(post.id)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={radius + (isActive ? 1.6 : 0.9)}
                    fill={accentSoft}
                    opacity={isActive ? 0.9 : 0.55}
                  />
                  <circle
                    r={radius}
                    fill={accent}
                    opacity={isActive ? 1 : 0.88}
                    stroke={isActive ? "#ffffff" : "rgba(15,23,42,0.25)"}
                    strokeWidth={isActive ? 0.8 : 0.4}
                  />
                  <title>{isRedacted(post) ? redactText(post.text) : post.text}</title>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export default function AutoModeratePostWidget({
  toxicSeeds = TOXIC_SEEDS,
  safeSeeds = SAFE_SEEDS,
  title = "Automated post moderation",
  subtitle = "Posts are screened against a reference set of toxic and safe examples. Posts closest to the toxic set are rejected, borderline ones are sent for human review, and the rest are accepted.",
  placeholder = "Add a post to screen, e.g. 'I disagree with the plan but respect the process'",
  className = "",
}: AutoModeratePostWidgetProps) {
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState<ModeratedPost[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screening, setScreening] = useState(false);
  const { modelStatus, cache, busy, clearCache, reloadModel, embed } =
    useEmbeddingWorker();

  const seededRef = useRef(false);
  const toxicVectorsRef = useRef<Float32Array[]>([]);
  const safeVectorsRef = useRef<Float32Array[]>([]);

  // Seed the reference sets and the initial post list once the model is ready.
  useEffect(() => {
    if (modelStatus !== "ready" || seededRef.current) return;
    seededRef.current = true;

    let cancelled = false;
    const seed = async () => {
      setScreening(true);
      try {
        const toxicVectors: Float32Array[] = [];
        const safeVectors: Float32Array[] = [];
        const seededPosts: ModeratedPost[] = [];

        for (const text of toxicSeeds) {
          const result = await embed(text);
          if (cancelled) return;
          if (!result) continue;
          toxicVectors.push(result.vector);
          const position = layoutPosition(text, seededPosts.length);
          seededPosts.push({
            id: makeId(),
            text,
            source: result.source,
            vector: result.vector,
            verdict: "rejected",
            toxicScore: 1,
            safeScore: 0,
            isSeed: true,
            ...position,
          });
        }

        for (const text of safeSeeds) {
          const result = await embed(text);
          if (cancelled) return;
          if (!result) continue;
          safeVectors.push(result.vector);
          const position = layoutPosition(text, seededPosts.length);
          seededPosts.push({
            id: makeId(),
            text,
            source: result.source,
            vector: result.vector,
            verdict: "accepted",
            toxicScore: 0,
            safeScore: 1,
            isSeed: true,
            ...position,
          });
        }

        if (cancelled) return;
        toxicVectorsRef.current = toxicVectors;
        safeVectorsRef.current = safeVectors;
        setPosts(seededPosts);
        setActiveId(seededPosts[0]?.id ?? null);
      } finally {
        if (!cancelled) setScreening(false);
      }
    };

    void seed();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelStatus]);

  const screenPost = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (modelStatus !== "ready") {
      void reloadModel();
      return;
    }

    setScreening(true);
    try {
      const result = await embed(trimmed);
      if (!result) return;

      const { toxicScore, safeScore } = scoreAgainstSeeds(
        result.vector,
        toxicVectorsRef.current,
        safeVectorsRef.current
      );
      const verdict = decideVerdict(toxicScore, safeScore);

      const position = layoutPosition(trimmed, posts.length);
      const nextPost: ModeratedPost = {
        id: makeId(),
        text: trimmed,
        source: result.source,
        vector: result.vector,
        verdict,
        toxicScore,
        safeScore,
        isSeed: false,
        ...position,
      };

      setPosts((current) => [nextPost, ...current]);
      setActiveId(nextPost.id);
      setInput("");
    } finally {
      setScreening(false);
    }
  };

  const approvePost = (id: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, verdict: "accepted", reviewed: "approved" as const }
          : post
      )
    );
  };

  const reportPost = (id: string) => {
    const target = posts.find((post) => post.id === id);
    if (!target) return;

    // A reported post becomes a flagged reference: its vector joins the toxic
    // seed set so future posts are compared against it.
    if (target.vector) {
      toxicVectorsRef.current = [...toxicVectorsRef.current, target.vector];
    }

    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              verdict: "rejected" as const,
              reviewed: "reported" as const,
              toxicScore: 1,
              safeScore: 0,
            }
          : post
      )
    );
  };

  const accepted = useMemo(() => posts.filter((post) => post.verdict === "accepted"), [posts]);
  const review = useMemo(() => posts.filter((post) => post.verdict === "review"), [posts]);
  const rejected = useMemo(() => posts.filter((post) => post.verdict === "rejected"), [posts]);
  const activePost = useMemo(
    () => posts.find((post) => post.id === activeId) ?? posts[0] ?? null,
    [activeId, posts]
  );

  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 sm:p-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Content moderation
          </div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
          <p className="max-w-3xl text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>

      <ModelGate
        modelStatus={modelStatus}
        cache={cache}
        busy={busy}
        onReload={() => void reloadModel()}
      >
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void screenPost();
                  }
                }}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => void screenPost()}
                disabled={screening}
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {screening ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Screen post
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                Toxic threshold: {Math.round(TOXIC_THRESHOLD * 100)}%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                Accepted: {accepted.length}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Review: {review.length}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                Rejected: {rejected.length}
              </span>
            </div>

            <ModelControls
              modelStatus={modelStatus}
              cache={cache}
              busy={busy}
              onClearCache={() => void clearCache()}
              onReload={() => void reloadModel()}
            />
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <NodeCluster
              title="Accepted"
              posts={accepted}
              tone="accepted"
              activeId={activeId}
              onSelect={setActiveId}
            />
            <NodeCluster
              title="Requires moderation"
              posts={review}
              tone="review"
              activeId={activeId}
              onSelect={setActiveId}
            />
            <NodeCluster
              title="Rejected"
              posts={rejected}
              tone="rejected"
              activeId={activeId}
              onSelect={setActiveId}
            />
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[3fr_2fr]">
          <div className="border-b border-slate-200 bg-white p-4 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
                Post detail
              </h3>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {screening ? "screening" : "ready"}
              </span>
            </div>

            {activePost ? (
              <div
                className={`mt-4 rounded-2xl border p-4 ${
                  activePost.verdict === "rejected"
                    ? "border-rose-200 bg-rose-50"
                    : activePost.verdict === "review"
                      ? "border-amber-200 bg-amber-50"
                      : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {activePost.isSeed ? "Reference post" : "Screened post"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
                      activePost.verdict === "rejected"
                        ? "bg-rose-600"
                        : activePost.verdict === "review"
                          ? "bg-amber-600"
                          : "bg-blue-600"
                    }`}
                  >
                    {activePost.verdict === "rejected" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : activePost.verdict === "review" ? (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {activePost.verdict === "rejected"
                      ? "Rejected"
                      : activePost.verdict === "review"
                        ? "Requires moderation"
                        : "Accepted"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-800">
                  <PostText post={activePost} />
                </p>

                {!activePost.isSeed ? (
                  <div className="mt-4 space-y-2">
                    <ScoreBar
                      label="Toxic similarity"
                      score={activePost.toxicScore}
                      color="#dc2626"
                      threshold={TOXIC_THRESHOLD}
                    />
                    <ScoreBar
                      label="Safe similarity"
                      score={activePost.safeScore}
                      color="#2563eb"
                    />
                  </div>
                ) : null}

                {!activePost.isSeed &&
                (activePost.verdict === "accepted" || activePost.verdict === "review") ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => approvePost(activePost.id)}
                      disabled={activePost.reviewed === "approved"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reportPost(activePost.id)}
                      disabled={activePost.reviewed === "reported"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Report
                    </button>
                  </div>
                ) : null}

                {activePost.reviewed ? (
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {activePost.reviewed === "approved"
                      ? "Approved by a moderator"
                      : "Reported · added to the toxic reference set"}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Add a post to screen it, or click a node to inspect why it was accepted, flagged for
                review, or rejected.
              </div>
            )}
          </div>

          <aside className="bg-white p-4 sm:p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recent posts
            </div>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setActiveId(post.id)}
                  className="flex w-full items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      post.verdict === "rejected"
                        ? "bg-rose-100 text-rose-600"
                        : post.verdict === "review"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {post.verdict === "rejected" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : post.verdict === "review" ? (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="line-clamp-2 text-sm font-medium text-slate-800">
                    <PostText post={post} />
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </ModelGate>
    </section>
  );
}

function ScoreBar({
  label,
  score,
  color,
  threshold,
}: {
  label: string;
  score: number;
  color: string;
  threshold?: number;
}) {
  const pct = Math.round(clamp(score, 0, 1) * 100);
  const thresholdPct =
    typeof threshold === "number" ? Math.round(clamp(threshold, 0, 1) * 100) : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>{label}</span>
        <span className="font-mono text-slate-600">{pct}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        {thresholdPct !== null ? (
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-900/60"
            style={{ left: `${thresholdPct}%` }}
            title={`Threshold ${thresholdPct}%`}
          />
        ) : null}
      </div>
    </div>
  );
}