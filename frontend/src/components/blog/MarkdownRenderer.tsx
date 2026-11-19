import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/blog/MermaidDiagram";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="space-y-4 text-slate-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 mt-10 mb-4 pt-2 border-t border-slate-200/80 first:border-t-0 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold text-slate-900 mt-7 mb-2.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-base text-slate-700 leading-relaxed my-4">
              {children}
            </p>
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
            <li className="text-base leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-blue-700 bg-blue-50/70 px-5 py-3.5 rounded-r-xl text-slate-800 italic font-medium">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-slate-200" />,
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),
          a: ({ href = "", children }) => {
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
              {children}
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
    </div>
  );
}
