import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(rootDir, "../..");
const require = createRequire(import.meta.url);

// Resolve a single, matched pair of React/ReactDOM. The monorepo hoists one
// copy to the repo root and keeps another in the web workspace; without pinning
// BOTH to the same tree, react-dom and react load as separate instances and
// hook dispatch breaks ("Cannot read properties of null (reading 'useState')").
// Pin to the repo root, which is also where @testing-library resolves react-dom.
const reactDir = dirname(
  require.resolve("react/package.json", { paths: [repoRoot] }),
);
const reactDomDir = dirname(
  require.resolve("react-dom/package.json", { paths: [repoRoot] }),
);

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      // Match only the "@/..." path alias (tsconfig paths) — a bare "@" alias
      // would also rewrite "@repo/*" workspace imports.
      { find: /^@\/(.*)$/, replacement: `${rootDir}/$1` },
      { find: /^react$/, replacement: reactDir },
      { find: /^react\/(.*)$/, replacement: `${reactDir}/$1` },
      { find: /^react-dom$/, replacement: reactDomDir },
      { find: /^react-dom\/(.*)$/, replacement: `${reactDomDir}/$1` },
    ],
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "dist/**"],
    // Pipe testing-library through vite so the aliases above apply to its
    // react-dom import too — otherwise it loads a second React copy.
    server: { deps: { inline: [/@testing-library\//] } },
  },
});
