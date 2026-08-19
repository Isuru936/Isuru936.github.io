'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

import { useWebGLSupport } from './hooks/useWebGLSupport';

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
  const supportsWebGL = useWebGLSupport();

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

      {supportsWebGL ? (
        <div className="absolute inset-0 motion-safe:animate-scene-in">
          <Scene />
        </div>
      ) : null}
    </div>
  );
}
