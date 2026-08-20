'use client';

import { useEffect } from 'react';

/** Camera stations in `deskScene` — one per page section. */
const COUNT = 6;

/** How long one section-to-section move takes. */
const DURATION = 620;

/**
 * Gap in *event time* that separates one gesture from the next.
 *
 * A flick — however hard — is one unbroken stream of `wheel` events, and one
 * stream moves one section. What makes a window this short safe is that the gap
 * is measured with `event.timeStamp`, the moment the browser *created* the
 * event, rather than a clock read when the handler happens to run. This page
 * renders a shadowed three.js scene every frame, so events are delivered late
 * and in bunches: dispatch-time gaps read as several hundred milliseconds in the
 * middle of a single flick, which forces a naive implementation to set this over
 * a second, and then scrolling feels dead. Creation timestamps are unaffected by
 * that delivery backlog.
 *
 * The margin is against a momentum stream *thinning out* rather than stopping:
 * macOS emits momentum wheel events at display refresh rate right up until they
 * end, so real gaps inside one flick stay near 16ms. A deliberate second flick
 * is never less than ~250ms behind the first, so this sits comfortably between
 * the two and does not read as a gate.
 */
const GESTURE_GAP = 160;

/**
 * Floor on a wheel delta that is allowed to declare a direction. Trackpads emit
 * a few opposite-sign scraps at the edges of a flick; those are noise, not a
 * reversal.
 */
const DIR_DELTA = 4;

/**
 * Hard ceiling on the step rate, whatever the timestamps claim. Nothing below
 * should need it — it bounds the worst case if an engine ever reports dispatch
 * time as `timeStamp`, so the failure is "slightly stiff" and never "the flick
 * ran the page end to end".
 */
const MIN_STEP_GAP = 240;

/** Finger travel that turns a drag into a swipe. */
const SWIPE_PX = 44;

/** Settling time before a scroll we did not cause is pulled back on station. */
const SETTLE = 150;

/** Height change that counts as a real resize and not a mobile URL bar. */
const RESIZE_SLOP = 140;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * One section per gesture, in either direction.
 *
 * Scroll position stays the transport — `deskScene` and `PanelFocus` both read
 * it every frame — but it only ever comes to rest on one of `COUNT` offsets.
 * Every input is reduced to a discrete ±1 and the page is tweened there; the
 * scene keeps reading scrollY continuously, so its lerp still plays the move.
 */
