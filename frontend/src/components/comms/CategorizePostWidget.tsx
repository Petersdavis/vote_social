"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";

type TopicNode = {
  id: string;
  label: string;
  text: string;
  vector?: Float32Array;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isSeed: boolean;
  score?: number;
  source?: "huggingface" | "fallback";
};

type WorkerResult = {
  id: string;
  text: string;
  vector: Float32Array;
  source: "huggingface" | "fallback";
};

type WorkerRequest = {
  id: string;
  text: string;
};

type ForceSample = {
  source: TopicNode;
  target: TopicNode;
  strength: number;
};

export interface CategorizePostWidgetProps {
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

const WIDTH = 720;
const HEIGHT = 520;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const CLUSTER_SPACING_SCALE = 2;

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
  return {
    id: makeId(),
    label,
    text: label,
    x: CENTER_X + Math.cos(angle) * baseRadius,
    y: CENTER_Y + Math.sin(angle) * baseRadius,
    vx: 0,
    vy: 0,
    radius: isSeed ? 16 + (hash % 6) : 14 + (hash % 5),
    color: COLORS[hash % COLORS.length],
    isSeed,
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

function placeNodeAdjacentTo(anchor: TopicNode, label: string, radius: number) {
  const angle = ((stableHash(label) % 360) * Math.PI) / 180;
  const distance = anchor.radius + radius + 30;

  return {
    x: clamp(anchor.x + Math.cos(angle) * distance, 36, WIDTH - 36),
    y: clamp(anchor.y + Math.sin(angle) * distance, 36, HEIGHT - 36),
  };
}

function buildEdgeSamples(nodes: TopicNode[]): ForceSample[] {
  const edges: ForceSample[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = cosineSimilarity(nodes[i].vector, nodes[j].vector);
      edges.push({
        source: nodes[i],
        target: nodes[j],
        strength: clamp((similarity + 1) / 2, 0.08, 0.95),
      });
    }
  }
  return edges.sort((a, b) => b.strength - a.strength);
}

function moveTowardCenter(node: TopicNode, strength: number) {
  const dx = CENTER_X - node.x;
  const dy = CENTER_Y - node.y;
  node.vx += dx * strength;
  node.vy += dy * strength;
}

function stepSimulation(nodes: TopicNode[], edges: ForceSample[]) {
  const collisionPadding = 4;

  for (const edge of edges) {
    const dx = edge.target.x - edge.source.x;
    const dy = edge.target.y - edge.source.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const desired = edge.strength > 0.3 ? 10 : 100;
    const delta = distance - desired;
    const force =
      delta >= 0
        ? delta * 0.00002 * edge.strength
        : -delta * delta * 0.00002 * edge.strength;
    const ux = dx / distance;
    const uy = dy / distance;

    edge.source.vx += ux * force;
    edge.source.vy += uy * force;
    edge.target.vx -= ux * force;
    edge.target.vy -= uy * force;
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    moveTowardCenter(node, node.isSeed ? 0.00022 : 0.00016);

    for (let j = i + 1; j < nodes.length; j++) {
      const other = nodes[j];
      const dx = other.x - node.x;
      const dy = other.y - node.y;
      const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const minDistance = node.radius + other.radius + collisionPadding;
      const ux = dx / distance;
      const uy = dy / distance;
      const similarity = cosineSimilarity(node.vector, other.vector);
      const desiredDistance = similarity > 0.3 ? 10 : 100;
      const pairDelta = distance - desiredDistance;
      const pairForce =
        pairDelta >= 0
          ? pairDelta * 0.00001
          : -pairDelta * pairDelta * 0.00001;

      node.vx += ux * pairForce;
      node.vy += uy * pairForce;
      other.vx -= ux * pairForce;
      other.vy -= uy * pairForce;

      // Stronger long-range repulsion keeps unrelated topics in separate
      // clusters so the map reads as distinct semantic islands.
      const unrelatedness = clamp(1 - Math.max(similarity, 0), 0, 1);
      const farFieldRepel =
        (unrelatedness * unrelatedness * 0.05 * CLUSTER_SPACING_SCALE) /
        Math.max(distance * 0.02, 0.35);
      node.vx -= ux * farFieldRepel;
      node.vy -= uy * farFieldRepel;
      other.vx += ux * farFieldRepel;
      other.vy += uy * farFieldRepel;

      if (distance < minDistance) {
        const overlapRatio = (minDistance - distance) / minDistance;
        const push = overlapRatio * overlapRatio * 0.03;
        node.vx -= ux * push;
        node.vy -= uy * push;
        other.vx += ux * push;
        other.vy += uy * push;
      }

      if (similarity < 0.08) {
        const repel = (0.08 - similarity) * 0.014;
        node.vx -= ux * repel;
        node.vy -= uy * repel;
        other.vx += ux * repel;
        other.vy += uy * repel;
      }
    }
  }

  for (const node of nodes) {
    node.vx *= 0.9;
    node.vy *= 0.9;
    node.x = clamp(node.x + node.vx, 36, WIDTH - 36);
    node.y = clamp(node.y + node.vy, 36, HEIGHT - 36);
  }
}

export default function CategorizePostWidget({
  initialTopics = DEFAULT_TOPICS,
  title = "Semantic topic map",
  subtitle = "Seed a few topics, add a new one, and watch the ideas cluster by meaning.",
  placeholder = "Add a topic like 'fare-free transit for students'",
  className = "",
}: CategorizePostWidgetProps) {
  const [input, setInput] = useState("");
  const [nodes, setNodes] = useState<TopicNode[]>(() =>
    initialTopics.map((topic, index) => createNode(topic, index, true))
  );
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [lastSource, setLastSource] = useState<"huggingface" | "fallback" | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [viewportTransform, setViewportTransform] = useState<ZoomTransform>(zoomIdentity);
  const workerRef = useRef<Worker | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pendingRef = useRef<Map<string, { resolve: (vector: Float32Array, source: WorkerResult["source"]) => void }>>(new Map());
  const simulationRef = useRef<number | null>(null);

  const activeTopic = useMemo(
    () => nodes.find((node) => node.id === activeTopicId) ?? nodes[0] ?? null,
    [activeTopicId, nodes]
  );

  const edges = useMemo(() => buildEdgeSamples(nodes), [nodes]);

  useEffect(() => {
    const worker = new Worker(new URL("./categorizePost.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      const pending = pendingRef.current.get(event.data.id);
      if (!pending) return;
      pendingRef.current.delete(event.data.id);
      pending.resolve(event.data.vector, event.data.source);
    };

    worker.onerror = () => setStatus("error");
    workerRef.current = worker;
    setStatus("ready");

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

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
        stepSimulation(next, buildEdgeSamples(next));
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    const enrich = async () => {
      const worker = workerRef.current;
      if (!worker) return;
      setStatus((current) => (current === "error" ? current : "loading"));

      const missing = nodes.filter((node) => !node.vector).map((node) => node);
      for (const node of missing) {
        const requestId = `${node.id}:${Date.now()}`;
        const vectorPromise = new Promise<{
          vector: Float32Array;
          source: WorkerResult["source"];
        }>((resolve) => {
          pendingRef.current.set(requestId, {
            resolve: (vector, source) => resolve({ vector, source }),
          });
        });

        worker.postMessage({ id: requestId, text: node.text } satisfies WorkerRequest);
        const result = await vectorPromise;
        if (cancelled) return;

        setNodes((current) =>
          current.map((candidate) =>
            candidate.id === node.id
              ? {
                  ...candidate,
                  vector: result.vector,
                  source: result.source,
                }
              : candidate
          )
        );
        setLastSource(result.source);
      }

      if (!cancelled) setStatus("ready");
    };

    void enrich();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  const addTopic = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const next = createNode(trimmed, nodes.length, false);
    setNodes((current) => [next, ...current]);
    setActiveTopicId(next.id);
    setInput("");

    const worker = workerRef.current;
    if (!worker) return;

    setStatus("loading");
    const requestId = `${next.id}:${Date.now()}`;
    const vectorPromise = new Promise<{
      vector: Float32Array;
      source: WorkerResult["source"];
    }>((resolve) => {
      pendingRef.current.set(requestId, {
        resolve: (vector, source) => resolve({ vector, source }),
      });
    });

    worker.postMessage({ id: requestId, text: trimmed } satisfies WorkerRequest);
    const result = await vectorPromise;
    const anchor = findClosestNode(nodes, result.vector, next.id);

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
          source: result.source,
        };
      })
    );
    setLastSource(result.source);
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

