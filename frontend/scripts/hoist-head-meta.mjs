import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve(process.cwd(), "out");

function walkHtmlFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Next.js `experimental.inlineCss` injects a ~65 KB `<style data-precedence="next">...</style>`
 * block at the very start of `<head>`, pushing `<title>`, `<link rel="canonical">`, and
 * `<meta property="og:*">` past 65 KB. Social scrapers (Facebook, LinkedIn, Slack, etc.)
 * that only inspect the first 32–64 KB of `<head>` miss the Open Graph tags entirely.
 *
 * This post-build step moves inlined `<style>` blocks to the end of `<head>` so all
 * `<meta>` and `<title>` tags appear in the first ~2 KB of every static HTML file.
 */
function moveInlineStylesToEndOfHead(html) {
  const headStart = html.indexOf("<head>");
  const headEnd = html.indexOf("</head>");
  if (headStart === -1 || headEnd === -1 || headEnd <= headStart) {
    return html;
  }

  const beforeHead = html.slice(0, headStart + 6);
  const headInner = html.slice(headStart + 6, headEnd);
  const afterHead = html.slice(headEnd);

  const styleRegex = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
  const styles = headInner.match(styleRegex);
  if (!styles || styles.length === 0) {
    return html;
  }

  const headWithoutStyles = headInner.replace(styleRegex, "");
  return `${beforeHead}${headWithoutStyles}${styles.join("")}${afterHead}`;
}

const files = walkHtmlFiles(OUT_DIR);
let updatedCount = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const updated = moveInlineStylesToEndOfHead(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    updatedCount++;
  }
}

console.log(
  `✓ Hoisted <meta> & <title> before inlined <style> in ${updatedCount} HTML files.`,
);
