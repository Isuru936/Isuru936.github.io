## Context

The portfolio is a greenfield rebuild of a Claude Design mockup. Two constraints shape every decision below: the site must cost nothing to run, and it must never serve a cold or paused response — a portfolio that a recruiter hits after two quiet weeks cannot take 30 seconds to wake up. A third constraint is self-imposed: three.js is a large dependency, and a 3D hero must not tax the text routes that carry the actual hiring signal.

Current state is an empty Next.js 16 scaffold. No content, no database tables, no scene.

## Goals / Non-Goals

**Goals:**
- A statically-generated site whose text routes never touch the database.
- A durable write path for the two things that genuinely need one: view counts and contact submissions.
- A WebGL boundary strict enough that removing or replacing the 3D scene touches exactly one directory.
- Environment and secret handling that fails loudly at boot, not silently at first query.

**Non-Goals:**
- Porting the real 3D scene (source not yet inspected).
- Any authenticated surface, CMS, or admin UI.
- Multi-region or replicated reads.

## Decisions

**Turso over a local SQLite file.** The original instinct was a committed SQLite database. On serverless that fails silently: writes land in an ephemeral filesystem, vanish on cold start, and each concurrent instance holds its own copy — data loss with no error. Turso is libSQL, so the SQL and mental model are unchanged, but it is reachable over HTTP from a stateless function. *Alternatives:* Supabase was rejected for pausing free projects after 7 days idle, which is precisely the failure mode this site cannot have. Neon was viable but is Postgres, discarding the SQLite familiarity for no gain here. Cloudflare D1 was viable but couples the database choice to the hosting choice.

**Content in MDX, not in the database.** Project copy is version-controlled, diffable, reviewable in a PR, and — critically — rendered at build time, so no page in the happy path issues a query. This is what keeps the region mismatch below from mattering to visitors.

**Vercel with GitHub Actions as CI only.** GitHub Actions is a build runner, not a host. Hosting on GitHub Pages would force `output: 'export'`, which removes server actions and route handlers, leaving no server-side place to hold the Turso token — the only remaining option would be shipping a full-access credential in client JavaScript, which is unacceptable. Vercel's git integration deploys on push; Actions is reserved for typecheck, lint, build, and the manual migration job. *Alternative:* Cloudflare Workers via `@opennextjs/cloudflare` (1.0 GA, Feb 2026) is a genuine peer and avoids Vercel Hobby's non-commercial clause; it was set aside to keep one platform and avoid the free tier's 10ms CPU ceiling as a design constraint.

**Imperative three.js, not React Three Fiber.** REVERSED after importing the design. This document originally chose R3F for its render-loop and disposal handling. The imported scene is ~450 lines of imperative three.js whose camera is driven by scroll and pointer position, not React state, so R3F would buy nothing and a rewrite would put pixel fidelity at risk for no gain. `@react-three/fiber` and `@react-three/drei` were removed as unused. The disposal argument was real, so teardown is handled explicitly: the scene traverses itself and disposes every geometry, material and texture, which the design did not do.

**Server actions as the sole write path.** Both writes are form/interaction driven, so `src/actions/` gives colocated validation and progressive enhancement without hand-rolling API routes and CORS. Route handlers stay available for anything a third party must call.

**Drizzle over Prisma.** Drizzle has no engine binary and no generate step, so it starts fast in a serverless function and keeps the deployed bundle small. Its SQL-shaped API also maps directly onto libSQL.

**Poster-first hero.** A static image serves as the LCP element and the canvas fades in over it once loaded. Prevents the 3D bundle from setting the site's Core Web Vitals.

No decision here contradicts the invariants in `openspec/config.yaml`.

## Risks / Trade-offs

- **Database is in `aws-ap-south-1` while Vercel functions default to `iad1` (~200ms per query)** → Static generation keeps queries off the render path, so only the counter and form pay it. Moving the database to `aws-us-east-1` is a deliberately deferred follow-up change.
- **three.js inflates the bundle and can regress LCP** → The `src/three/` boundary, per-page `dynamic(..., { ssr: false })` mounting, and the poster strategy. A Lighthouse budget in CI makes regressions fail the build rather than ship.
- **The contact form is a public write endpoint on a metered database** → Rate limiting plus a honeypot or Turnstile is a shipping requirement, not a follow-up. Without it, bots consume the 10M monthly write allowance and the inbox.
- **A naive view counter writes on every page view** → Deduplicate per session and treat the counter as eventually consistent; never block render on it.
- **The Turso free tier has no backups** → `turso db dump` before every migration, which is why migrations are `workflow_dispatch`-only. An automatic migration failing mid-deploy would be unrecoverable.
- **Vercel Hobby is non-commercial** → Fine for a portfolio used to get hired. If the site ever sells services, Cloudflare Workers is the pre-researched escape hatch.
- **GPU context leaks across route changes** → One `<Canvas>` per page, never in `layout.tsx`, and R3F handles teardown.

## Migration Plan

1. Install dependencies and commit the scaffold; the app must build green before any feature work.
2. Add `src/lib/env.ts` first, so every later step fails fast on missing configuration.
3. Define the Drizzle schema and generate migrations into `drizzle/`; commit the SQL.
4. Run the migration manually against Turso via `workflow_dispatch`, after a `turso db dump`.
5. Land the MDX pipeline and static routes — the site is publishable at this point, with no dynamic behaviour.
6. Add `src/three/` with a placeholder scene behind the dynamic boundary.
7. Add the view counter, then the contact form with its spam controls.

**Rollback:** every step is additive and independently revertible. The database has no destructive migrations in this change — both tables are new — so a rollback is a code revert with orphaned tables left in place.

## Open Questions

- Is the Claude Design output raw three.js or already R3F? Determines whether step 6 is a port or a wrap.
- Turnstile or a plain honeypot for the contact form? Turnstile is stronger but adds a third-party script to a site otherwise free of them.
- Analytics: Vercel Analytics or Cloudflare Web Analytics? Neither needs the database, so this can be decided late.
