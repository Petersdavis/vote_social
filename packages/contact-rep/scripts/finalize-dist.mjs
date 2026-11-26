// Post-build step: make the dual ESM/CJS output consumable by every resolver.
//
// 1. `dist/esm/package.json` marks the ESM build as ESM even though the root
//    package has no `"type": "module"` (which would break the CJS build).
// 2. `dist/cjs/package.json` marks the CJS build as CommonJS.
// 3. `dist/cjs/index.js` is renamed to `index.cjs` so bundlers and Node never
//    have to guess the module format from the extension.
// 4. `dist/cjs/index.d.cts` re-exports the ESM declarations so TypeScript
//    resolves types correctly under `moduleResolution: "node16"`/`"nodenext"`.

import { rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;

async function main() {
  await writeFile(
    join(dist, "esm", "package.json"),
    JSON.stringify({ type: "module" }, null, 2) + "\n",
  );

  await writeFile(
    join(dist, "cjs", "package.json"),
    JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
  );

  await rename(join(dist, "cjs", "index.js"), join(dist, "cjs", "index.cjs"));

  await writeFile(
    join(dist, "cjs", "index.d.cts"),
    'export * from "../esm/index.js";\nexport { default } from "../esm/index.js";\n',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
