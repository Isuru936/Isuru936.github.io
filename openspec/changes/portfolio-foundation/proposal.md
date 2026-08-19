## Why

The portfolio exists only as a Claude Design mockup with no running application behind it. This change lays the foundation: a Next.js app that can render the 3D design, publish case-study content, and persist the small amount of data a portfolio genuinely needs — without incurring hosting cost or an idle-pause outage.

## What Changes

- Scaffold a Next.js 16 App Router app (TypeScript, Tailwind v4, pnpm, `src/` layout).
- Add an MDX content pipeline under `content/` as the source of truth for projects and copy, statically generated at build time.
- Introduce a Turso (libSQL) database via Drizzle ORM, limited to two tables: project view counts and contact submissions.
- Quarantine all WebGL behind `src/three/`, loaded per-page via `dynamic(..., { ssr: false })` with a poster fallback for LCP.
- Add zod-validated environment loading that fails at boot rather than at first query.
- Add GitHub Actions CI (typecheck, lint, build) and a `workflow_dispatch`-only migration job. Vercel's git integration owns deploys.

## Capabilities

### New Capabilities
- `content-pipeline`: reading, validating, and statically rendering MDX project content from `content/`.
- `three-scene`: mounting and tearing down WebGL scenes safely, with quality tiers, reduced-motion support, and a non-3D fallback.
- `project-views`: recording and displaying per-project view counts.
- `contact-form`: accepting, validating, rate-limiting, and persisting contact submissions.
- `delivery-pipeline`: CI gates, environment/secret handling, and the manual migration path.

### Modified Capabilities
None — greenfield project, no existing specs in `openspec/specs/`.

## Non-goals

- **Porting the actual 3D scene.** The Claude Design output has not been inspected, so `src/three/` ships as a working placeholder scene. Porting is a follow-up change.
- **A CMS or admin UI.** Content is edited as MDX in git.
- **Authentication.** Nothing in this change requires a signed-in user.
- **Guestbook, comments, or blog.** Deferred until the foundation is proven.
- **Relocating the database.** The Turso instance stays in `aws-ap-south-1` for now; moving it to `aws-us-east-1` to match Vercel's `iad1` is a separate, deliberate change.

## Impact

- **New dependencies**: `@react-three/fiber`, `@react-three/drei`, `three`, `drizzle-orm`, `@libsql/client`, `drizzle-kit`, `zod`, and an MDX toolchain.
- **New surfaces**: `src/db/` (schema + queries), `src/actions/` (the only write path), `src/three/`, `content/`, `drizzle/` migrations.
- **External systems**: a Turso database and its auth token; Vercel project env vars; GitHub Actions secrets.
- **Performance risk**: three.js is a large dependency. The `src/three/` boundary and per-page mounting exist specifically to keep it off text routes and out of server bundles.
