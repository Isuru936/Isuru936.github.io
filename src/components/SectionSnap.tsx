'use client';

import { useEffect } from 'react';

const COUNT = 6;
const DURATION = 900;
/** Quiet period after a snap, so trackpad inertia cannot skip a section. */
const COOLDOWN = 150;
/** Minimum touch travel before a swipe counts as a gesture. */
const SWIPE_PX = 40;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Locks scrolling to one section per gesture.
 *
 * Rather than change what drives the camera, this snaps the scroll *position* to
 * the offsets where `deskScene` already places the camera exactly on a station —
 * `(i + 0.5) / COUNT` of the scrollable range, with the ends pinned to 0 and
 * max. The scene keeps reading scrollY continuously, so its lerp still plays the
 * transition; only where scrolling comes to rest has changed.
 */
export function SectionSnap() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let index = 0;
    let animating = false;
    let releaseAt = 0;
    let raf = 0;

    const maxScroll = () =>
      Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const targetFor = (i: number) => {
      const max = maxScroll();
      if (i <= 0) return 0;
      if (i >= COUNT - 1) return max;
      return max * ((i + 0.5) / COUNT);
    };

    const nearestIndex = () => {
      let best = 0;
      let bestDistance = Infinity;
      for (let i = 0; i < COUNT; i++) {
        const d = Math.abs(window.scrollY - targetFor(i));
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      }
      return best;
    };

    index = nearestIndex();

    const goTo = (next: number) => {
      const clamped = Math.max(0, Math.min(COUNT - 1, next));
      const from = window.scrollY;
      const to = targetFor(clamped);
      index = clamped;

      if (Math.abs(to - from) < 1) return;

      if (reduceMotion.matches) {
        window.scrollTo({ top: to, behavior: 'instant' });
        releaseAt = performance.now() + COOLDOWN;
        return;
      }

      animating = true;
      const start = performance.now();
      cancelAnimationFrame(raf);

      const step = () => {
        const p = Math.min(1, (performance.now() - start) / DURATION);
        // 'instant' so the tween is not fighting `scroll-behavior: smooth`.
        window.scrollTo({ top: from + (to - from) * easeInOutCubic(p), behavior: 'instant' });
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          animating = false;
          releaseAt = performance.now() + COOLDOWN;
        }
      };
      raf = requestAnimationFrame(step);
    };

    const busy = () => animating || performance.now() < releaseAt;

    /**
     * A panel that overflows its viewport height must scroll its own content
     * first; only once it is at the edge does the gesture move the page.
     */
    const panelWantsGesture = (target: EventTarget | null, dir: number) => {
      let el = target instanceof Element ? target : null;
      while (el) {
        if (el.hasAttribute('data-panel')) {
          const slack = el.scrollHeight - el.clientHeight;
          if (slack <= 1) return false;
          if (dir > 0) return el.scrollTop < slack - 1;
          return el.scrollTop > 1;
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      const dir = Math.sign(e.deltaY);
      if (!dir) return;
      if (panelWantsGesture(e.target, dir)) return;
      e.preventDefault();
      if (busy()) return;
      goTo(index + dir);
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      const travel = touchY - y;
      const dir = Math.sign(travel);
      if (!dir || Math.abs(travel) < SWIPE_PX) return;
      if (panelWantsGesture(e.target, dir)) return;
      e.preventDefault();
      if (busy()) return;
      touchY = y;
      goTo(index + dir);
    };

    const KEY_STEPS: Record<string, number> = {
      ArrowDown: 1,
      PageDown: 1,
      ' ': 1,
      ArrowUp: -1,
      PageUp: -1,
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Never steal keys from a form control or anything being edited.
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      let next: number | null = null;
      if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = COUNT - 1;
      else if (e.key in KEY_STEPS) next = index + KEY_STEPS[e.key];

      if (next === null) return;
      e.preventDefault();
      if (busy()) return;
      goTo(next);
    };

    /** Nav anchors must land on the same offsets, not the raw section top. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href^="#s"]');
      if (!anchor) return;
      const i = Number(anchor.getAttribute('href')?.slice(2));
      if (!Number.isInteger(i) || i < 0 || i >= COUNT) return;
      e.preventDefault();
      goTo(i);
    };

    /** Targets are ratios, so a resize only invalidates which one we are on. */
    const onResize = () => {
      if (!animating) index = nearestIndex();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
