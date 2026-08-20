/**
 * Scroll-snap behaviour check.
 *
 * The point of this script is the INERTIA profile. A real trackpad flick emits
 * dozens of `wheel` events spread over 1–2 seconds with an exponentially
 * decaying delta — it does NOT emit them all in one tick. Any snap
 * implementation that locks input for a fixed duration will pass a synchronous
 * burst and still double-advance on a real flick, which is exactly the bug this
 * reproduces.
 *
 * IMPORTANT: the flick is driven through a raw CDP session, not
 * `page.mouse.wheel()`. Playwright's wheel helper waits for the scroll to
 * settle, so each call takes ~540ms — which turns an intended 35ms-cadence
 * flick into 40 separate gestures and reports a false failure. Chromium
 * coalesces rapid wheel events (as real hardware does), so the number of events
 * the page actually sees is lower than the number dispatched; that is fine, what
 * matters is that one continuous burst advances exactly one section.
 *
 * MUST RUN HEADED. Headless Chromium renders WebGL through SwiftShader, which
 * drives this scene at ~3fps versus ~118fps on the real GPU. At 3fps the main
 * thread cannot deliver wheel events faster than a few per second, so every
 * inter-event gap is inflated ~40x and any timing threshold measured there is
 * meaningless. Set HEADLESS=1 only to check non-timing assertions.
 *
 * Usage: node scripts/check-scroll-snap.mjs [url]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:3000/';
const SECTIONS = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Where each section comes to rest, mirroring SectionSnap.tsx. */
const expectedOffsets = (max) =>
  Array.from({ length: SECTIONS }, (_, i) =>
    i <= 0 ? 0 : i >= SECTIONS - 1 ? max : max * ((i + 0.5) / SECTIONS),
  );

/** Nearest section index to the current scroll position. */
async function sectionIndex(page) {
  return page.evaluate((n) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = (i) => (i <= 0 ? 0 : i >= n - 1 ? max : max * ((i + 0.5) / n));
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(window.scrollY - target(i));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return { index: best, scrollY: Math.round(window.scrollY), offBy: Math.round(bestD) };
  }, SECTIONS);
}

/**
 * One trackpad flick: a burst of wheel events with an exponentially decaying
 * delta, dispatched at a cadence a real trackpad produces.
 */
async function flick(cdp, { direction = 1, events = 48, spanMs = 1200, peak = 40 } = {}) {
  const gap = spanMs / events;
  const inflight = [];
  for (let i = 0; i < events; i++) {
    const decay = Math.exp(-3 * (i / events));
    const dy = Math.max(1, Math.round(peak * decay)) * direction;
    // NOT awaited. `await cdp.send(...)` blocks until the browser has processed
    // the event, so under a busy main thread it stretches a 25ms cadence into
    // 400-600ms gaps and the harness reports a failure the app does not have.
    // Real hardware emits on its own clock, so dispatch must not be serialised.
    inflight.push(
      cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseWheel', x: 720, y: 450, deltaX: 0, deltaY: dy,
      }).catch(() => {}),
    );
    await sleep(gap);
  }
  await Promise.all(inflight);
}

/** A single crisp mouse-wheel notch — no inertia. */
async function notch(cdp, direction = 1) {
  await cdp
    .send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 720,
      y: 450,
      deltaX: 0,
      deltaY: 100 * direction,
    })
    .catch(() => {});
}

const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  PASS' : '  FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ headless: process.env.HEADLESS === '1' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));

await page.goto(URL, { waitUntil: 'networkidle' });
const cdp = await page.context().newCDPSession(page);
await page.mouse.move(720, 450);
await page.evaluate(() => {
  window.__wheelTimes = [];
  window.addEventListener(
    'wheel',
    () => window.__wheelTimes.push(performance.now()),
    { passive: true },
  );
});
await sleep(1500);

