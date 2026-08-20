import type { SceneFonts } from './fonts';

/**
 * Canvas-drawn textures for the desk props, transcribed from the design's
 * desk-world.js. Every coordinate, size and colour is intentionally identical —
 * these are the "values in the design" and must not be tidied.
 */

/** Papers on the desk — the experience station. */
export function paperTexture(accent: string, fonts: SceneFonts): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 520;
  c.height = 700;
  const x = c.getContext('2d')!;

  x.fillStyle = '#efe8da';
  x.fillRect(0, 0, 520, 700);
  x.fillStyle = '#2f2e2a';
  x.font = `700 34px ${fonts.sans}`;
  x.fillText('Experience', 44, 78);
  x.fillStyle = accent;
  x.fillRect(44, 96, 64, 4);

  const rows: Array<[string, string, string]> = [
    ['2026 — NOW', 'Software Engineer', 'Ascentic'],
    ['2025 — 2026', 'Associate Software Engineer', 'Ascentic'],
    ['2024 — 2025', 'Software Engineer Intern', 'Ascentic'],
  ];

  let y = 168;
  rows.forEach(([when, role, org]) => {
    x.font = `500 16px ${fonts.mono}`;
    x.fillStyle = '#8a8478';
    x.fillText(when, 44, y);
    x.font = `500 24px ${fonts.sans}`;
    x.fillStyle = '#2f2e2a';
    x.fillText(role, 44, y + 34);
    x.font = `400 16px ${fonts.mono}`;
    x.fillStyle = '#8a8478';
    x.fillText(org, 44, y + 60);
    x.fillStyle = '#cdc6b8';
    // Randomised bar widths, as in the design — the sheet differs per load.
    for (let i = 0; i < 3; i++) x.fillRect(44, y + 84 + i * 14, 300 + Math.random() * 120, 4);
    y += 168;
    x.strokeStyle = '#d8d1c3';
    x.beginPath();
    x.moveTo(44, y - 40);
    x.lineTo(476, y - 40);
    x.stroke();
  });

  return c;
}

/** Desk mat under the mouse — the "what I work on" station. */
export function padTexture(accent: string, fonts: SceneFonts): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 384;
  const x = c.getContext('2d')!;

  x.fillStyle = '#171d24';
  x.fillRect(0, 0, 512, 384);
  x.strokeStyle = 'rgba(255,255,255,0.08)';
  x.strokeRect(14, 14, 484, 356);
  x.font = `500 20px ${fonts.mono}`;
  x.fillStyle = accent;
  x.fillText('WHAT I WORK ON', 40, 74);

  const items = ['01  .net web applications', '02  react + next.js', '03  azure / vercel'];
  x.font = `400 22px ${fonts.mono}`;
  items.forEach((it, i) => {
    x.fillStyle = i === 0 ? '#d3d9dd' : '#8a949c';
    x.fillText(it, 40, 148 + i * 46);
  });

  x.fillStyle = '#4d5a66';
  x.font = `400 16px ${fonts.mono}`;
  x.fillText('details on the left', 40, 330);

  return c;
}

/** Phone lying on the desk — the contact station. */
export function phoneTexture(accent: string, fonts: SceneFonts): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 768;
  const x = c.getContext('2d')!;

  x.fillStyle = '#0a1014';
  x.fillRect(0, 0, 384, 768);
  x.fillStyle = '#131b21';
  x.fillRect(0, 0, 384, 74);
  x.font = `500 20px ${fonts.mono}`;
  x.fillStyle = '#6f787f';
  x.fillText('09:41', 30, 46);

  x.font = `700 34px ${fonts.sans}`;
  x.fillStyle = '#eef2f4';
  x.fillText('Isuru', 30, 170);
  x.fillText('Bandara', 30, 210);

  x.font = `500 18px ${fonts.mono}`;
  x.fillStyle = accent;
  x.fillText('SOFTWARE ENGINEER', 30, 250);
  x.font = `400 16px ${fonts.mono}`;
  x.fillStyle = '#6f787f';
  x.fillText('ASCENTIC', 30, 276);

  x.font = `400 17px ${fonts.mono}`;
  x.fillStyle = '#aeb7bd';
  x.fillText('Isuru.gayantha@', 30, 344);
  x.fillText('outlook.com', 30, 370);
  x.fillText('+94 76 993 7578', 30, 406);
  x.fillText('linkedin.com/in/', 30, 436);
  x.fillText('isuru-g-bandara', 30, 462);

  x.fillStyle = accent;
  x.fillRect(30, 470, 324, 66);
  x.fillStyle = '#07090c';
  x.font = `500 22px ${fonts.mono}`;
  x.fillText('SAY HELLO', 108, 512);

  x.strokeStyle = 'rgba(255,255,255,0.14)';
  x.strokeRect(30, 566, 324, 66);
  x.fillStyle = '#d3d9dd';
  x.fillText('DOWNLOAD CV', 92, 608);

  x.fillStyle = '#39434c';
  x.fillRect(132, 712, 120, 8);

  return c;
}
