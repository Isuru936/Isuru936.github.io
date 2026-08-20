/**
 * The canvas textures draw text with `ctx.font`, which needs a real resolvable
 * family name. The design used a Google Fonts <link> so the literal strings
 * "Space Grotesk" / "JetBrains Mono" worked; we self-host via next/font, which
 * generates hashed family names, so the resolved families are injected instead.
 */
export type SceneFonts = {
  sans: string;
  mono: string;
};

export const FALLBACK_FONTS: SceneFonts = {
  sans: '"Space Grotesk", Helvetica, sans-serif',
  mono: '"JetBrains Mono", monospace',
};
