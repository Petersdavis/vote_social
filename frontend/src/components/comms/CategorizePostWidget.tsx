"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Binary,
  Briefcase,
  BusFront,
  CloudRainWind,
  DollarSign,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  Palette,
  Plane,
  Scale,
  ShieldAlert,
  Sparkles,
  Plus,
  Vote,
  Globe,
  Database,
  Loader2,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";
import {
  clearCache as clearCacheShared,
  embed as embedTextShared,
  getState as getEmbeddingWorkerState,
  initEmbeddingWorker,
  reloadModel as reloadModelShared,
  subscribe as subscribeEmbeddingWorker,
} from "@/lib/embeddingWorkerStore";

type WidgetVariant = "autocluster" | "fixed-categories";

type TopicNode = {
  id: string;
  label: string;
  text: string;
  vector?: Float32Array;
  kind: "topic" | "category";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isSeed: boolean;
  score?: number;
  categoryId?: string;
};

type WorkerResult = {
  id: string;
  text: string;
  vector: Float32Array;
  source: "huggingface" | "fallback";
};

type ModelStatus = "idle" | "loading" | "ready" | "error";

type CacheUsage = {
  files: number;
  bytes: number;
  hasModel: boolean;
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

// Global preference shared with the auto-moderation widget via localStorage.
// When a user clears the cache we remember that they do not want the model
// auto-downloaded on the next mount (in this or any other widget).

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

type ForceSample = {
  source: TopicNode;
  target: TopicNode;
  strength: number;
};

type CategoryDefinition = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  vector?: Float32Array;
};

type CategoryMatch = {
  category: CategoryDefinition;
  score: number;
};

type ClassifiedPost = {
  id: string;
  text: string;
  source: WorkerResult["source"];
  vector: Float32Array;
  matches: CategoryMatch[];
};

export interface CategorizePostWidgetProps {
  variant?: WidgetVariant;
  initialTopics?: string[];
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
}

const DEFAULT_TOPICS = [
  "Transit delays and bus reliability",
  "Affordable housing near schools",
  "Bike lanes and street safety",
  "Property taxes and budget priorities",
  "Parks, libraries, and recreation",
  "Construction noise and road closures",
];

const DEFAULT_POSTS = [
  "Groceries are getting more expensive and families need relief.",
  "Hospital wait times and access to mental health care are still a problem.",
  "The city needs more transit and safer roads for commuters.",
  "Taxes, budgets, and public spending should be easier to understand.",
];

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#db2777",
  "#0f766e",
  "#ca8a04",
  "#4f46e5",
];

const CATEGORY_THRESHOLD = 0.3;
const WIDTH = 720;
const HEIGHT = 520;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "cost-of-living",
    title: "Cost of Living & Inflation",
    description: "groceries, consumer prices, household affordability",
    icon: DollarSign,
    color: "#2563eb",
  },
  {
    id: "jobs-growth",
    title: "Jobs, Wages & Economic Growth",
    description: "employment, small business, productivity, industry",
    icon: Briefcase,
    color: "#7c3aed",
  },
  {
    id: "taxes-spending",
    title: "Taxes & Public Spending",
    description: "income/sales/property taxes, deficits, government budgets",
    icon: Landmark,
    color: "#059669",
  },
  {
    id: "housing-development",
    title: "Housing & Urban Development",
    description: "rent, home prices, zoning, homelessness, supply",
    icon: Home,
    color: "#ea580c",
  },
  {
    id: "healthcare-mental-health",
    title: "Healthcare & Mental Health",
    description: "hospitals, wait times, pharmacare, mental health services",
    icon: HeartPulse,
    color: "#db2777",
  },
  {
    id: "education-childcare",
    title: "Education & Childcare",
    description: "K–12 schools, post-secondary tuition, daycare",
    icon: GraduationCap,
    color: "#0f766e",
  },
  {
    id: "climate-energy-environment",
    title: "Climate, Energy & Environment",
    description: "emissions, oil/gas, renewables, conservation, water",
    icon: CloudRainWind,
    color: "#ca8a04",
  },
  {
    id: "transportation-infrastructure",
    title: "Transportation & Infrastructure",
    description: "public transit, roads, bridges, telecom, utilities",
    icon: BusFront,
    color: "#4f46e5",
  },
  {
    id: "crime-public-safety",
    title: "Crime, Justice & Public Safety",
    description: "policing, courts, bail/sentencing, gun policy, emergency response",
    icon: ShieldAlert,
    color: "#2563eb",
  },
  {
    id: "immigration-border-policy",
    title: "Immigration & Border Policy",
    description: "immigration levels, refugees, temporary workers, integration",
    icon: Globe,
    color: "#7c3aed",
  },
  {
    id: "social-services-poverty",
    title: "Social Services & Poverty Reduction",
    description: "pensions, disability support, welfare, food security",
    icon: HandHeart,
    color: "#059669",
  },
  {
    id: "civil-rights-equity-indigenous",
    title: "Civil Rights, Equity & Indigenous Affairs",
    description: "reconciliation, anti-discrimination, accessibility, language rights",
    icon: Scale,
    color: "#ea580c",
  },
  {
    id: "democratic-reform-accountability",
    title: "Democratic Reform & Government Accountability",
    description: "electoral systems, lobbying, transparency, corruption",
    icon: Vote,
    color: "#db2777",
  },
  {
    id: "foreign-policy-defense",
    title: "Foreign Policy, Trade & National Defense",
    description: "tariffs, diplomacy, military, international aid",
    icon: Plane,
    color: "#0f766e",
  },
  {
    id: "technology-privacy-digital",
    title: "Technology, Privacy & Digital Policy",
    description: "AI regulation, data privacy, online speech, cybersecurity",
    icon: Binary,
    color: "#ca8a04",
  },
  {
    id: "arts-culture-heritage",
    title: "Arts, Culture & Heritage",
    description: "arts funding, museums, cultural institutions, public broadcasting, heritage preservation",
    icon: Palette,
    color: "#4f46e5",
  },
];

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

