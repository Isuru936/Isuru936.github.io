import * as THREE from 'three';

import { type SceneFonts } from './fonts';
import { createScreenPainter } from './screen';
import { padTexture, paperTexture, phoneTexture } from './textures';

const TAU = Math.PI * 2;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export type MotionMode = 'full' | 'calm' | 'off';

export type DeskWorldOptions = {
  accent: string;
  motion: MotionMode;
  fonts: SceneFonts;
};

export type DeskWorldHandle = {
  dispose: () => void;
};

/**
 * The desk scene, ported from the design's `desk-world.js`.
 *
 * Deliberately imperative rather than React Three Fiber: the scene is driven by
 * scroll and pointer position, not React state, and keeping the original
 * structure is what preserves pixel fidelity. Geometry positions, material
 * colours, light intensities and camera stations are unchanged from the design.
 */
export function createDeskWorld(host: HTMLElement, opts: DeskWorldOptions): DeskWorldHandle {
  const { accent: hexAccent, motion, fonts } = opts;

  host.style.display = 'block';
  host.style.width = '100%';
  host.style.height = '100%';

  const size = () => ({
    w: Math.max(1, host.clientWidth),
    h: Math.max(1, host.clientHeight),
  });
  const { w, h } = size();

  // `preserveDrawingBuffer` from the design is dropped: it exists so the design
  // canvas can screenshot the scene, and costs performance in production.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  // The design used PCFSoftShadowMap on r155. That constant is deprecated in
  // r185 and silently falls back to PCFShadowMap, so it is named explicitly.
  // `radius` recovers some of the lost softness. Shadow edges are still very
  // slightly crisper than the design — see the fidelity notes.
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090c, 0.028);
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.05, 90);
  const accent = new THREE.Color(hexAccent);

  const M = (color: THREE.ColorRepresentation, o?: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color, roughness: 0.72, metalness: 0.1, flatShading: true }, o || {}),
    );

  const matDesk = M(0x2a2118, { roughness: 0.85 });
  const matDeskTop = M(0x3a2e21, { roughness: 0.8 });
  const matMetal = M(0x141a20, { roughness: 0.35, metalness: 0.8 });
  const matDark = M(0x0d1116, { roughness: 0.5, metalness: 0.4 });
  const matFur = M(0xd9a35f, { roughness: 0.95, metalness: 0 });
  const matFurDark = M(0xb07f43, { roughness: 0.95 });
  const matCream = M(0xf1e3cd, { roughness: 0.95 });
  const matHoodie = M(0x27313a, { roughness: 0.95 });
  const matEye = M(0x0b0f13, { roughness: 0.2, metalness: 0.1 });
  const matMug = M(0xcf5b4a, { roughness: 0.6 });

  const rig = new THREE.Group();
  scene.add(rig);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(16, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a0e12, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  rig.add(floor);

  // ---------------- desk
  const desk = new THREE.Group();
  rig.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.14, 2.6), matDeskTop);
  top.position.y = 1.02;
  top.castShadow = true;
  top.receiveShadow = true;
  desk.add(top);
  ([[-3.0, -1.1], [3.0, -1.1], [-3.0, 1.1], [3.0, 1.1]] as const).forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.02, 0.14), matDesk);
    leg.position.set(x, 0.51, z);
    leg.castShadow = true;
    desk.add(leg);
  });

  // ---------------- monitor (profile station)
  const monitor = new THREE.Group();
  monitor.position.set(-0.05, 1.09, -0.72);
  desk.add(monitor);
  const mBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.06, 24), matMetal);
  mBase.position.y = 0.03;
  mBase.castShadow = true;
  monitor.add(mBase);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.12), matMetal);
  stem.position.y = 0.36;
  stem.castShadow = true;
  monitor.add(stem);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(3.05, 1.82, 0.12), matDark);
  shell.position.y = 1.5;
  shell.castShadow = true;
  monitor.add(shell);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 1280;
  screenCanvas.height = 800;
  const sctx = screenCanvas.getContext('2d')!;
  sctx.scale(2, 2);
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.84, 1.62),
    new THREE.MeshBasicMaterial({ map: screenTex }),
  );
  screen.position.set(0, 1.5, 0.062);
  monitor.add(screen);
  const glow = new THREE.PointLight(accent.getHex(), 6, 6.5);
  glow.position.set(0, 2.6, 0.9);
  monitor.add(glow);

  const paint = createScreenPainter(sctx, hexAccent, fonts);
  const flushScreen = () => {
    screenTex.needsUpdate = true;
  };

  // ---------------- keyboard (stack station)
  const kbd = new THREE.Group();
  kbd.position.set(-0.15, 1.11, 0.28);
  desk.add(kbd);
  const kBase = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.55), matDark);
  kBase.castShadow = true;
  kbd.add(kBase);
  const matAccentKey = M(accent.getHex(), { roughness: 0.4, metalness: 0.3 });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 12; c++) {
      const keycap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.1), matMetal);
      keycap.position.set(-0.72 + c * 0.131, 0.05, -0.15 + r * 0.14);
      if (r === 1 && c === 4) keycap.material = matAccentKey;
      kbd.add(keycap);
    }
  }

  // ---------------- mouse + pad (projects station)
  const padTex = new THREE.CanvasTexture(padTexture(hexAccent, fonts));
  padTex.colorSpace = THREE.SRGBColorSpace;
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.015, 0.68),
    new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.95 }),
  );
  pad.position.set(1.28, 1.095, 0.3);
  pad.receiveShadow = true;
  desk.add(pad);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), matDark);
  mouse.scale.set(0.72, 0.45, 1.05);
  mouse.position.set(1.28, 1.13, 0.3);
  mouse.castShadow = true;
  desk.add(mouse);
  const mouseLed = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.012),
    new THREE.MeshBasicMaterial({ color: accent }),
  );
  mouseLed.rotation.x = -Math.PI / 2;
  mouseLed.position.set(1.28, 1.187, 0.33);
  desk.add(mouseLed);

  // ---------------- papers (experience station)
  const papers = new THREE.Group();
  papers.position.set(-2.15, 1.095, 0.42);
  desk.add(papers);
  const pTex = new THREE.CanvasTexture(paperTexture(hexAccent, fonts));
  pTex.colorSpace = THREE.SRGBColorSpace;
  const pMatTop = new THREE.MeshStandardMaterial({ map: pTex, roughness: 0.95 });
  const matSheet = M(0xe4dccc, { roughness: 0.95 });
  ([[-0.06, 0.004, 0.02, -0.22], [0.05, 0.012, -0.03, 0.14], [0, 0.022, 0, -0.05]] as const).forEach(
    ([x, y, z, rot], i) => {
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.008, 1.04),
        i === 2 ? pMatTop : matSheet,
      );
      sheet.position.set(x, y, z);
      sheet.rotation.y = rot;
      sheet.castShadow = true;
      sheet.receiveShadow = true;
      papers.add(sheet);
    },
  );
  const pen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.62, 10),
    M(0x1a1f26, { metalness: 0.6, roughness: 0.4 }),
  );
  pen.rotation.set(0, 0.5, Math.PI / 2);
  pen.position.set(0.28, 0.05, 0.42);
  pen.castShadow = true;
  papers.add(pen);

  // ---------------- phone (contact station)
  const phone = new THREE.Group();
  phone.position.set(2.28, 1.095, 0.62);
  phone.rotation.y = -0.42;
  desk.add(phone);
  const pBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.03, 0.76),
    M(0x101519, { roughness: 0.35, metalness: 0.7 }),
  );
  pBody.castShadow = true;
  phone.add(pBody);
  const pTexS = new THREE.CanvasTexture(phoneTexture(hexAccent, fonts));
  pTexS.colorSpace = THREE.SRGBColorSpace;
  const pScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.33, 0.7),
    new THREE.MeshBasicMaterial({ map: pTexS }),
  );
  pScreen.rotation.x = -Math.PI / 2;
  pScreen.position.y = 0.017;
  phone.add(pScreen);

  // ---------------- mug + steam
  const mug = new THREE.Group();
  mug.position.set(-1.25, 1.09, -0.18);
  desk.add(mug);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.28, 20), matMug);
  cup.position.y = 0.14;
  cup.castShadow = true;
  mug.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 8, 16), matMug);
  handle.position.set(-0.17, 0.16, 0);
  handle.rotation.y = Math.PI / 2;
  mug.add(handle);
  const steam: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xdfe6ea, transparent: true, opacity: 0.2 }),
    );
    p.userData.t = i / 7;
    mug.add(p);
    steam.push(p);
  }

  // ---------------- lamp
  const lamp = new THREE.Group();
  lamp.position.set(2.62, 1.09, -0.62);
  desk.add(lamp);
  const lbase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 20), matMetal);
  lbase.position.y = 0.025;
  lamp.add(lbase);
  const larm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.05), matMetal);
  larm.position.set(0, 0.5, 0);
  larm.rotation.z = 0.24;
  lamp.add(larm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.34, 20, 1, true), matMetal);
  shade.position.set(-0.3, 0.98, 0);
  shade.rotation.z = 2.5;
  lamp.add(shade);
  const bulb = new THREE.PointLight(0xffd9a0, 10, 6, 2);
  bulb.position.set(-0.36, 0.86, 0);
  bulb.castShadow = true;
  lamp.add(bulb);

  // ---------------- plant
  const plant = new THREE.Group();
  plant.position.set(-2.85, 1.09, -0.68);
  desk.add(plant);
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.13, 0.26, 12),
    M(0x8c6f52, { roughness: 0.9 }),
  );
  pot.position.y = 0.13;
  pot.castShadow = true;
  plant.add(pot);
  const matLeaf = M(0x3d6b50, { roughness: 0.9 });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.44, 5), matLeaf);
    const a = (i / 7) * TAU;
    leaf.position.set(Math.cos(a) * 0.09, 0.44, Math.sin(a) * 0.09);
    leaf.rotation.set(Math.cos(a) * 0.42, 0, -Math.sin(a) * 0.42);
    leaf.castShadow = true;
    plant.add(leaf);
  }

  // ---------------- the cat
  const cat = new THREE.Group();
  cat.position.set(-0.15, 0, 1.35);
  rig.add(cat);
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.95), matHoodie);
  chairSeat.position.set(0, 0.62, 0.1);
  chairSeat.castShadow = true;
  cat.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.05, 0.12), matHoodie);
  chairBack.position.set(0, 1.15, 0.55);
  chairBack.castShadow = true;
  cat.add(chairBack);
  const chairPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12), matMetal);
  chairPost.position.set(0, 0.3, 0.1);
  cat.add(chairPost);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 6, 16), matHoodie);
  body.position.set(0, 1.15, 0.16);
  body.castShadow = true;
  cat.add(body);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), matCream);
  chest.scale.set(1, 0.9, 0.5);
  chest.position.set(0, 1.12, -0.16);
  cat.add(chest);

  const head = new THREE.Group();
  head.position.set(0, 1.78, 0.06);
  cat.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), matFur);
  skull.scale.set(1, 0.94, 0.95);
  skull.castShadow = true;
  head.add(skull);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), matCream);
  muzzle.scale.set(1.15, 0.72, 0.8);
  muzzle.position.set(0, -0.13, -0.32);
  head.add(muzzle);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.06, 4), matMug);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, -0.08, -0.47);
  head.add(nose);
  const eyes: THREE.Mesh[] = [];
  [-0.16, 0.16].forEach((x) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), matEye);
    e.position.set(x, 0.04, -0.36);
    e.scale.set(1, 1, 0.7);
    head.add(e);
    eyes.push(e);
  });
  const matWhisker = new THREE.LineBasicMaterial({
    color: 0xe9e2d4,
    transparent: true,
    opacity: 0.55,
  });
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 4), matFur);
    ear.position.set(s * 0.26, 0.4, 0.02);
    ear.rotation.z = s * 0.28;
    ear.rotation.y = Math.PI / 4;
    ear.castShadow = true;
    head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 4), matFurDark);
    inner.position.set(s * 0.26, 0.4, -0.04);
    inner.rotation.z = s * 0.28;
    inner.rotation.y = Math.PI / 4;
    head.add(inner);
    for (let i = 0; i < 3; i++) {
      const wg = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(s * 0.12, -0.08, -0.44),
        new THREE.Vector3(s * 0.5, -0.03 + i * 0.05, -0.42),
      ]);
      head.add(new THREE.Line(wg, matWhisker));
    }
  });

  const arms: Array<{ shoulder: THREE.Group; paw: THREE.Mesh }> = [];
  [-1, 1].forEach((s) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.4, 1.42, 0.02);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.46, 4, 12), matHoodie);
    upper.position.set(0, -0.2, -0.22);
    upper.rotation.x = -0.95;
    upper.castShadow = true;
    shoulder.add(upper);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), matFur);
    paw.scale.set(1, 0.72, 1.1);
    paw.position.set(0, -0.44, -0.62);
    shoulder.add(paw);
    cat.add(shoulder);
    arms.push({ shoulder, paw });
  });

  const tail = new THREE.Group();
  tail.position.set(0, 0.75, 0.62);
  cat.add(tail);
  const tailSegs: THREE.Group[] = [];
  let prev: THREE.Object3D = tail;
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    g.position.set(0, 0.18, 0.06);
    const seg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085 - i * 0.011, 0.16, 4, 10),
      i % 2 ? matFurDark : matFur,
    );
    seg.position.y = 0.09;
    seg.castShadow = true;
    g.add(seg);
    prev.add(g);
    prev = g;
    tailSegs.push(g);
  }

  // ---------------- lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  scene.add(new THREE.HemisphereLight(0xbcd4e6, 0x161d24, 0.9));
  const keyLight = new THREE.DirectionalLight(0xcfe4ff, 1.9);
  keyLight.position.set(-6, 8, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.radius = 2;
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 9;
  keyLight.shadow.camera.bottom = -9;
  scene.add(keyLight);
  const fill = new THREE.PointLight(accent.getHex(), 5, 16);
  fill.position.set(4, 3, 5);
  scene.add(fill);

  // ---------------- camera stations, one per page section
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const stations = [
    { pos: V(3.09, 3.8, 8.19), tgt: V(-0.1, 1.5, 0.2), sx: 0.3, sy: -0.18 },
    { pos: V(0.9, 3.15, 4.1), tgt: V(-0.05, 2.2, -0.6), sx: -0.34, sy: 0.02 },
    { pos: V(5.6, 2.0, 2.6), tgt: V(1.6, 1.25, 0.35), sx: 0.3, sy: -0.05 },
    { pos: V(-5.4, 2.1, 2.9), tgt: V(-2.0, 1.25, 0.4), sx: -0.3, sy: -0.05 },
    { pos: V(0.1, 4.3, 3.4), tgt: V(-0.15, 1.2, 0.3), sx: 0.3, sy: 0.0 },
    { pos: V(3.95, 1.82, 2.95), tgt: V(2.28, 1.16, 0.62), sx: -0.28, sy: -0.02 },
  ];

  /**
   * Nudges the camera so `tgt` lands at normalised screen position (sx, sy).
   * Estimates the screen-space gradient numerically by test-translating the
   * camera, then solves for the offset. Order-dependent and deliberately not
   * "cleaned up" — it must run after lookAt, every frame, on a freshly
   * positioned camera so the offset never accumulates.
   */
  const probe = new THREE.Vector3();
  const frame = (tgt: THREE.Vector3, sx: number, sy: number) => {
    const lim = (v: number) => Math.max(-1.6, Math.min(1.6, v));
    probe.copy(tgt).project(camera);
    const x0 = probe.x;
    const y0 = probe.y;

    camera.translateX(0.2);
    camera.updateMatrixWorld();
    probe.copy(tgt).project(camera);
    const gx = (probe.x - x0) / 0.2;
    camera.translateX(-0.2);

    camera.translateY(0.2);
    camera.updateMatrixWorld();
    probe.copy(tgt).project(camera);
    const gy = (probe.y - y0) / 0.2;
    camera.translateY(-0.2);

    if (Math.abs(gx) > 0.05) camera.translateX(lim((sx - x0) / gx));
    if (Math.abs(gy) > 0.05) camera.translateY(lim((sy - y0) / gy));
    camera.updateMatrixWorld();
  };

  const camPos = stations[0].pos.clone();
  const camTgt = stations[0].tgt.clone();
  const wantPos = new THREE.Vector3();
  const wantTgt = new THREE.Vector3();

  let mx = 0;
  let my = 0;
  let tmx = 0;
  let tmy = 0;
  let prog = 0;
  let tProg = 0;

  const onMove = (e: PointerEvent) => {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const onResize = () => {
    const s = size();
    renderer.setSize(s.w, s.h);
    camera.aspect = s.w / s.h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
  ro?.observe(host);

  const mk = motion === 'off' ? 0 : motion === 'calm' ? 0.4 : 1;
  // THREE.Clock is deprecated in r185. Timing is tracked directly, which also
  // fixes a latent bug: the design called `clock.getElapsedTime()` and then
  // `clock.getDelta()`, but getElapsedTime() internally consumes the delta, so
  // dt was ~0 and the steam and the cat's blink never advanced. They animate
  // now. To restore the design's frozen behaviour exactly, hardcode dt = 0.
  const startTime = performance.now();
  let prevTime = startTime;
  let blink = 2 + Math.random() * 3;
  let raf = 0;
  let lastPaint = -1;
  let lastMix = 0;
  let lastSMix = 0;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const nowMs = performance.now();
    const t = (nowMs - startTime) / 1000;
    const dt = Math.min((nowMs - prevTime) / 1000, 0.05);
    prevTime = nowMs;

    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    tProg = clamp((window.scrollY || doc.scrollTop || 0) / max, 0, 1);
    // Tighter than the design's 0.09. Scroll position no longer drifts to a
    // stop by itself — SectionSnap tweens it on a fixed ease and stops dead on
    // a station — so this smoothing is now stacked on top of an already smooth
    // input, and the camera lerp below adds a third pass. At 0.09 the camera
    // was still creeping about a second after the page had stopped moving.
    prog += (tProg - prog) * 0.14;

    const N = stations.length;
    const f = clamp(prog * N - 0.5, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(f));
    const k = smooth(clamp(f - i, 0, 1));
    wantPos.copy(stations[i].pos).lerp(stations[i + 1].pos, k);
    wantTgt.copy(stations[i].tgt).lerp(stations[i + 1].tgt, k);

    mx += (tmx - mx) * 0.045;
    my += (tmy - my) * 0.045;
    const par = 0.35 * (1 - prog * 0.65);
    wantPos.x += mx * par;
    wantPos.y += -my * par * 0.55;

    camPos.lerp(wantPos, 0.075);
    camTgt.lerp(wantTgt, 0.085);
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
    frame(
      camTgt,
      stations[i].sx + (stations[i + 1].sx - stations[i].sx) * k,
      stations[i].sy + (stations[i + 1].sy - stations[i].sy) * k,
    );

    arms.forEach((a, idx) => {
      const beat = (Math.sin(t * 9 + idx * 1.7) * 0.5 + Math.sin(t * 4.3 + idx) * 0.2) * mk;
      a.shoulder.rotation.x = beat * 0.08;
      a.paw.position.y = -0.44 + Math.max(0, beat) * 0.05;
    });
    body.position.y = 1.15 + Math.sin(t * 1.6) * 0.012 * mk;
    head.rotation.y = -0.2 + Math.sin(t * 0.5) * 0.1 * mk;
    head.rotation.x = 0.1 + Math.sin(t * 0.9) * 0.03 * mk;

    blink -= dt;
    const closing = blink < 0.12 && blink > 0;
    eyes.forEach((e) => {
      e.scale.y = closing ? 0.12 : 1;
    });
    if (blink <= 0) blink = 2.5 + Math.random() * 3.5;

    tailSegs.forEach((g, idx) => {
      g.rotation.z = Math.sin(t * 1.5 - idx * 0.5) * 0.16 * mk;
      g.rotation.x = 0.12 + Math.cos(t * 1.1 - idx * 0.4) * 0.06 * mk;
    });

    steam.forEach((p) => {
      p.userData.t = ((p.userData.t as number) + dt * 0.32 * (mk || 0.001)) % 1;
      const u = p.userData.t as number;
      p.position.set(Math.sin(u * 7) * 0.06, 0.32 + u * 0.55, Math.cos(u * 5) * 0.04);
      p.material.opacity = 0.24 * (1 - u);
      p.scale.setScalar(0.7 + u * 1.4);
    });

    glow.intensity = 5.4 + Math.sin(t * 7) * 0.5 * mk;

    const seg = 1 / stations.length;
    const at = (idx: number) => clamp(1 - Math.abs(prog - (idx + 0.5) * seg) / (seg * 0.85), 0, 1);
    const mix = at(1);
    const sMix = at(4);
    if (
      t - lastPaint > 0.06 ||
      Math.abs(mix - lastMix) > 0.01 ||
      Math.abs(sMix - lastSMix) > 0.01
    ) {
      paint(mk ? t : 0, mix, sMix);
      flushScreen();
      lastPaint = t;
      lastMix = mix;
      lastSMix = sMix;
    }

    renderer.render(scene, camera);
  };

  paint(0, 0, 0);
  flushScreen();

  const onVis = () => {
    if (!document.hidden) renderer.render(scene, camera);
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('focus', onVis);

  tick();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
      ro?.disconnect();

      // The design only disposed the renderer, which leaks every geometry,
      // material and texture on client-side navigation.
      scene.traverse((obj) => {
        const mesh = obj as Partial<THREE.Mesh>;
        mesh.geometry?.dispose();
        const mat = mesh.material;
        const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
        for (const m of mats) {
          for (const value of Object.values(m)) {
            if (value instanceof THREE.Texture) value.dispose();
          }
          m.dispose();
        }
      });

      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
