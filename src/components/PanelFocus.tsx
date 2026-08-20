'use client';

import { useEffect } from 'react';

/**
 * Fades and lifts each section panel by its distance from the viewport centre.
 * Same curve as the design's DCLogic: a per-frame read rather than an
 * IntersectionObserver, because the falloff is continuous, not thresholded.
 */
export function PanelFocus() {
  useEffect(() => {
    let raf = 0;

    const update = () => {
      const mid = window.innerHeight / 2;
      document.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => {
        const r = p.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid) / window.innerHeight;
        const k = Math.max(0, Math.min(1, 2.2 - d * 4.2));
        p.style.opacity = String(k);
        p.style.transform = 'translateY(' + ((1 - k) * 22).toFixed(1) + 'px)';
      });
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      update();
    };
    loop();

    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