function createNode(label: string, index: number, isSeed: boolean): TopicNode {
  const angle = (index / 8) * Math.PI * 2;
  const baseRadius = isSeed ? 120 + (index % 3) * 18 : 160 + (index % 5) * 12;
  const hash = stableHash(label);
  // Seed a small random velocity so the simulation has something to integrate.
  // Without it, nodes sitting outside every force's activation radius would
  // never move (vx = vy = 0 is a fixed point of the integrator).
  const jitterAngle = (hash % 360) * (Math.PI / 180);
  const jitterSpeed = 0.6 + (hash % 5) * 0.15;
  return {
    id: makeId(),
    label,
    text: label,
    x: CENTER_X + Math.cos(angle) * baseRadius,
    y: CENTER_Y + Math.sin(angle) * baseRadius,
    vx: Math.cos(jitterAngle) * jitterSpeed,
    vy: Math.sin(jitterAngle) * jitterSpeed,
    radius: isSeed ? 9 + (hash % 3) : 8 + (hash % 3),
    color: COLORS[hash % COLORS.length],
    isSeed,
    kind: "topic",
  };
}

function createCategoryNode(category: CategoryDefinition, index: number): TopicNode {
  const angle = (index / CATEGORY_DEFINITIONS.length) * Math.PI * 2;
  const baseRadius = 182;

  return {
    id: `category-${category.id}`,
    label: category.title,
    text: `${category.title}. ${category.description}`,
    x: CENTER_X + Math.cos(angle) * baseRadius,
    y: CENTER_Y + Math.sin(angle) * baseRadius,
    vx: 0,
    vy: 0,
    radius: 18,
    color: category.color,
    isSeed: true,
    kind: "category",
    categoryId: category.id,
  };
}

function findClosestNode(nodes: TopicNode[], vector: Float32Array, excludeId?: string) {
  let bestNode: TopicNode | null = null;
  let bestSimilarity = -Infinity;

  for (const node of nodes) {
    if (node.id === excludeId || !node.vector) continue;
    const similarity = cosineSimilarity(node.vector, vector);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestNode = node;
    }
  }

  return bestNode;
}

function findClosestCategory(categories: TopicNode[], vector?: Float32Array) {
  if (!vector) return null;

  let bestCategory: TopicNode | null = null;
  let bestSimilarity = -Infinity;

  for (const category of categories) {
    if (!category.vector) continue;
    const similarity = cosineSimilarity(category.vector, vector);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestCategory = category;
    }
  }

  return bestCategory;
}

function placeNodeAdjacentTo(anchor: TopicNode, label: string, radius: number) {
  const angle = ((stableHash(label) % 360) * Math.PI) / 180;
  const distance = anchor.radius + radius + 30;

  return {
    x: clamp(anchor.x + Math.cos(angle) * distance, 36, WIDTH - 36),
    y: clamp(anchor.y + Math.sin(angle) * distance, 36, HEIGHT - 36),
  };
}

