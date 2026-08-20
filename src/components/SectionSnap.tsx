'use client';

import { useEffect } from 'react';

const COUNT = 6;
const DURATION = 550;
/**
 * Silence that ends a gesture.
 *
 * A trackpad flick emits a long, decaying stream of `wheel` events. A
 * fixed-duration lock cannot work — the stream outlasts any lock, and delivery
 * is jittery, so comparing one inter-event gap against a threshold splits a
 * single flick into several "gestures" and advances several sections.
 *
 * Instead the gesture stays open and is re-armed by a timer that EVERY event
 * resets, so it ends only on sustained silence. This window is the main
 * sensitivity control: raise it if one flick ever advances two sections, lower
 * it to allow quicker successive flicks. Measured wheel-gap outliers on a real
 * GPU reach ~350ms, so going much below ~250 risks the double-advance bug.
 */
const GESTURE_QUIET = 260;
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
    let gestureOpen = false;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let touchHandled = false;
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
        }
      };
      raf = requestAnimationFrame(step);
    };

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

    /**
     * Relative move. The index is re-derived from the real scroll position
     * first, so scrolling by any other means — dragging the scrollbar, browser
     * find, focus scrolling, a programmatic jump — cannot leave us pointing at a
     * stale section and then jumping somewhere non-adjacent.
     */
    const step = (dir: number) => {
      if (!animating) index = nearestIndex();
      goTo(index + dir);
    };

    /** Any wheel activity keeps the current gesture open. */
    const keepGestureOpen = () => {
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        gestureOpen = false;
      }, GESTURE_QUIET);
    };

    const onWheel = (e: WheelEvent) => {
      const dir = Math.sign(e.deltaY);
      if (!dir) return;

      // Held even when a panel consumes the event, so reaching a panel's edge
      // mid-flick does not let the remainder of that flick fling the page.
      keepGestureOpen();

      if (panelWantsGesture(e.target, dir)) return;
      e.preventDefault();

      if (gestureOpen) return;
      gestureOpen = true;
      step(dir);
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
      // One section per finger-down, however far the finger travels.
      touchHandled = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      const travel = touchY - y;
      const dir = Math.sign(travel);
      if (!dir || Math.abs(travel) < SWIPE_PX) return;
      if (panelWantsGesture(e.target, dir)) return;
      e.preventDefault();
      if (touchHandled) return;
      touchHandled = true;
      touchY = y;
      step(dir);
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

      const absolute = e.key === 'Home' ? 0 : e.key === 'End' ? COUNT - 1 : null;
      const relative = e.key in KEY_STEPS ? KEY_STEPS[e.key] : null;
      if (absolute === null && relative === null) return;

      e.preventDefault();
      // Auto-repeat from a held key would run the page end to end.
      if (e.repeat || animating) return;

      if (absolute !== null) goTo(absolute);
      else step(relative!);
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
      clearTimeout(quietTimer);
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
