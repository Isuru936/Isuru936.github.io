'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';

/**
 * WebGL needs a DOM and a GPU context, so the scene is client-only. The poster
 * below is what the server renders and what becomes the LCP element; the canvas
 * fades in over it once three.js has loaded.
 */
const Scene = dynamic(() => import('./Scene'), { ssr: false });

type SceneLoaderProps = {
  /** Static still of the scene. Served as the LCP element. */
  posterSrc: string;
  posterAlt: string;
  className?: string;
};

export function SceneLoader({ posterSrc, posterAlt, className }: SceneLoaderProps) {
  const [canRenderWebGL, setCanRenderWebGL] = useState(false);

  useEffect(() => {
    // Probe rather than assume: a WebGL-less browser must still get a usable page.
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    setCanRenderWebGL(Boolean(context));
  }, []);

  return (
    <div className={`relative isolate overflow-hidden ${className ?? ''}`}>
      <Image
        src={posterSrc}
        alt={posterAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {canRenderWebGL ? (
        <div className="absolute inset-0 motion-safe:animate-[fade-in_600ms_ease-out_forwards]">
          <Scene />
        </div>
      ) : null}
    </div>
  );
}
