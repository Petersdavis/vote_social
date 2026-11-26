import React from "react";

/**
 * Minimal, dependency-free renderer for the small subset of LaTeX used in the
 * blog: superscripts, subscripts, fractions, greek letters and a handful of
 * operators. It intentionally does not attempt to be a full TeX engine — it
 * covers the inline expressions we actually author in posts (e.g. `$O(N^2)$`,
 * `$\ge 0.88$`, `$\approx 0.75\text{–}0.88$`) without pulling in KaTeX.
 */

const GREEK: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  sigma: "σ",
  phi: "φ",
  omega: "ω",
  Delta: "Δ",
  Sigma: "Σ",
  Omega: "Ω",
};

const SYMBOLS: Record<string, string> = {
  ge: "≥",
  geq: "≥",
  le: "≤",
  leq: "≤",
  neq: "≠",
  ne: "≠",
  approx: "≈",
  times: "×",
  cdot: "·",
  pm: "±",
  infty: "∞",
  to: "→",
  rightarrow: "→",
  ldots: "…",
  cdots: "⋯",
  sum: "∑",
  prod: "∏",
  sqrt: "√",
  partial: "∂",
  nabla: "∇",
  in: "∈",
  mid: "|",
};

type Token =
  | { kind: "text"; value: string }
  | { kind: "sup" | "sub"; value: string }
  | { kind: "frac"; numerator: string; denominator: string };

/** Read a single brace-delimited group starting at `start` (which must be "{"). */
function readGroup(source: string, start: number): { value: string; end: number } {
  let depth = 0;
  let value = "";
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === "{") {
      depth += 1;
      if (depth === 1) continue;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return { value, end: i + 1 };
    }
    value += char;
  }
  return { value, end: source.length };
}

/** Read the argument of a command: either a `{group}` or a single character. */
function readArgument(source: string, start: number): { value: string; end: number } {
  if (source[start] === "{") return readGroup(source, start);
  return { value: source[start] ?? "", end: start + 1 };
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer) {
      tokens.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  let i = 0;
  while (i < source.length) {
    const char = source[i];

    if (char === "\\") {
      // Command: read the alphabetic command name.
      let j = i + 1;
      let name = "";
      while (j < source.length && /[a-zA-Z]/.test(source[j])) {
        name += source[j];
        j += 1;
      }

      if (name === "frac") {
        flush();
        const numerator = readArgument(source, j);
        const denominator = readArgument(source, numerator.end);
        tokens.push({
          kind: "frac",
          numerator: numerator.value,
          denominator: denominator.value,
        });
        i = denominator.end;
        continue;
      }

      if (name === "text" || name === "mathrm" || name === "operatorname") {
        const group = readArgument(source, j);
        buffer += group.value;
        i = group.end;
        continue;
      }

      if (name === "left" || name === "right") {
        // Drop the sizing command; keep the delimiter that follows.
        i = j;
        continue;
      }

      if (name in SYMBOLS) {
        buffer += SYMBOLS[name];
        i = j;
        continue;
      }

      if (name in GREEK) {
        buffer += GREEK[name];
        i = j;
        continue;
      }

      // Unknown command: render the name verbatim without the backslash.
      buffer += name;
      i = j;
      continue;
    }

    if (char === "^" || char === "_") {
      flush();
      const argument = readArgument(source, i + 1);
      tokens.push({
        kind: char === "^" ? "sup" : "sub",
        value: argument.value,
      });
      i = argument.end;
      continue;
    }

    if (char === "{") {
      const group = readGroup(source, i);
      buffer += group.value;
      i = group.end;
      continue;
    }

    buffer += char;
    i += 1;
  }

  flush();
  return tokens;
}

function renderTokens(tokens: Token[], keyPrefix = "t"): React.ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.kind === "sup") {
      return (
        <sup key={key} className="text-[0.7em]">
          {renderTokens(tokenize(token.value), `${key}-s`)}
        </sup>
      );
    }
    if (token.kind === "sub") {
      return (
        <sub key={key} className="text-[0.7em]">
          {renderTokens(tokenize(token.value), `${key}-b`)}
        </sub>
      );
    }
    if (token.kind === "frac") {
      return (
        <span
          key={key}
          className="inline-flex flex-col items-center align-middle mx-0.5 text-[0.85em] leading-none"
        >
          <span className="px-1 border-b border-current">
            {renderTokens(tokenize(token.numerator), `${key}-n`)}
          </span>
          <span className="px-1">
            {renderTokens(tokenize(token.denominator), `${key}-d`)}
          </span>
        </span>
      );
    }
    return <React.Fragment key={key}>{token.value}</React.Fragment>;
  });
}

export default function InlineMath({ expression }: { expression: string }) {
  return (
    <span className="font-serif italic text-slate-900 whitespace-nowrap">
      {renderTokens(tokenize(expression))}
    </span>
  );
}
