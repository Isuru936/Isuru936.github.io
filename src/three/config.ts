/**
 * Rendering budget. three.js will happily render at whatever resolution the
 * device reports, which on a high-DPR phone is enough to drop frames, so the
 * pixel ratio is capped rather than trusted.
 */
export const DPR_RANGE: [number, number] = [1, 1.75];

export type QualityTier = 'low' | 'high';

export const QUALITY: Record<QualityTier, { antialias: boolean; shadows: boolean }> = {
  low: { antialias: false, shadows: false },
  high: { antialias: true, shadows: true },
};

/**
 * Coarse pointer plus limited cores is a good proxy for "phone", and it is
 * available before any WebGL context exists.
 */
export function detectQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'low';

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const fewCores = (navigator.hardwareConcurrency ?? 4) <= 4;

  return coarsePointer || fewCores ? 'low' : 'high';
}