function buildEdgeSamples(nodes: TopicNode[], categories: TopicNode[]): ForceSample[] {
  const edges: ForceSample[] = [];

  // Topic-to-topic edges: only pairs whose similarity clears the strong
  // threshold used for the J attraction force.
  for (let i = 0; i < nodes.length; i++) {
    const source = nodes[i];
    if (source.kind === "category") continue;
    for (let j = i + 1; j < nodes.length; j++) {
      const target = nodes[j];
      if (target.kind === "category") continue;
      const similarity = cosineSimilarity(source.vector, target.vector);
      if (similarity < PAIR_ATTRACTION_THRESHOLD) continue;
      edges.push({
        source,
        target,
        strength: clamp((similarity + 1) / 2, 0.08, 0.7),
      });
    }
  }

  // Topic-to-category edges: link a topic to every category whose similarity
  // clears the category threshold. Thickness is derived from the raw similarity.
  for (const node of nodes) {
    if (node.kind === "category" || !node.vector) continue;
    for (const category of categories) {
      if (category.kind !== "category" || !category.vector) continue;
      const similarity = cosineSimilarity(node.vector, category.vector);
      if (similarity < CATEGORY_THRESHOLD) continue;
      edges.push({
        source: node,
        target: category,
        strength: similarity,
      });
    }
  }

  return edges.sort((a, b) => b.strength - a.strength);
}

// Force tuning constants for the automatic clustering model.
const CATEGORY_ATTRACTION_K = 0.16; // pull toward every category above threshold
const PAIR_ATTRACTION_J = 0.42; // stronger pull between very similar nodes
const PAIR_ATTRACTION_THRESHOLD = 0.45; // cosine similarity required for J
const VELOCITY_DAMPING = 0.92;
// Hard circular boundary: topic nodes may never leave this radius from the
// canvas center. Kept just inside the category ring (categories sit at 182 px
// with radius 18, so their inner edge is 164 px) so the dashed boundary circle
// never overlaps a category node.
const CENTER_BOUNDARY_RADIUS = 150; // px

// Hard circular boundary. If the node is at/outside CENTER_BOUNDARY_RADIUS and
// its velocity points away from the center, snap it back onto the circle and
// zero its velocity outright. This is a position/velocity constraint, not a
// force, so it cannot oscillate.
function constrainToBoundary(node: TopicNode) {
  const dx = node.x - CENTER_X;
  const dy = node.y - CENTER_Y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= CENTER_BOUNDARY_RADIUS) return;

  // Only intervene when the node is actually moving outward.
  const outward = node.vx * dx + node.vy * dy;
  if (outward <= 0) return;

  const nx = dx / distance;
  const ny = dy / distance;

  // Clamp position onto the boundary circle and stop the node.
  node.x = CENTER_X + nx * CENTER_BOUNDARY_RADIUS;
  node.y = CENTER_Y + ny * CENTER_BOUNDARY_RADIUS;
  node.vx = 0;
  node.vy = 0;
}

// Categories are pinned: zero their velocity so they never drift.
function pinCategories(nodes: TopicNode[]) {
  for (const node of nodes) {
    if (node.kind !== "category") continue;
    node.vx = 0;
    node.vy = 0;
  }
}

// Force K: attract a node toward every category whose similarity passes the
// threshold. Multi-label nodes settle between their matching categories.
function applyCategoryAttraction(node: TopicNode, categories: TopicNode[]) {
  if (!node.vector) return;
  for (const category of categories) {
    if (category.kind !== "category" || !category.vector) continue;
    const similarity = cosineSimilarity(node.vector, category.vector);
    if (similarity < CATEGORY_THRESHOLD) continue;

    const dx = category.x - node.x;
    const dy = category.y - node.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const force = CATEGORY_ATTRACTION_K * similarity;
    node.vx += (dx / distance) * force;
    node.vy += (dy / distance) * force;
  }
}

// Force J: a stronger spring between node pairs with very high similarity.
function applyPairwiseAttraction(node: TopicNode, other: TopicNode) {
  if (other.kind === "category") return;
  const similarity = cosineSimilarity(node.vector, other.vector);
  if (similarity < PAIR_ATTRACTION_THRESHOLD) return;

  const dx = other.x - node.x;
  const dy = other.y - node.y;
  const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const force = PAIR_ATTRACTION_J * similarity;
  node.vx += (dx / distance) * force;
  node.vy += (dy / distance) * force;
}

// Hard positional constraint between two topic nodes. If they overlap, push
// them apart along the line joining their centers until they are exactly
// touching (plus padding), and cancel the velocity component that drove them
// together. This is a position/velocity constraint, not a force, so it cannot
// oscillate the way a spring does.
function resolveNodeOverlap(node: TopicNode, other: TopicNode, padding: number) {
  const dx = other.x - node.x;
  const dy = other.y - node.y;
  const distance = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));
  const minDistance = node.radius + other.radius + padding;
  if (distance >= minDistance) return;

  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = minDistance - distance;

  // Separate the pair symmetrically so neither is favoured.
  const half = overlap / 2;
  node.x -= nx * half;
  node.y -= ny * half;
  other.x += nx * half;
  other.y += ny * half;

  // Remove the closing (relative) velocity along the contact normal so they
  // stop pushing into each other instead of bouncing.
  const relative = (other.vx - node.vx) * nx + (other.vy - node.vy) * ny;
  if (relative < 0) {
    const impulse = relative / 2;
    node.vx += impulse * nx;
    node.vy += impulse * ny;
    other.vx -= impulse * nx;
    other.vy -= impulse * ny;
  }
}

