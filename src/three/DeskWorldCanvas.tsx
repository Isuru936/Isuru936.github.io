'use client';

import dynamic from 'next/dynamic';

import type { MotionMode } from './deskScene';
import type { SceneFonts } from './fonts';
import { useWebGLSupport } from './hooks/useWebGLSupport';

/**
 * WebGL needs a DOM and a GPU context, so the scene is client-only. Without
 * WebGL the page keeps the flat background from the design and stays fully
 * readable — every section's content lives in the DOM, not the scene.
 */
const DeskWorld = dynamic(() => import('./DeskWorld'), { ssr: false });

type DeskWorldCanvasProps = {
  accent?: string;
  motion?: MotionMode;
  fonts?: SceneFonts;
};

export function DeskWorldCanvas(props: DeskWorldCanvasProps) {
  const supportsWebGL = useWebGLSupport();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#07090c' }}>
      {supportsWebGL ? <DeskWorld {...props} /> : null}
    </div>
  );
}
