"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";

/**
 * Client-side boundary for the interactive blog widgets.
 *
 * The widgets pull in `@huggingface/transformers`, spin up a Web Worker and
 * download a ~20MB embedding model the first time they mount. Mounting them
 * eagerly inside a long article would block the initial paint and start a
 * network download before the reader ever reaches the demo. Instead we:
 *
 *  1. Render a lightweight skeleton until the widget scrolls into view.
 *  2. Only then mount the real (lazy-loaded) widget.
 *  3. Trap any runtime failure in an error boundary so a broken model download
 *     can never take down the whole article.
 */

type WidgetKind = "categorize" | "moderate";

interface WidgetEmbedProps {
  kind: WidgetKind;
}

const WIDGET_META: Record<
  WidgetKind,
  { title: string; description: string; accent: string }
> = {
  categorize: {
    title: "Semantic categorization",
    description:
      "Type a post and watch it get embedded and matched against fixed civic categories.",
    accent: "from-blue-600 to-indigo-600",
  },
  moderate: {
    title: "Auto-moderation",
    description:
      "Screen posts against toxic and safe seed vectors and see the verdict in real time.",
    accent: "from-rose-600 to-orange-500",
  },
};

const CategorizePostWidget = React.lazy(
  () => import("@/components/comms/CategorizePostWidget")
);
const AutoModeratePostWidget = React.lazy(
  () => import("@/components/comms/AutoModeratePostWidget")
);

function WidgetSkeleton({ kind }: { kind: WidgetKind }) {
  const meta = WIDGET_META[kind];
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accent} text-white`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v18M3 12h18"
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900">{meta.title}</p>
          <p className="text-xs text-slate-500">{meta.description}</p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-600">
          Loading interactive demo…
        </p>
        <p className="max-w-sm text-xs text-slate-400">
          The first run downloads a small embedding model to your browser. It is
          cached locally for next time.
        </p>
      </div>
    </div>
  );
}

class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep the article usable even if the widget fails to initialise.
    console.error("Blog widget failed to render", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-amber-900">
            This interactive demo could not load.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Your browser may have blocked the model download or Web Worker.
            Reload the page to try again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function WidgetEmbed({ kind }: WidgetEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Eagerly mount where IntersectionObserver is unavailable (e.g. very old
  // browsers or non-DOM test environments) so the demo is never stuck on the
  // skeleton. Computed lazily to avoid a synchronous setState inside an effect.
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="my-8">
      <WidgetErrorBoundary>
        {isVisible ? (
          <Suspense fallback={<WidgetSkeleton kind={kind} />}>
            {kind === "categorize" ? (
              <CategorizePostWidget variant="autocluster" />
            ) : (
              <AutoModeratePostWidget />
            )}
          </Suspense>
        ) : (
          <WidgetSkeleton kind={kind} />
        )}
      </WidgetErrorBoundary>
    </div>
  );
}