function integrate(node: TopicNode) {
  node.vx *= VELOCITY_DAMPING;
  node.vy *= VELOCITY_DAMPING;
  node.x += node.vx;
  node.y += node.vy;
  // The circular boundary is the single positional constraint; there is no
  // separate rectangular clamp, so the two can never fight each other.
  constrainToBoundary(node);
}

function stepSimulation(nodes: TopicNode[], categories: TopicNode[]) {
  const collisionPadding = 4;

  pinCategories(nodes);

  // 1. Accumulate forces (attraction only; repulsion is a hard constraint).
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.kind === "category") continue;

    applyCategoryAttraction(node, categories);

    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const other = nodes[j];
      if (other.kind === "category") continue;
      applyPairwiseAttraction(node, other);
    }
  }

  // 2. Integrate positions.
  for (const node of nodes) {
    if (node.kind === "category") continue;
    integrate(node);
  }

  // 3. Resolve overlaps as a hard positional constraint, then re-apply the
  //    circular boundary in case separation pushed a node outward.
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.kind === "category") continue;
    for (let j = i + 1; j < nodes.length; j++) {
      const other = nodes[j];
      if (other.kind === "category") continue;
      resolveNodeOverlap(node, other, collisionPadding);
    }
  }

  for (const node of nodes) {
    if (node.kind === "category") continue;
    constrainToBoundary(node);
  }
}

function CategoryBadge({
  category,
  score,
  compact = false,
}: {
  category: CategoryDefinition;
  score: number;
  compact?: boolean;
}) {
  const Icon = category.icon;

  if (compact) {
    return (
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: `${category.color}33`,
          backgroundColor: `${category.color}14`,
          color: category.color,
        }}
        title={`${category.title} · ${Math.round(score * 100)}%`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        borderColor: `${category.color}33`,
        backgroundColor: `${category.color}14`,
        color: category.color,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="whitespace-nowrap">{category.title}</span>
      <span className="opacity-70">{Math.round(score * 100)}%</span>
    </span>
  );
}

/**
 * Owns the embedding worker plus the model lifecycle state (status, cache
 * usage) and exposes control actions (clear cache / reload model). Both widget
 * variants share this so the spinner, cache readout and buttons behave the
 * same everywhere.
 */
