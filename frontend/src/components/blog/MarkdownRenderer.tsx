import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/blog/MermaidDiagram";
import InlineMath from "@/components/blog/InlineMath";
import WidgetEmbed from "@/components/blog/WidgetEmbed";

interface MarkdownRendererProps {
  content: string;
}

/** GitHub-style heading slug, matching the ids we assign to `h2`/`h3`. */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** Flatten a React node tree to its plain-text content (for heading slugs). */
function headingText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(headingText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return headingText(node.props.children);
  }
  return "";
}

/**
 * In-page anchor. A plain `<a href="#…">` with no event handler, so it stays a
 * server component and the browser performs a native in-page scroll (no client
 * navigation, no page refresh). Smooth scrolling and the sticky-header offset
 * come from CSS (`scroll-behavior` / `scroll-mt-24`), not JS.
 */
function ScrollLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-blue-700 font-semibold underline hover:text-blue-800"
    >
      {children}
    </a>
  );
}

/**
 * Recursively walk React children, replacing inline math inside plain strings
 * while leaving element children (links, emphasis, code, …) untouched.
 *
 * Math is frequently split across sibling nodes by the markdown parser — e.g.
 * `**$N$-dimensional**` arrives as `["$", <strong>N</strong>, "$-dimensional"]`.
 * We therefore flatten the children into a token stream, tracking whether we
 * are inside a `$…$` span across node boundaries, and only re-render the plain
 * text runs through the math renderer.
 *
 * The output is deterministic for a given input (no random keys, no
 * environment-dependent branches), so the server-rendered HTML and the first
 * client render match exactly and React can hydrate without a mismatch.
 */
function withInlineMath(children: React.ReactNode, keyPrefix = "m"): React.ReactNode {
  const flat = React.Children.toArray(children);
  const hasDollar = flat.some(
    (child) => typeof child === "string" && child.includes("$")
  );
  if (!hasDollar) return children;

  const nodes: React.ReactNode[] = [];
  let buffer = "";
  let inMath = false;

  const flush = () => {
    if (!buffer) return;
    nodes.push(
      <React.Fragment key={`${keyPrefix}-run-${nodes.length}`}>
        {inMath ? (
          <InlineMath expression={buffer} />
        ) : (
          buffer.replace(/\\\$/g, "$")
        )}
      </React.Fragment>
    );
    buffer = "";
  };

  flat.forEach((child, index) => {
    if (typeof child === "string") {
      for (const char of child) {
        if (char === "$") {
          flush();
          inMath = !inMath;
        } else {
          buffer += char;
        }
      }
      return;
    }

    // Non-string node (e.g. <strong>, <em>, <a>). If we are inside a math span
    // its text content belongs to the expression; otherwise render it as-is.
    if (inMath) {
      const text = extractText(child);
      if (text !== null) {
        buffer += text;
        return;
      }
    }

    flush();
    nodes.push(
      <React.Fragment key={`${keyPrefix}-node-${index}`}>{child}</React.Fragment>
    );
  });

  flush();
  return nodes;
}

/** Best-effort plain-text extraction from a React node (used inside math spans). */
function extractText(node: React.ReactNode): string | null {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    const parts = node.map(extractText);
    return parts.every((part) => part !== null) ? parts.join("") : null;
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return null;
}

/**
 * Map a widget placeholder written in the markdown (e.g.
 * `<CategorizationWidget />`) to the interactive embed kind. Returns `null`
 * for unknown tags so they fall through to the markdown renderer untouched.
 */
function widgetKindForTag(tag: string): "categorize" | "moderate" | null {
  switch (tag) {
    case "CategorizationWidget":
    case "CategorizePostWidget":
      return "categorize";
    case "AutoModerationWidget":
    case "AutoModeratePostWidget":
      return "moderate";
    default:
      return null;
  }
}

type MarkdownSegment =
  | { type: "markdown"; value: string }
  | { type: "widget"; kind: "categorize" | "moderate" }
  | { type: "anchor"; id: string };

