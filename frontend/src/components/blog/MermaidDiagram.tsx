"use client";

import React, { useEffect, useId, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const rawId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

    async function renderChart() {
      try {
        const mermaidModule = await import("mermaid");
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        });

        const { svg: renderedSvg } = await mermaid.render(
          diagramId,
          chart.trim(),
        );
        if (!cancelled) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error("Failed to render Mermaid chart:", err);
        if (!cancelled) {
          setError("Unable to render diagram preview.");
        }
      }
    }

    renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, rawId]);

  return (
    <figure className="my-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-x-auto">
      <div className="mb-3 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
        <span>Civic Infrastructure Comparison • Diagram</span>
        <span className="text-emerald-700 font-semibold">Interactive SVG</span>
      </div>

      {svg ? (
        <div
          className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto py-2"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : error ? (
        <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto">
          <code>{chart}</code>
        </pre>
      ) : (
        <div className="py-10 text-center">
          <div className="inline-block text-xs font-mono text-slate-400 animate-pulse">
            Rendering architecture diagram…
          </div>
          <pre className="sr-only">
            <code>{chart}</code>
          </pre>
        </div>
      )}
    </figure>
  );
}
