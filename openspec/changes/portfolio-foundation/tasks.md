## 1. Scaffold and Configuration

- [ ] 1.1 Install runtime dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `drizzle-orm`, `@libsql/client`, `zod`, and the MDX toolchain
- [ ] 1.2 Install dev dependencies: `drizzle-kit`, `@types/three`
- [ ] 1.3 Add `typecheck` and `db:generate` scripts to `package.json`
- [ ] 1.4 Add `vercel.json` pinning functions to `iad1`
- [ ] 1.5 Create `.env.local` with the Turso URL and a token placeholder, plus a committed `.env.example`; confirm `.gitignore` covers `.env*`
- [ ] 1.6 Initialise the git repository and make the scaffold commit
- [ ] 1.7 Verify `pnpm build` succeeds on the untouched scaffold before any feature work

## 2. Environment and Database Foundation

- [ ] 2.1 Write `src/lib/env.ts` validating `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` with zod, throwing at boot on failure
- [ ] 2.2 Write `src/db/schema.ts` defining the `project_views` and `contact_submissions` tables
- [ ] 2.3 Write `src/db/index.ts` creating the libSQL client and Drizzle instance from validated env
- [ ] 2.4 Add `drizzle.config.ts` and generate the initial SQL migration into `drizzle/`; commit the generated SQL
- [ ] 2.5 Add an ESLint rule restricting `drizzle-orm` imports to `src/db/`

## 3. Content Pipeline

- [ ] 3.1 Configure MDX support in `next.config.ts`
- [ ] 3.2 Define the project frontmatter zod schema and write `src/lib/content.ts` to read and validate `content/projects/*.mdx`, failing the build on invalid frontmatter
- [ ] 3.3 Author two real project MDX files and `content/about.mdx` — no placeholder copy
- [ ] 3.4 Build the `/work` index page listing projects from the content layer
- [ ] 3.5 Build `/work/[slug]` with `generateStaticParams`, returning 404 for unknown slugs
- [ ] 3.6 Build `/about` and `/contact` shells, plus shared layout and navigation
- [ ] 3.7 Add `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, and per-route metadata

## 4. WebGL Boundary

- [ ] 4.1 Create `src/three/config.ts` with quality tiers, DPR caps, and a reduced-motion flag
- [ ] 4.2 Create `src/three/Scene.tsx` holding the `<Canvas>` root as a client component
- [ ] 4.3 Create `src/three/SceneLoader.tsx` wrapping the scene in `dynamic(..., { ssr: false })` with a Suspense boundary and poster fallback
- [ ] 4.4 Add a placeholder scene under `src/three/objects/` that exercises the loader end to end
- [ ] 4.5 Add a poster image and wire it as the hero's LCP element, with the canvas fading in over it
- [ ] 4.6 Mount the scene on `app/page.tsx` only, and confirm `layout.tsx` contains no `<Canvas>`
- [ ] 4.7 Add an ESLint rule restricting `three` and R3F imports to `src/three/`
- [ ] 4.8 Verify a text route's bundle contains no three.js, and that navigating away releases the WebGL context

## 5. View Counter

- [ ] 5.1 Write the `project_views` upsert-and-increment query in `src/db/queries/`
- [ ] 5.2 Write the `recordView` server action in `src/actions/views.ts`, swallowing and logging database failures
- [ ] 5.3 Add per-session deduplication so repeat views write at most once
- [ ] 5.4 Display the count on project pages without blocking render
- [ ] 5.5 Verify a project page still renders in full with the database unreachable

## 6. Contact Form

- [ ] 6.1 Write the submission insert query in `src/db/queries/`
- [ ] 6.2 Write `src/lib/rate-limit.ts` with a configurable threshold and window
- [ ] 6.3 Write the `submitContact` server action with zod validation, rate limiting, honeypot rejection, and IP hashing
- [ ] 6.4 Build the contact form UI with field-level error reporting and a success confirmation
- [ ] 6.5 Verify a direct POST bypassing browser validation is still rejected server-side
- [ ] 6.6 Decide on and wire Turnstile, or record the honeypot-only decision in the design's open questions

## 7. Delivery Pipeline

- [ ] 7.1 Add `.github/workflows/ci.yml` running typecheck, lint, and build on pull requests
- [ ] 7.2 Add a Lighthouse performance budget to CI that fails on regression
- [ ] 7.3 Add `.github/workflows/migrate.yml` as `workflow_dispatch` only, capturing a `turso db dump` before applying migrations
- [ ] 7.4 Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as GitHub secrets and Vercel environment variables
- [ ] 7.5 Run the migration workflow manually to create the tables in Turso
- [ ] 7.6 Connect the repository to Vercel and confirm push-to-deploy works with no deploy step in Actions