/**
 * Split the raw markdown into alternating markdown / widget segments.
 *
 * `react-markdown` (without `rehype-raw`) silently drops raw HTML, so a bare
 * `<CategorizationWidget />` line would render as nothing. By extracting the
 * placeholders up front we can render the real interactive widget between the
 * surrounding markdown blocks instead of relying on HTML passthrough.
 */
function splitOnWidgets(markdown: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const pattern =
    /^[ \t]*(?:<([A-Za-z]+)\s*\/>|<div\s+id="([^"]+)"\s*><\/div>)[ \t]*$/gm;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown)) !== null) {
    const kind = match[1] ? widgetKindForTag(match[1]) : null;
    const anchorId = match[2];
    if (!kind && !anchorId) continue;

    if (match.index > lastIndex) {
      segments.push({
        type: "markdown",
        value: markdown.slice(lastIndex, match.index),
      });
    }
    if (kind) {
      segments.push({ type: "widget", kind });
    } else if (anchorId) {
      segments.push({ type: "anchor", id: anchorId });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < markdown.length) {
    segments.push({ type: "markdown", value: markdown.slice(lastIndex) });
  }

  return segments;
}

function MarkdownBlock({ content }: { content: string }) {
  const math = (children: React.ReactNode, keyPrefix: string) =>
    withInlineMath(children, keyPrefix);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="text-base text-slate-700 leading-relaxed my-4">
            {math(children, "p")}
          </p>
        ),
          h2: ({ children }) => (
            <h2
              id={slugifyHeading(headingText(children))}
              className="text-2xl font-extrabold tracking-tight text-slate-950 mt-10 mb-4 pt-2 border-t border-slate-200/80 first:border-t-0 first:mt-0 scroll-mt-24"
            >
              {math(children, "h2")}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              id={slugifyHeading(headingText(children))}
              className="text-lg font-bold text-slate-900 mt-7 mb-2.5 scroll-mt-24"
            >
              {math(children, "h3")}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 my-4 text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-2 my-4 text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-relaxed">
              {math(children, "li")}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-blue-700 bg-blue-50/70 px-5 py-3.5 rounded-r-xl text-slate-800 italic font-medium">
              {math(children, "bq")}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-slate-200" />,
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),
          a: ({ href = "", children }) => {
            if (href.startsWith("#")) {
              return <ScrollLink href={href}>{children}</ScrollLink>;
            }
            if (href.startsWith("/")) {
              return (
                <Link
                  href={href}
                  className="text-blue-700 font-semibold underline hover:text-blue-800"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-semibold underline hover:text-blue-800"
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-xs font-mono uppercase tracking-wider text-slate-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-t border-slate-100 text-slate-700">
              {math(children, "td")}
            </td>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeText = String(children).replace(/\n$/, "");

            if (match && match[1] === "mermaid") {
              return <MermaidDiagram chart={codeText} />;
            }

            const isBlock = Boolean(match) || codeText.includes("\n");
            if (isBlock) {
              return (
                <div className="my-6 rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto border border-slate-800 shadow-xs">
                  {match && (
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 pb-1.5 border-b border-slate-800">
                      {match[1]}
                    </div>
                  )}
                  <pre className="text-xs sm:text-sm font-mono leading-relaxed">
                    <code className={className} {...props}>
                      {codeText}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-slate-200/70 text-slate-900 font-mono text-[0.85em]"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const segments = splitOnWidgets(content);

  return (
    <div className="space-y-4 text-slate-700 leading-relaxed">
      {segments.map((segment, index) => {
        if (segment.type === "widget") {
          return <WidgetEmbed key={`widget-${index}`} kind={segment.kind} />;
        }
        if (segment.type === "anchor") {
          return <div key={`anchor-${index}`} id={segment.id} className="scroll-mt-24" />;
        }
        return <MarkdownBlock key={`markdown-${index}`} content={segment.value} />;
      })}
    </div>
  );
}
