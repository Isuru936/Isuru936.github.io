import type { SceneFonts } from './fonts';

const TAU = Math.PI * 2;

type CodeLine = {
  indent: number;
  parts: Array<{ w: number; kind: number }>;
};

/** Deterministic pseudo-random code layout, so the editor looks the same each load. */
function seedLines(seed: number): CodeLine[] {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);

  return Array.from({ length: 22 }, () => ({
    indent: Math.floor(rnd() * 4),
    parts: Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => ({
      w: 22 + rnd() * 130,
      kind: Math.floor(rnd() * 3),
    })),
  }));
}

/**
 * Paints the monitor's canvas texture. Three layers composite by scroll
 * position: a scrolling code editor underneath, with the profile and stack
 * "documents" fading in over it at their respective camera stations.
 *
 * Logical drawing space is 640x400; the backing canvas is 2x for HiDPI.
 */
export function createScreenPainter(
  sctx: CanvasRenderingContext2D,
  hexAccent: string,
  fonts: SceneFonts,
) {
  const W = 640;
  const H = 400;
  const projects = ['OrderService', 'Program', 'ApiClient'];
  const lines = seedLines(1);

  const wrap = (
    text: string,
    x: number,
    y: number,
    maxW: number,
    lh: number,
    font: string,
    color: string,
  ) => {
    sctx.font = font;
    sctx.fillStyle = color;
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (sctx.measureText(test).width > maxW && line) {
        sctx.fillText(line, x, y);
        y += lh;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) sctx.fillText(line, x, y);
    return y + lh;
  };

  /** Window chrome shared by all three layers. */
  const chrome = (title: string, titleSize: number) => {
    sctx.fillStyle = '#101821';
    sctx.fillRect(0, 0, W, 34);
    ['#4f5b66', '#4f5b66', hexAccent].forEach((c, i) => {
      sctx.fillStyle = c;
      sctx.beginPath();
      sctx.arc(20 + i * 18, 17, 5, 0, TAU);
      sctx.fill();
    });
    sctx.font = `500 ${titleSize}px ${fonts.mono}`;
    sctx.fillStyle = '#7d8892';
    sctx.fillText(title, 78, 22);
  };

  const paintProfile = (alpha: number) => {
    sctx.save();
    sctx.globalAlpha = alpha;
    sctx.fillStyle = '#0a0f14';
    sctx.fillRect(0, 0, W, H);
    chrome('profile.md', 14);

    sctx.font = `500 12px ${fonts.mono}`;
    sctx.fillStyle = hexAccent;
    sctx.fillText('SOFTWARE ENGINEER AT ASCENTIC', 34, 74);
    sctx.font = `700 34px ${fonts.sans}`;
    sctx.fillStyle = '#eef2f4';
    sctx.fillText('Isuru Bandara', 34, 112);

    let y = wrap(
      'I am a .NET developer with over a year of experience building web applications. On the frontend I work with React, Next.js and TypeScript, connecting them to scalable backends and PostgreSQL databases.',
      34,
      150,
      572,
      22,
      `400 15px ${fonts.sans}`,
      '#b3bcc2',
    );
    y = wrap(
      'I also have hands-on experience with Azure App Service and Vercel for hosting and deployment. I care about solving problems and writing clean code.',
      34,
      y + 10,
      572,
      22,
      `400 15px ${fonts.sans}`,
      '#8a949c',
    );

    sctx.strokeStyle = 'rgba(255,255,255,0.12)';
    sctx.beginPath();
    sctx.moveTo(34, y + 18);
    sctx.lineTo(606, y + 18);
    sctx.stroke();

    const stats: Array<[string, string]> = [
      ['2 YRS', 'AT ASCENTIC'],
      ['BSc', 'COMP. SCIENCE'],
      ['LK', 'SRI LANKA'],
    ];
    stats.forEach(([big, small], i) => {
      const x = 34 + i * 196;
      sctx.font = `500 22px ${fonts.mono}`;
      sctx.fillStyle = '#e8ecef';
      sctx.fillText(big, x, y + 54);
      sctx.font = `400 11px ${fonts.mono}`;
      sctx.fillStyle = '#6f787f';
      sctx.fillText(small, x, y + 72);
    });
    sctx.restore();
  };

  const paintStack = (alpha: number) => {
    sctx.save();
    sctx.globalAlpha = alpha;
    sctx.fillStyle = '#0a0f14';
    sctx.fillRect(0, 0, W, H);
    chrome('stack.json', 14);

    sctx.font = `500 12px ${fonts.mono}`;
    sctx.fillStyle = hexAccent;
    sctx.fillText('WHAT I BUILD WITH', 34, 70);

    const groups: Array<[string, string[]]> = [
      ['backend', ['.NET', 'C#', 'ASP.NET', 'PostgreSQL']],
      ['frontend', ['TypeScript', 'React', 'Next.js', 'React Native']],
      ['hosting', ['Azure App Service', 'Vercel']],
    ];

    let y = 106;
    groups.forEach(([label, items]) => {
      sctx.font = `400 11px ${fonts.mono}`;
      sctx.fillStyle = '#6f787f';
      sctx.fillText(label.toUpperCase(), 34, y);
      let x = 34;
      y += 14;
      sctx.font = `400 13px ${fonts.mono}`;
      items.forEach((it) => {
        const w = sctx.measureText(it).width + 18;
        if (x + w > 606) {
          x = 34;
          y += 30;
        }
        sctx.strokeStyle = 'rgba(255,255,255,0.14)';
        sctx.strokeRect(x, y - 2, w, 24);
        sctx.fillStyle = '#d3d9dd';
        sctx.fillText(it, x + 9, y + 15);
        x += w + 8;
      });
      y += 52;
    });
    sctx.restore();
  };

  return function paint(t: number, profileMix: number, stackMix: number) {
    sctx.fillStyle = '#080c11';
    sctx.fillRect(0, 0, W, H);
    chrome(projects[0] + '.cs', 15);

    sctx.fillStyle = '#0b1017';
    sctx.fillRect(0, 34, 44, H - 34);

    const scroll = (t * 14) % 26;
    for (let i = 0; i < lines.length; i++) {
      const y = 56 + i * 26 - scroll;
      if (y < 44 || y > H - 30) continue;
      sctx.font = `400 13px ${fonts.mono}`;
      sctx.fillStyle = '#39434c';
      sctx.fillText(String(i + 1).padStart(2, '0'), 12, y + 4);
      let x = 56 + lines[i].indent * 18;
      lines[i].parts.forEach((p) => {
        sctx.fillStyle = p.kind === 0 ? hexAccent : p.kind === 1 ? '#7f9cf5' : '#4d5a66';
        sctx.globalAlpha = 0.85;
        sctx.fillRect(x, y - 6, p.w, 8);
        sctx.globalAlpha = 1;
        x += p.w + 12;
      });
    }

    // Blinking caret.
    if ((t * 2) % 2 < 1) {
      sctx.fillStyle = hexAccent;
      sctx.fillRect(56, H - 60, 9, 14);
    }

    sctx.fillStyle = '#0d141b';
    sctx.fillRect(0, H - 26, W, 26);
    sctx.font = `400 12px ${fonts.mono}`;
    sctx.fillStyle = '#5d666d';
    sctx.fillText('build passing  ·  0 errors', 14, H - 9);

    if (profileMix > 0.001) paintProfile(Math.min(1, profileMix));
    if (stackMix > 0.001) paintStack(Math.min(1, stackMix));
  };
}
