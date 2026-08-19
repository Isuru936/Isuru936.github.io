'use client';

import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, Preload } from '@react-three/drei';
import { useMemo } from 'react';

import { DPR_RANGE, QUALITY, detectQualityTier } from './config';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { PlaceholderObject } from './objects/PlaceholderObject';

/**
 * The only <Canvas> in the application. Mounted per-page and never from
 * app/layout.tsx — a layout-level canvas would load three.js on text routes and
 * retain a GPU context across every navigation.
 */
export default function Scene() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const tier = useMemo(() => detectQualityTier(), []);
  const quality = QUALITY[tier];

  return (
    <Canvas
      dpr={DPR_RANGE}
      shadows={quality.shadows}
      gl={{ antialias: quality.antialias, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 4], fov: 45 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 2]} intensity={1.4} />

      <PlaceholderObject animate={!prefersReducedMotion} />

      <AdaptiveDpr pixelated />
      <Preload all />
    </Canvas>
  );
}