/** Gaps between wheel events as the page actually saw them. */
async function cadence(page) {
  return page.evaluate(() => {
    const t = window.__wheelTimes;
    window.__wheelTimes = [];
    const gaps = t.map((v, i, a) => (i ? Math.round(v - a[i - 1]) : 0)).slice(1);
    if (!gaps.length) return { events: t.length, median: 0, max: 0 };
    const s = [...gaps].sort((a, b) => a - b);
    return { events: t.length, median: s[Math.floor(s.length / 2)], max: s[s.length - 1] };
  });
}

const max = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
);
const gl = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const ctx = c.getContext('webgl');
  const ext = ctx && ctx.getExtension('WEBGL_debug_renderer_info');
  return ext ? String(ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
});
const fps = await page.evaluate(
  () =>
    new Promise((res) => {
      let n = 0;
      const t0 = performance.now();
      const tick = () =>
        performance.now() - t0 < 1000
          ? (n++, requestAnimationFrame(tick))
          : res(Math.round(n / ((performance.now() - t0) / 1000)));
      requestAnimationFrame(tick);
    }),
);
console.log(`\nrenderer ${gl.slice(0, 64)}`);
console.log(`fps ${fps}${fps < 30 ? '   <-- SOFTWARE RENDERING, timing results are not meaningful' : ''}`);
console.log(`url ${URL}`);
console.log(`max scroll ${Math.round(max)}px`);
console.log(`rest offsets ${expectedOffsets(max).map((o) => Math.round(o)).join(', ')}\n`);

console.log('one realistic trackpad flick per gesture (down):');
for (let step = 1; step <= 4; step++) {
  const before = await sectionIndex(page);
  await flick(cdp, { direction: 1 });
  await sleep(1800);
  const after = await sectionIndex(page);
  const moved = after.index - before.index;
  const c = await cadence(page);
  record(
    `flick ${step}: section ${before.index} -> ${after.index}`,
    moved === 1,
    `advanced ${moved} (want 1); ${c.events} events, median gap ${c.median}ms, max ${c.max}ms`,
  );
}

console.log('\none realistic trackpad flick per gesture (up):');
for (let step = 1; step <= 2; step++) {
  const before = await sectionIndex(page);
  await flick(cdp, { direction: -1 });
  await sleep(1800);
  const after = await sectionIndex(page);
  const moved = after.index - before.index;
  record(
    `flick up ${step}: section ${before.index} -> ${after.index}`,
    moved === -1,
    `advanced ${moved} (want -1), off-target ${after.offBy}px`,
  );
}

console.log('\nsingle discrete wheel notch:');
{
  const before = await sectionIndex(page);
  await notch(cdp, 1);
  await sleep(1800);
  const after = await sectionIndex(page);
  const moved = after.index - before.index;
  record(
    `notch: section ${before.index} -> ${after.index}`,
    moved === 1,
    `advanced ${moved} (want 1)`,
  );
}

console.log('\ntwo deliberate flicks, separated by a pause:');
{
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(600);
  const before = await sectionIndex(page);
  await flick(cdp, { direction: 1 });
  await sleep(1500);
  await flick(cdp, { direction: 1 });
  await sleep(1800);
  const after = await sectionIndex(page);
  const moved = after.index - before.index;
  record(
    `2 separated flicks: section ${before.index} -> ${after.index}`,
    moved === 2,
    `advanced ${moved} (want 2)`,
  );
}

console.log('\ncomes to rest exactly on a station:');
{
  const rest = await sectionIndex(page);
  record('scroll rests on a snap offset', rest.offBy <= 2, `off by ${rest.offBy}px`);
  const station = await page.evaluate((n) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const prog = window.scrollY / max;
    const f = Math.max(0, Math.min(prog * n - 0.5, n - 1));
    const i = Math.min(n - 2, Math.floor(f));
    return +(i + (f - i)).toFixed(4);
  }, SECTIONS);
  record(
    'camera sits on an integer station',
    Math.abs(station - Math.round(station)) < 1e-6,
    `station ${station}`,
  );
}

record('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
