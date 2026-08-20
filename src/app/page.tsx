/* eslint-disable @next/next/no-img-element -- Local 17px SVG icons; the image
   optimizer refuses SVG without dangerouslyAllowSVG and would add nothing. */
import type { CSSProperties } from 'react';

import { PanelFocus } from '@/components/PanelFocus';
import { SectionSnap } from '@/components/SectionSnap';
import { sceneFonts } from '@/lib/fonts';
import { DeskWorldCanvas } from '@/three/DeskWorldCanvas';

const MONO = 'var(--font-mono), monospace';
const ACCENT = '#59d3cf';

/* ---------- shared style objects, transcribed from the design ---------- */

const section: CSSProperties = { minHeight: '170vh', position: 'relative' };

const sticky = (align: 'flex-start' | 'flex-end'): CSSProperties => ({
  position: 'sticky',
  top: 0,
  height: '100vh',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: align,
  padding: align === 'flex-end' ? '36px 34px' : '36px 30px',
  maxWidth: 1320,
  margin: '0 auto',
});

const panel = (maxWidth: string, gap: number): CSSProperties => ({
  maxWidth,
  boxSizing: 'border-box',
  maxHeight: '100%',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  display: 'flex',
  flexDirection: 'column',
  gap,
  transition: 'opacity 0.45s ease, transform 0.45s ease',
});

/** Bordered, blurred slab used by the experience and stack panels. */
const slab: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(9,12,16,0.76)',
  backdropFilter: 'blur(10px)',
};

const eyebrow: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: ACCENT,
};

const h2: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(28px,3vw,40px)',
  letterSpacing: '-0.02em',
  fontWeight: 500,
};

const button: CSSProperties = {
  padding: '14px 26px',
  fontFamily: MONO,
  fontSize: 12.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const groupLabel: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: '0.14em',
  color: '#6f787f',
  textTransform: 'uppercase',
};

const chip: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '8px 12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.03)',
};

const footnote: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11.5,
  color: '#8a949c',
};

const footnoteLabel: CSSProperties = {
  color: '#6f787f',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontSize: 10.5,
};

const timelineRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '96px minmax(0,1fr)',
  gap: 16,
  padding: '11px 0',
  borderTop: '1px solid rgba(255,255,255,0.08)',
};

/* ---------- content ---------- */

const NAV = [
  ['#s1', 'profile'],
  ['#s2', 'focus'],
  ['#s3', 'experience'],
  ['#s4', 'stack'],
  ['#s5', 'contact'],
] as const;

const FOCUS = [
  {
    title: '.NET web applications',
    body: 'Backend services and APIs in .NET with PostgreSQL — most of my day-to-day work.',
  },
  {
    title: 'React and Next.js frontends',
    body: 'Typed React interfaces wired to those backends, plus React Native for mobile.',
  },
  {
    title: 'Hosting and deployment',
    body: 'Hands-on with Azure App Service and Vercel for shipping what I build.',
  },
];

const EXPERIENCE = [
  { when: '2026 — now', role: 'Software Engineer', org: 'Ascentic · Sri Jayawardenepura Kotte' },
  { when: '2025 — 2026', role: 'Associate Software Engineer', org: 'Ascentic · Colombo' },
  { when: '2024 — 2025', role: 'Software Engineer Intern', org: 'Ascentic · Colombo' },
];

const STACK = [
  {
    label: 'backend',
    items: [
      { name: '.NET', icon: 'dotnetcore-original.svg' },
      { name: 'C#', icon: 'csharp-original.svg' },
      { name: 'ASP.NET', icon: 'dot-net-original.svg' },
      { name: 'PostgreSQL', icon: 'postgresql-original.svg' },
    ],
  },
  {
    label: 'frontend',
    items: [
      { name: 'TypeScript', icon: 'typescript-original.svg' },
      { name: 'React', icon: 'react-original.svg' },
      { name: 'Next.js', icon: 'nextjs-original.svg', invert: true },
      { name: 'React Native', icon: 'react-original.svg' },
    ],
  },
  {
    label: 'hosting',
    items: [
      { name: 'Azure App Service', icon: 'azure-original.svg' },
      { name: 'Vercel', icon: 'vercel-original.svg', invert: true },
    ],
  },
];

