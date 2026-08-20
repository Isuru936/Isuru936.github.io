import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';

/**
 * Self-hosted equivalents of the design's Google Fonts <link>. The resolved
 * `style.fontFamily` strings are handed to the 3D scene, because its canvas
 * textures build `ctx.font` values and need a real family name — next/font
 * generates hashed ones, so the literals from the design would not resolve.
 */
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const sceneFonts = {
  sans: spaceGrotesk.style.fontFamily,
  mono: jetbrainsMono.style.fontFamily,
};