  return (
    <section className={`rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
              <Sparkles className="w-3.5 h-3.5" />
              Topic clustering
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600 max-w-2xl">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              {status === "loading" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
              ) : (
                <span className={`w-2 h-2 rounded-full ${status === "error" ? "bg-rose-500" : "bg-emerald-500"}`} />
              )}
              {status === "loading" ? "Embedding" : status === "error" ? "Worker error" : "Live model ready"}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              {lastSource ? `Last vector: ${lastSource}` : "No vector yet"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
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
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add topic
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {initialTopics.slice(0, 4).map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setInput(topic)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 transition"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.7fr_1fr]">
        <div className="p-4 sm:p-5 bg-slate-950/95">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
            <span>Semantic force field</span>
            <span>{nodes.length} topics</span>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-inner">
            <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-[420px] w-full touch-none">
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

              <g transform={`translate(${viewportTransform.x}, ${viewportTransform.y}) scale(${viewportTransform.k})`}>
                {edges.map((edge) => {
                  const isHighlighted =
                    highlightSet.has(edge.source.id) && highlightSet.has(edge.target.id);
                  return (
                    <line
                      key={`${edge.source.id}-${edge.target.id}`}
                      x1={edge.source.x}
                      y1={edge.source.y}
                      x2={edge.target.x}
                      y2={edge.target.y}
                      stroke={isHighlighted ? "rgba(147,197,253,0.55)" : "rgba(255,255,255,0.12)"}
                      strokeWidth={isHighlighted ? 2.2 : 1}
                    />
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
                        r={node.radius + 16}
                        fill="url(#nodeGlow)"
                        opacity={isActive ? 0.85 : isRelated ? 0.55 : 0.22}
                        filter="url(#softGlow)"
                      />
                      <circle
                        r={node.radius + 3}
                        fill="rgba(15,23,42,0.9)"
                        stroke={node.color}
                        strokeWidth={isActive ? 3 : 1.5}
                      />
                      <circle
                        r={node.radius}
                        fill={node.color}
                        opacity={node.source === "huggingface" ? 0.96 : 0.72}
                      />
                      <title>{`${node.label} · ${node.source === "huggingface" ? "AI cluster" : "Seed topic"}`}</title>
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent px-4 py-3 text-[11px] text-slate-300">
              Drag-free layout driven by semantic similarity, repulsion, and centroid pull.
            </div>
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700">
              Topic detail
            </h3>
            {activeTopic ? (
              <button
                type="button"
                onClick={() => setActiveTopicId(null)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 transition"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            ) : null}
          </div>

          {activeTopic ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Selected topic
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-900">{activeTopic.label}</div>
                  </div>
                  <div className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: `${activeTopic.color}18`, color: activeTopic.color }}>
                    {activeTopic.isSeed ? "Seed" : "Added"}
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-600">
                  {activeTopic.vector ? (
                    <>
                      Similarity graph and embeddings are live. This topic is currently positioned near
                      semantically related items.
                    </>
                  ) : (
                    <>Waiting for the worker to generate an embedding.</>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Closest neighbors
                </div>
                {nodes
                  .filter((node) => node.id !== activeTopic.id)
                  .map((node) => ({
                    node,
                    score: cosineSimilarity(activeTopic.vector, node.vector),
                  }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5)
                  .map(({ node, score }) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setActiveTopicId(node.id)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{node.label}</div>
                        <div className="text-xs text-slate-500">{node.source ?? "waiting"}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${Math.round(((score + 1) / 2) * 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-mono text-slate-600">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                This visualization is powered by a Hugging Face feature extraction worker. If the model fails to load, the widget falls back to a deterministic semantic hash so the layout still works.
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Click a node to inspect its semantic neighborhood, or add a topic to place it into the map.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