export default function Home() {
  return (
    <>
      <DeskWorldCanvas accent={ACCENT} motion="full" fonts={sceneFonts} />
      <PanelFocus />
      <SectionSnap />

      {/* Readability scrim over the scene — heavier at the edges than the middle. */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, rgba(7,9,12,0.7) 0%, rgba(7,9,12,0.18) 40%, rgba(7,9,12,0.08) 62%, rgba(7,9,12,0.62) 100%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            backdropFilter: 'blur(12px)',
            background: 'rgba(7,9,12,0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <nav
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '16px 30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <a
              href="#s0"
              style={{
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#e8ecef',
              }}
            >
              isuru bandara
            </a>
            <div
              style={{
                display: 'flex',
                gap: 24,
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: '0.1em',
              }}
            >
              {NAV.map(([href, label]) => (
                <a key={href} href={href} className="nav-link">
                  {label}
                </a>
              ))}
            </div>
          </nav>
        </header>

        {/* ---------------- 01 Intro ---------------- */}
        <section id="s0" style={section}>
          <div style={sticky('flex-start')}>
            <div data-panel="1" className="panel" style={panel('34rem', 24)}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: ACCENT,
                }}
              >
                <span style={{ width: 26, height: 1, background: ACCENT, display: 'block' }} />
                <span>software engineer at ascentic</span>
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(44px,5.4vw,82px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.035em',
                  fontWeight: 700,
                  textWrap: 'balance',
                }}
              >
                Isuru Bandara
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 'clamp(16.5px,1.3vw,19px)',
                  lineHeight: 1.55,
                  color: '#aeb7bd',
                  textWrap: 'pretty',
                }}
              >
                .NET full stack developer. I build web applications with .NET on the backend,
                React, Next.js and TypeScript on the frontend, and PostgreSQL underneath.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 13, marginTop: 2 }}>
                <a href="#s2" className="btn-primary" style={{ ...button, fontWeight: 500 }}>
                  what i work on
                </a>
                <a href="#s5" className="btn-ghost" style={button}>
                  get in touch
                </a>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 34,
                  marginTop: 18,
                  flexWrap: 'wrap',
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  color: '#6f787f',
                }}
              >
                <span>2 yrs at ascentic</span>
                <span>matale, sri lanka</span>
                <span>bsc (hons) computer science</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 16,
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#5d666d',
                }}
              >
                <span className="hint-arrow">↓</span>
                <span>scroll to move across the desk</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 02 Profile ---------------- */}
        <section id="s1" style={section}>
          <div style={sticky('flex-end')}>
            <div data-panel="1" className="panel" style={panel('24rem', 14)}>
              <span style={eyebrow}>01 / on the screen</span>
              <h2 style={{ ...h2, lineHeight: 1.05 }}>Profile</h2>
              <p
                style={{
                  margin: 0,
                  color: '#8a949c',
                  lineHeight: 1.6,
                  fontSize: 14.5,
                  textWrap: 'pretty',
                }}
              >
                Open in the editor on the monitor.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- 03 Focus ---------------- */}
        <section id="s2" style={section}>
          <div style={sticky('flex-start')}>
            <div data-panel="1" className="panel" style={panel('33rem', 14)}>
              <span style={eyebrow}>02 / on the desk mat</span>
              <h2 style={h2}>What I work on</h2>
              {FOCUS.map((item) => (
                <article
                  key={item.title}
                  className="focus-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '15px 18px',
                    background: 'rgba(9,12,16,0.76)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{item.title}</h3>
                  <p
                    style={{
                      margin: 0,
                      color: '#9aa4ab',
                      lineHeight: 1.5,
                      fontSize: 13.5,
                      textWrap: 'pretty',
                    }}
                  >
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- 04 Experience ---------------- */}
        <section id="s3" style={section}>
          <div style={sticky('flex-end')}>
            <div
              data-panel="1"
              className="panel"
              style={{ ...panel('33rem', 4), ...slab, padding: '26px 28px' }}
            >
              <span style={eyebrow}>03 / papers on the desk</span>
              <h2
                style={{
                  margin: '0 0 6px',
                  fontSize: 'clamp(26px,2.6vw,36px)',
                  letterSpacing: '-0.02em',
                  fontWeight: 500,
                }}
              >
                Experience
              </h2>
              {EXPERIENCE.map((row, i) => (
                <div key={row.role} style={timelineRow}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      color: i === 0 ? ACCENT : '#8a949c',
                      paddingTop: 4,
                    }}
                  >
                    {row.when}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <h3 style={{ margin: 0, fontSize: 18.5, fontWeight: 500 }}>{row.role}</h3>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, color: '#6f787f' }}>
                      {row.org}
                    </span>
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  paddingTop: 14,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  ...footnote,
                }}
              >
                <span style={footnoteLabel}>education</span>
                <span>
                  BSc (Hons) Computer Science, Bedfordshire 2025 · HND in IT, SLIIT Academy 2024
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 05 Stack ---------------- */}
        <section id="s4" style={section}>
          <div style={sticky('flex-start')}>
            <div
              data-panel="1"
              className="panel"
              style={{ ...panel('31rem', 16), ...slab, padding: '22px 24px' }}
            >
              <span style={eyebrow}>04 / on the keyboard</span>
              <h2 style={h2}>Stack</h2>
              {STACK.map((group) => (
                <div
                  key={group.label}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <span style={groupLabel}>{group.label}</span>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      fontFamily: MONO,
                      fontSize: 12,
                      color: '#d3d9dd',
                    }}
                  >
                    {group.items.map((item) => (
                      <span key={item.name} style={chip}>
                        <img
                          src={`/icons/${item.icon}`}
                          alt=""
                          width={17}
                          height={17}
                          style={{
                            display: 'block',
                            filter: 'invert' in item && item.invert ? 'invert(1)' : undefined,
                          }}
                        />
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  paddingTop: 14,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  ...footnote,
                }}
              >
                <span style={footnoteLabel}>certifications</span>
                <span>Java (Basic) · Introduction to Programming Using Python</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 06 Contact ---------------- */}
        <section id="s5" style={section}>
          <div style={sticky('flex-end')}>
            <div data-panel="1" className="panel" style={panel('30rem', 20)}>
              <span style={eyebrow}>05 / phone on the desk</span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 'clamp(32px,4.4vw,60px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.03em',
                  fontWeight: 500,
                  textWrap: 'balance',
                }}
              >
                Let&apos;s build something
              </h2>
              <p
                style={{
                  margin: 0,
                  color: '#9aa4ab',
                  fontSize: 16.5,
                  lineHeight: 1.6,
                  textWrap: 'pretty',
                }}
              >
                Open to .NET and full stack work, and happy to talk about anything React or
                PostgreSQL shaped.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  fontFamily: MONO,
                  fontSize: 13,
                  color: '#aeb7bd',
                }}
              >
                <a href="mailto:Isuru.gayantha@outlook.com" className="contact-link">
                  Isuru.gayantha@outlook.com
                </a>
                <a href="tel:+94769937578" className="contact-link">
                  +94 76 993 7578
                </a>
                <span style={{ color: '#8a949c' }}>
                  Matale District, Central Province, Sri Lanka
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                <a
                  href="mailto:Isuru.gayantha@outlook.com"
                  className="btn-primary"
                  style={{ ...button, fontWeight: 500 }}
                >
                  email me
                </a>
                <a
                  href="https://www.linkedin.com/in/isuru-g-bandara"
                  className="btn-ghost"
                  style={button}
                >
                  linkedin
                </a>
              </div>
              <div
                style={{
                  marginTop: 22,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 14,
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: '0.12em',
                  color: '#5d666d',
                  textTransform: 'uppercase',
                }}
              >
                <span>© 2026 isuru bandara</span>
                <span>webgl · three.js</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
