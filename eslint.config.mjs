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
 */
const WEBGL_PATTERN = {
  group: ["three", "three/*", "@react-three/*"],
  message:
    "WebGL imports are confined to src/three/. Import a component from there instead.",
};

const DRIZZLE_PATTERN = {
  group: ["drizzle-orm", "drizzle-orm/*"],
  message:
    "Drizzle imports are confined to src/db/. Call a typed function from src/db/queries/ instead.",
};

const restrict = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: restrict(WEBGL_PATTERN, DRIZZLE_PATTERN),
  },
  {
    files: ["src/three/**/*.{ts,tsx}"],
    rules: restrict(DRIZZLE_PATTERN),
  },
  {
    files: ["src/db/**/*.{ts,tsx}"],
    rules: restrict(WEBGL_PATTERN),
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
