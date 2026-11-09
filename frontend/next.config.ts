import type { NextConfig } from "next";

/**
 * Vote Social frontend is configured for static export (`output: "export"`)
 * so `next build` emits `frontend/out` for Firebase Hosting CDN deployment,
 * matching the Parade project template.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
