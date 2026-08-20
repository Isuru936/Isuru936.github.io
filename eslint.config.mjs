import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architectural boundaries, enforced rather than documented.
 *
 * `three`/R3F may only be imported from src/three/, and `drizzle-orm` only from
 * src/db/. Later config objects override earlier ones for the same rule, so the
 * exemptions below re-declare the rule with only the *other* restriction rather
 * than switching it off.
 *
 * Package names go in `paths`, not `patterns`: `patterns.group` uses gitignore
 * semantics, where a slash-less pattern like `three` matches ANY path segment —
 * which wrongly flagged our own `@/three/...` alias imports.
 */
const WEBGL_MESSAGE =
  "WebGL imports are confined to src/three/. Import a component from there instead.";
const DRIZZLE_MESSAGE =
  "Drizzle imports are confined to src/db/. Call a typed function from src/db/queries/ instead.";

const WEBGL = {
  paths: [{ name: "three", message: WEBGL_MESSAGE }],
  patterns: [{ group: ["three/*", "@react-three/*"], message: WEBGL_MESSAGE }],
};

const DRIZZLE = {
  paths: [{ name: "drizzle-orm", message: DRIZZLE_MESSAGE }],
  patterns: [{ group: ["drizzle-orm/*"], message: DRIZZLE_MESSAGE }],
};

const restrict = (...specs) => ({
  "no-restricted-imports": [
    "error",
    {
      paths: specs.flatMap((s) => s.paths),
      patterns: specs.flatMap((s) => s.patterns),
    },
  ],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: restrict(WEBGL, DRIZZLE),
  },
  {
    files: ["src/three/**/*.{ts,tsx}"],
    rules: restrict(DRIZZLE),
  },
  {
    files: ["src/db/**/*.{ts,tsx}"],
    rules: restrict(WEBGL),
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
