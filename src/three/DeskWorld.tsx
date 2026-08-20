'use client';

import { useEffect, useRef } from 'react';

import { createDeskWorld, type MotionMode } from './deskScene';
import { FALLBACK_FONTS, type SceneFonts } from './fonts';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';

type DeskWorldProps = {
  accent?: string;
  motion?: MotionMode;
  fonts?: SceneFonts;
};

/**
 * The canvas textures draw text with the 2D context, which silently falls back
 * to a system font if the webface has not loaded yet. The design painted
 * immediately on boot and could therefore render the monitor, papers and phone
 * in the wrong typeface. Waiting for font readiness first fixes that.
 */
async function fontsReady(fonts: SceneFonts): Promise<void> {
  if (!('fonts' in document)) return;

  const specs = [
    `700 34px ${fonts.sans}`,
    `500 24px ${fonts.sans}`,
    `400 15px ${fonts.sans}`,
    `500 20px ${fonts.mono}`,
    `400 13px ${fonts.mono}`,
  ];

  await Promise.all(
    specs.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  );
  await document.fonts.ready;
}

export default function DeskWorld({
  accent = '#59d3cf',
  motion = 'full',
  fonts = FALLBACK_FONTS,
}: DeskWorldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let handle: { dispose: () => void } | null = null;
    let cancelled = false;

    fontsReady(fonts).then(() => {
      if (cancelled || !hostRef.current) return;
      handle = createDeskWorld(hostRef.current, {
        accent,
        motion: prefersReducedMotion ? 'off' : motion,
        fonts,
      });
    });

    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, [accent, motion, fonts, prefersReducedMotion]);

  return <div ref={hostRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />;
}