function useEmbeddingWorker() {
  // Read the shared singleton store so every widget on the page observes the
  // exact same model status / cache usage. The store owns the single worker.
  const snapshot = useSyncExternalStore(
    subscribeEmbeddingWorker,
    getEmbeddingWorkerState,
    getEmbeddingWorkerState
  );

  useEffect(() => {
    initEmbeddingWorker();
  }, []);

  const embedText = useCallback(
    (text: string) => embedTextShared(text),
    []
  );

  return {
    modelStatus: snapshot.status,
    cache: snapshot.cache,
    busy: snapshot.busy,
    clearCache: clearCacheShared,
    reloadModel: reloadModelShared,
    embed: embedText,
  };
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

function ModelSpinner({ label = "Loading semantic model…" }: { label?: string }) {
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

/**
 * Blocks the widget body until the model is ready. While loading it renders
 * only a spinner; when the model has been cleared it renders only a reload
 * call to action. The full widget is rendered only when `modelStatus` is
 * "ready".
 */
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
            Reload the embedding model to start classifying again.
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

function AutoClusterWidget({
  initialTopics = DEFAULT_TOPICS,
  title = "Semantic Categorization",
  subtitle = "Seed a few topics, add a new one, and watch the ideas cluster by meaning.",
  placeholder = "Add a topic like 'fare-free transit for students'",
  className = "",
}: Omit<CategorizePostWidgetProps, "variant">) {
  const [input, setInput] = useState("");
  const [nodes, setNodes] = useState<TopicNode[]>(() =>
    initialTopics.map((topic, index) => createNode(topic, index, true))
  );
  const [categoryNodes, setCategoryNodes] = useState<TopicNode[]>(() =>
    CATEGORY_DEFINITIONS.map((category, index) => createCategoryNode(category, index))
  );
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("ready");
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [viewportTransform, setViewportTransform] = useState<ZoomTransform>(zoomIdentity);
  const { modelStatus, cache, busy, clearCache, reloadModel, embed } =
    useEmbeddingWorker();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<number | null>(null);

  const activeTopic = useMemo(
    () => nodes.find((node) => node.id === activeTopicId) ?? nodes[0] ?? null,
    [activeTopicId, nodes]
  );

  const edges = useMemo(() => buildEdgeSamples(nodes, categoryNodes), [nodes, categoryNodes]);

  // Only render the map once every category and every topic node has been
  // embedded, so colors, category assignments and similarity edges are all
  // computed before anything is drawn (no random-color flash, no reflow).
  const isFullyEmbedded = useMemo(
    () =>
      categoryNodes.every((category) => category.vector) &&
      nodes.every((node) => node.vector),
    [categoryNodes, nodes]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 3.2])
      .on("zoom", (event) => {
        setViewportTransform(event.transform);
      });

    const selection = select(svgRef.current);
    selection.call(behavior);

    return () => {
      selection.on(".zoom", null);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setNodes((current) => {
        const next = current.map((node) => ({ ...node }));
        stepSimulation(next, categoryNodes);
        return next;
      });
      simulationRef.current = window.requestAnimationFrame(tick);
    };

    simulationRef.current = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (simulationRef.current) {
        window.cancelAnimationFrame(simulationRef.current);
      }
    };
  }, [categoryNodes]);

  useEffect(() => {
    let cancelled = false;
    const enrich = async () => {
      // Wait until the model is loaded before requesting embeddings; otherwise
      // the first request would block on the download with no visible spinner.
      if (modelStatus !== "ready") return;
      setStatus((current) => (current === "error" ? current : "loading"));

      const missing = nodes.filter((node) => !node.vector).map((node) => node);
      for (const node of missing) {
        const result = await embed(node.text);
        if (cancelled || !result) return;

        setNodes((current) =>
          current.map((candidate) =>
            candidate.id === node.id
              ? {
                  ...candidate,
                  vector: result.vector,
                  color: findClosestCategory(categoryNodes, result.vector)?.color ?? candidate.color,
                  categoryId: findClosestCategory(categoryNodes, result.vector)?.categoryId,
                }
              : candidate
          )
        );
      }

      if (!cancelled) setStatus("ready");
    };

    void enrich();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, categoryNodes, modelStatus]);

  useEffect(() => {
    let cancelled = false;
    const enrichCategories = async () => {
      if (modelStatus !== "ready") return;

      for (const category of categoryNodes) {
        if (category.vector) continue;
        const result = await embed(category.text);
        if (cancelled || !result) return;

        setCategoryNodes((current) =>
          current.map((candidate) =>
            candidate.id === category.id
              ? {
                  ...candidate,
                  vector: result.vector,
                }
              : candidate
          )
        );

        // Re-color every vectorized node against the categories known so far so
        // a node's color always reflects its strongest category match, even if
        // it was embedded before the categories finished loading.
        const knownCategories = categoryNodes.map((candidate) =>
          candidate.id === category.id ? { ...candidate, vector: result.vector } : candidate
        );
        setNodes((current) => {
          let changed = false;
          const next = current.map((node) => {
            if (!node.vector) return node;
            const matched = findClosestCategory(knownCategories, node.vector);
            if (!matched) return node;
            if (node.color === matched.color && node.categoryId === matched.categoryId) {
              return node;
            }
            changed = true;
            return { ...node, color: matched.color, categoryId: matched.categoryId };
          });
          return changed ? next : current;
        });
      }
    };

    void enrichCategories();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryNodes, modelStatus]);

  const addTopic = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const next = createNode(trimmed, nodes.length, false);
    setNodes((current) => [next, ...current]);
    setActiveTopicId(next.id);
    setInput("");

    // If the model was cleared, kick off a reload and let the enrichment
    // effects embed the new node once the model reports ready.
    if (modelStatus !== "ready") {
      void reloadModel();
      return;
    }

    setStatus("loading");
    const result = await embed(trimmed);
    if (!result) return;
    const anchor = findClosestNode(nodes, result.vector, next.id);
    const matchedCategory = findClosestCategory(categoryNodes, result.vector);

    setNodes((current) =>
      current.map((candidate) => {
        if (candidate.id !== next.id) return candidate;

        const nextPosition = anchor
          ? placeNodeAdjacentTo(anchor, trimmed, candidate.radius)
          : { x: candidate.x, y: candidate.y };

        return {
          ...candidate,
          ...nextPosition,
          vector: result.vector,
          color: matchedCategory?.color ?? candidate.color,
          categoryId: matchedCategory?.categoryId,
        };
      })
    );
    setStatus("ready");
  };

  const highlightSet = useMemo(() => {
    if (!activeTopic) return new Set<string>();
    const related = new Set<string>([activeTopic.id]);
    for (const node of nodes) {
      if (node.id === activeTopic.id) continue;
      if (cosineSimilarity(activeTopic.vector, node.vector) > 0.32) {
        related.add(node.id);
      }
    }
    return related;
  }, [activeTopic, nodes]);

  // Score every topic node against the fixed category set so the detail panel
  // can render distance-sorted badges, mirroring the FixedCategoryWidget logic.
  const categoryMatchesByNode = useMemo(() => {
    const categoryVectors = categoryNodes
      .filter((category) => category.vector)
      .map((category) => ({
        category: CATEGORY_DEFINITIONS.find((definition) => definition.id === category.categoryId),
        vector: category.vector as Float32Array,
      }))
      .filter(
        (entry): entry is { category: CategoryDefinition; vector: Float32Array } =>
          Boolean(entry.category)
      );

    const map = new Map<string, CategoryMatch[]>();
    for (const node of nodes) {
      if (!node.vector) {
        map.set(node.id, []);
        continue;
      }
      const matches = categoryVectors
        .map(({ category, vector }) => ({
          category,
          score: cosineSimilarity(node.vector, vector),
        }))
        .filter((match) => match.score >= CATEGORY_THRESHOLD)
        .sort((a, b) => b.score - a.score);
      map.set(node.id, matches);
    }
    return map;
  }, [nodes, categoryNodes]);

  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Topic clustering
            </div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
            <p className="max-w-2xl text-sm text-slate-600">{subtitle}</p>
          </div>
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
                  void addTopic();
                }
              }}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => void addTopic()}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Add topic
            </button>
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

      <div className="bg-white p-4 sm:p-5">
        <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="block h-[420px] w-full touch-none rounded-3xl bg-slate-950"
          >
            <defs>
              <linearGradient id="nodeGlow" x1="0" x2="1">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.06" />
              </linearGradient>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
                />
              </filter>
            </defs>

            {isFullyEmbedded ? (
              <g transform={`translate(${viewportTransform.x}, ${viewportTransform.y}) scale(${viewportTransform.k})`}>
                <circle
                  cx={CENTER_X}
                  cy={CENTER_Y}
                  r={CENTER_BOUNDARY_RADIUS}
                  fill="none"
                  stroke="rgba(148,163,184,0.35)"
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                />
                {edges.map((edge) => {
                const isHighlighted =
                  highlightSet.has(edge.source.id) && highlightSet.has(edge.target.id);
                const isCategoryEdge =
                  edge.source.kind === "category" || edge.target.kind === "category";
                // Map similarity (0..1) to a 0.5px–2px stroke width.
                const strokeWidth = 0.5 + clamp(edge.strength, 0, 1) * 1.5;
                const categoryColor = isCategoryEdge
                  ? edge.source.kind === "category"
                    ? edge.source.color
                    : edge.target.color
                  : null;
                return (
                  <line
                    key={`${edge.source.id}-${edge.target.id}`}
                    x1={edge.source.x}
                    y1={edge.source.y}
                    x2={edge.target.x}
                    y2={edge.target.y}
                    stroke={
                      isHighlighted
                        ? "rgba(147,197,253,0.55)"
                        : categoryColor
                          ? `${categoryColor}66`
                          : "rgba(255,255,255,0.12)"
                    }
                    strokeWidth={isHighlighted ? Math.max(strokeWidth, 1.5) : strokeWidth}
                  />
                );
              })}

              {categoryNodes.map((node) => {
                const definition = CATEGORY_DEFINITIONS.find(
                  (category) => category.id === node.categoryId
                );
                const Icon = definition?.icon;
                const iconSize = node.radius * 1.1;
                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    <circle
                      r={node.radius + 14}
                      fill="url(#nodeGlow)"
                      opacity={0.75}
                      filter="url(#softGlow)"
                    />
                    <circle
                      r={node.radius + 3}
                      fill="rgba(15,23,42,0.9)"
                      stroke={node.color}
                      strokeWidth={2.5}
                    />
                    <circle r={node.radius} fill={node.color} opacity={0.98} />
                    {Icon ? (
                      <Icon
                        x={-iconSize / 2}
                        y={-iconSize / 2}
                        width={iconSize}
                        height={iconSize}
                        color="#ffffff"
                        strokeWidth={2}
                      />
                    ) : null}
                    <title>{node.label}</title>
                  </g>
                );
              })}

              {nodes.map((node) => {
                const isActive = activeTopic?.id === node.id;
                const isRelated = highlightSet.has(node.id);
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setActiveTopicId(node.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      r={node.radius}
                      fill={node.color}
                      opacity={isActive ? 1 : isRelated ? 0.96 : 0.9}
                      stroke={isActive ? "#ffffff" : "rgba(15,23,42,0.9)"}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    <title>{node.label}</title>
                  </g>
                );
                })}
              </g>
            ) : (
              <g>
                {modelStatus === "ready" ? (
                  <text
                    x={CENTER_X}
                    y={CENTER_Y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(148,163,184,0.9)"
                    fontSize={14}
                    fontWeight={600}
                  >
                    Computing semantic map…
                  </text>
                ) : (
                  <g transform={`translate(${CENTER_X}, ${CENTER_Y})`}>
                    <circle
                      r={22}
                      fill="none"
                      stroke="rgba(148,163,184,0.25)"
                      strokeWidth={4}
                    />
                    <circle
                      r={22}
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeDasharray="34 104"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="0.9s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <text
                      y={48}
                      textAnchor="middle"
                      fill="rgba(148,163,184,0.9)"
                      fontSize={13}
                      fontWeight={600}
                    >
                      {modelStatus === "idle"
                        ? "Model cleared — reload to continue"
                        : modelStatus === "error"
                          ? "Model failed to load"
                          : "Loading semantic model…"}
                    </text>
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>

      <div className="grid gap-0 border-t border-slate-200">
        <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
              Topic detail
            </h3>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {modelStatus !== "ready"
                ? modelStatus === "idle"
                  ? "model cleared"
                  : modelStatus === "error"
                    ? "model error"
                    : "loading model"
                : status === "ready"
                  ? "ready"
                  : "loading"}
            </span>
          </div>

          {activeTopic ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Selected topic
                  </div>
                  <div className="mt-1 w-full max-w-[18rem] truncate text-base font-bold text-slate-900">
                    {activeTopic.label}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-600">
                {activeTopic.vector ? (
                  null
                ) : (
                  <>Waiting for semantic analysis to complete.</>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(categoryMatchesByNode.get(activeTopic.id) ?? []).length > 0 ? (
                  (categoryMatchesByNode.get(activeTopic.id) ?? []).map((match) => (
                    <CategoryBadge
                      key={match.category.id}
                      category={match.category}
                      score={match.score}
                    />
                  ))
                ) : (
                  <span className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {activeTopic.vector
                      ? `No category reached the ${Math.round(CATEGORY_THRESHOLD * 100)}% threshold.`
                      : "Scoring categories…"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Click a node to inspect its semantic neighborhood, or add a topic to place it into the map.
            </div>
          )}
        </div>

        <div className="bg-white p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Similar Posts
          </div>
          {activeTopic ? (
            <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
              {nodes
                .filter((node) => node.id !== activeTopic.id)
                .map((node) => ({
                  node,
                  score: cosineSimilarity(activeTopic.vector, node.vector),
                }))
                .sort((a, b) => b.score - a.score)
                .map(({ node, score }, index) => {
                  const nodeMatches = categoryMatchesByNode.get(node.id) ?? [];
                  return (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => setActiveTopicId(node.id)}
                        className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
                      >
                        <div className="flex w-full items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                            {index + 1}
                          </span>
                          <div className="truncate text-sm font-semibold text-slate-900">{node.label}</div>
                        </div>
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {nodeMatches.slice(0, 3).map((match) => (
                              <CategoryBadge
                                key={match.category.id}
                                category={match.category}
                                score={match.score}
                                compact
                              />
                            ))}
                          </div>
                          <span className="shrink-0 text-xs font-mono font-semibold text-slate-600">
                            {Math.round(score * 100)}% match
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
            </ol>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Select a topic to see its most similar posts.
            </div>
          )}
        </div>
      </div>
      </ModelGate>
    </section>
  );
}

function FixedCategoryWidget({
  initialTopics = DEFAULT_POSTS,
  title = "Fixed category bucketing",
  subtitle = "Classify posts into a fixed civic taxonomy and show badges when a post exceeds the alignment threshold.",
  placeholder = "Add a post like 'rent keeps rising and groceries are too expensive'",
  className = "",
}: Omit<CategorizePostWidgetProps, "variant">) {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [posts, setPosts] = useState<ClassifiedPost[]>([]);
  const [categories, setCategories] = useState<CategoryDefinition[]>(() =>
    CATEGORY_DEFINITIONS.map((category) => ({ ...category }))
  );
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const { modelStatus, cache, busy, clearCache, reloadModel, embed } =
    useEmbeddingWorker();
  const seededPostsRef = useRef(false);
  const categoriesRef = useRef<CategoryDefinition[]>(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);
  const categoriesReady = useMemo(
    () => categories.every((category) => Boolean(category.vector)),
    [categories]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const post of posts) {
      for (const match of post.matches) {
        counts[match.category.id] = (counts[match.category.id] ?? 0) + 1;
      }
    }
    return counts;
  }, [posts]);

  const activePost = useMemo(
    () => posts.find((post) => post.id === activePostId) ?? posts[0] ?? null,
    [activePostId, posts]
  );

  useEffect(() => {
    let cancelled = false;
    const enrichCategories = async () => {
      if (modelStatus !== "ready") return;
      setStatus((current) => (current === "error" ? current : "loading"));

      for (const category of categories) {
        if (category.vector) continue;
        const result = await embed(`${category.title}. ${category.description}`);
        if (cancelled || !result) return;

        setCategories((current) =>
          current.map((candidate) =>
            candidate.id === category.id
              ? {
                  ...candidate,
                  vector: result.vector,
                }
              : candidate
          )
        );
      }

      if (!cancelled) setStatus("ready");
    };

    void enrichCategories();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, modelStatus]);

  useEffect(() => {
    let cancelled = false;
    const seedPosts = async () => {
      if (!initialTopics.length || !categoriesReady || seededPostsRef.current) return;
      if (modelStatus !== "ready") return;

      // Claim the seed synchronously so overlapping effect runs (triggered by
      // each category vector update) cannot double-seed the post list.
      seededPostsRef.current = true;

      setStatus((current) => (current === "error" ? current : "loading"));
      const seeded: ClassifiedPost[] = [];

      for (const text of initialTopics) {
        const result = await embed(text);
        if (cancelled || !result) return;

        // Read the latest category vectors from the ref so every seeded post is
        // compared against the fully-enriched category set, not a stale closure.
        const matches = categoriesRef.current
          .filter((category) => category.vector)
          .map((category) => ({
            category,
            score: cosineSimilarity(result.vector, category.vector),
          }))
          .filter((match) => match.score >= CATEGORY_THRESHOLD)
          .sort((a, b) => b.score - a.score);

        seeded.push({
          id: makeId(),
          text,
          source: result.source,
          vector: result.vector,
          matches,
        });
      }

      if (cancelled) {
        // Allow a later run to retry if this one was torn down mid-flight.
        seededPostsRef.current = false;
        return;
      }

      if (seeded.length > 0) {
        setPosts(seeded);
        setActivePostId(seeded[0].id);
        setStatus("ready");
      }
    };

    void seedPosts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesReady, initialTopics, modelStatus]);

  const classifyPost = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // If the model was cleared, reload it first; the seed effect will embed
    // any pending posts once the model reports ready.
    if (modelStatus !== "ready") {
      void reloadModel();
      return;
    }

    setStatus("loading");
    const result = await embed(trimmed);
    if (!result) return;
    const matches = categories
      .filter((category) => category.vector)
      .map((category) => ({
        category,
        score: cosineSimilarity(result.vector, category.vector),
      }))
      .filter((match) => match.score >= CATEGORY_THRESHOLD)
      .sort((a, b) => b.score - a.score);

    const nextPost: ClassifiedPost = {
      id: makeId(),
      text: trimmed,
      source: result.source,
      vector: result.vector,
      matches,
    };

    setPosts((current) => [nextPost, ...current]);
    setActivePostId(nextPost.id);
    setInput("");
    setStatus("ready");
  };

  const totalBadges = posts.reduce((count, post) => count + post.matches.length, 0);

  return (
    <section className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 sm:p-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Civic category bucketing
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
                  void classifyPost();
                }
              }}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => void classifyPost()}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Classify post
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              Threshold: {Math.round(CATEGORY_THRESHOLD * 100)}%
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              Badges assigned: {totalBadges}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = categoryCounts[category.id] ?? 0;
            return (
              <div
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${category.color}14`,
                      color: category.color,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate text-sm font-bold text-slate-900">{category.title}</h4>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {count}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{category.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[3fr_2fr]">
        <div className="border-b border-slate-200 bg-white p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
              Classified posts
            </h3>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {modelStatus !== "ready"
                ? modelStatus === "idle"
                  ? "model cleared"
                  : modelStatus === "error"
                    ? "model error"
                    : "loading model"
                : status === "ready"
                  ? "ready"
                  : "loading"}
            </span>
          </div>

          {activePost ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Selected post
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-800">{activePost.text}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {activePost.matches.length > 0 ? (
                  activePost.matches.map((match) => (
                    <CategoryBadge key={match.category.id} category={match.category} score={match.score} />
                  ))
                ) : (
                  <span className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    No category reached the 30% threshold.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Add a post to score it against the fixed category set.
            </div>
          )}
        </div>

        <aside className="bg-white p-4 sm:p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Recent classifications
          </div>
          <div className="mt-3 space-y-2">
            {posts.slice(0, 6).map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setActivePostId(post.id)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50"
              >
                <div className="line-clamp-2 text-sm font-semibold text-slate-900">{post.text}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {post.matches.length > 0 ? (
                    post.matches.slice(0, 3).map((match) => (
                      <CategoryBadge key={match.category.id} category={match.category} score={match.score} />
                    ))
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      no badge
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
      </ModelGate>
    </section>
  );
}

export default function CategorizePostWidget({ variant = "autocluster", ...props }: CategorizePostWidgetProps) {
  if (variant === "fixed-categories") {
    return <FixedCategoryWidget {...props} />;
  }

  return <AutoClusterWidget {...props} />;
}