export function SectionSnap() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let index = 0;
    let animating = false;
    let raf = 0;

    // Gesture state. `lastWheelAt` is in event time, `lastStepAt` in wall time.
    let lastWheelAt = -Infinity;
    let lastStepAt = -Infinity;
    let lastDir = 0;

    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let viewW = window.innerWidth;
    let viewH = window.innerHeight;

    const maxScroll = () =>
      Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    /**
     * Where section `i` comes to rest.
     *
     * `deskScene` turns scroll progress into a camera station with
     * `f = clamp(progress * COUNT - 0.5)`, so station `i` sits at
     * `(i + 0.5) / COUNT` of the range. The two ends are pinned to 0 and max
     * instead: that clamp already parks the camera exactly on the first and last
     * station there, and only those offsets leave the first and last sticky
     * panel centred in the viewport.
     */
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

    /** Absolute move. `instant` skips the tween without skipping the maths. */
    const goTo = (next: number, instant = false) => {
      const clamped = Math.max(0, Math.min(COUNT - 1, next));
      index = clamped;

      const from = window.scrollY;
      const to = targetFor(clamped);

      cancelAnimationFrame(raf);

      if (instant || reduceMotion.matches || Math.abs(to - from) < 1) {
        animating = false;
        window.scrollTo({ top: to, behavior: 'instant' });
        return;
      }

      animating = true;
      const start = performance.now();

      const frame = () => {
        const p = Math.min(1, (performance.now() - start) / DURATION);
        // 'instant' every frame: this tween IS the easing, and a second
        // smoothing pass from `scroll-behavior` would fight it. The last frame
        // writes `to` exactly rather than the eased value, so we land on the
        // station to the pixel and nothing schedules a corrective re-snap.
        window.scrollTo({
          top: p < 1 ? from + (to - from) * easeInOutCubic(p) : to,
          behavior: 'instant',
        });
        if (p < 1) raf = requestAnimationFrame(frame);
        else animating = false;
      };
      raf = requestAnimationFrame(frame);
    };

    /**
     * Relative move. At rest the index is re-derived from the real position, so
     * a scrollbar drag or a find-in-page jump cannot leave us stepping from a
     * stale section. Mid-tween the logical index wins instead: the page is
     * between two stations there, and "nearest" is a coin flip.
     */
    const step = (dir: number) => {
      if (!animating) index = nearestIndex();
      goTo(index + dir);
    };

    /** Nearest ancestor that scrolls its own content. */
    const panelAt = (target: EventTarget | null) => {
      let el = target instanceof Element ? target : null;
      while (el) {
        if (el instanceof HTMLElement && el.hasAttribute('data-panel')) return el;
        el = el.parentElement;
      }
      return null;
    };

    /**
     * A panel taller than its box scrolls its own content first; only once it is
     * at the edge does the gesture move the page.
     */
    const panelTakes = (el: HTMLElement | null, dir: number) => {
      if (!el) return false;
      const slack = el.scrollHeight - el.clientHeight;
      if (slack <= 1) return false;
      return dir > 0 ? el.scrollTop < slack - 1 : el.scrollTop > 1;
    };

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      const dir = Math.sign(delta);
      if (!dir) return;

      const loud = Math.abs(delta) >= DIR_DELTA;
      // Momentum decays, it never reverses, so a push the other way is always a
      // deliberate new gesture and must not wait out the gap.
      const fresh = e.timeStamp - lastWheelAt > GESTURE_GAP || (loud && dir !== lastDir);

      // Recorded even when a panel eats the event, so reaching a panel's edge
      // mid-flick does not let the remainder of that flick fling the page.
      lastWheelAt = e.timeStamp;
      if (loud) lastDir = dir;

      if (panelTakes(panelAt(e.target), dir)) return;
      e.preventDefault();

      if (!fresh) return;
      const now = performance.now();
      if (now - lastStepAt < MIN_STEP_GAP) return;
      lastStepAt = now;
      step(dir);
    };

    let touchY = 0;
    let touchDir = 0;
    let touchPanel: HTMLElement | null = null;
    let touchLive = false;
    let swiped = false;

    const onTouchStart = (e: TouchEvent) => {
      // Pinch and other multi-touch belong to the browser.
      touchLive = e.touches.length === 1;
      if (!touchLive) return;
      touchY = e.touches[0].clientY;
      touchDir = 0;
      touchPanel = panelAt(e.target);
      // One section per finger-down, however far the finger travels.
      swiped = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchLive) return;
      const travel = touchY - (e.touches[0]?.clientY ?? touchY);
      touchDir = Math.sign(travel) || touchDir;

      // Only hand the gesture to the panel once the finger has declared a
      // direction. With travel still at zero the finger has not asked anything
      // to scroll yet, and guessing wrong here is what lets a native page pan
      // start — after which preventDefault is ignored for the rest of the drag.
      if (touchDir && panelTakes(touchPanel, touchDir)) return;
      // Cancelled from the very first move so a native pan never starts. Doing
      // it only once the swipe passes SWIPE_PX is too late: by then the browser
      // owns the scroll and preventDefault is ignored.
      if (e.cancelable) e.preventDefault();

      if (swiped || Math.abs(travel) < SWIPE_PX) return;
      swiped = true;
      step(touchDir);
    };

    const onTouchEnd = () => {
      touchLive = false;
      touchPanel = null;
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

      let relative = 0;
      let absolute: number | null = null;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          relative = 1;
          break;
        case 'ArrowUp':
        case 'PageUp':
          relative = -1;
          break;
        case ' ':
          relative = e.shiftKey ? -1 : 1;
          break;
        case 'Home':
          absolute = 0;
          break;
        case 'End':
          absolute = COUNT - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      // Auto-repeat from a held key would run the page end to end.
      if (e.repeat) return;
      if (absolute !== null) goTo(absolute);
      else step(relative);
    };

    /** Nav anchors must land on the same offsets, not the raw section top. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href^="#s"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      const i = Number(href.slice(2));
      if (!Number.isInteger(i) || i < 0 || i >= COUNT) return;
      e.preventDefault();
      goTo(i);
    };

    /**
     * Anything that moved the page without going through `goTo` — a middle-click
     * autoscroll, find-in-page, focusing an off-screen link, a restored scroll
     * position — is pulled back onto the nearest station once it stops.
     */
    const onScroll = () => {
      if (animating) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        if (animating) return;
        const i = nearestIndex();
        if (Math.abs(window.scrollY - targetFor(i)) > 2) goTo(i);
      }, SETTLE);
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // A mobile URL bar sliding away fires resize continuously. Re-snapping on
      // that fights the user's own scroll, so only a width change or a
      // substantial height change counts.
      if (w === viewW && Math.abs(h - viewH) < RESIZE_SLOP) return;
      viewW = w;
      viewH = h;
      clearTimeout(resizeTimer);
      // Targets are ratios of the scrollable range, so a resize moves them all;
      // the section we are on is unchanged.
      resizeTimer = setTimeout(() => goTo(index, true), SETTLE);
    };

    // Start on a station: a reload restores an arbitrary offset, and a `#s3`
    // link lands on the section's raw top, which is between two of ours.
    raf = requestAnimationFrame(() => goTo(nearestIndex(), true));

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settleTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return null;
}
