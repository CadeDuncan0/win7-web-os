# PROJECT_CORE_THESIS

## Purpose

A personal portfolio website architecturally implemented as a fully functional browser-rendered
recreation of the Windows 7 operating system. The product serves two simultaneous audiences:
potential employers evaluating full-stack engineering capability, and portfolio visitors
experiencing the work as an interactive desktop environment.

## Core Product Behavior

- Visitors land on an authentic Windows 7 login screen
- Two accounts exist: Guest (public, no password) and Admin (owner-only, password-gated)
- Post-login: a Windows 7 Aero Glass desktop environment with draggable icons, a window manager,
  and a taskbar with live clock
- Portfolio content (projects, resume) surfaces as openable desktop windows
- Admin account unlocks private/WIP project windows invisible to Guest

## Engineering Goals

- Demonstrate FAANG-level frontend architecture: component design, state management, data layer,
  testing, CI/CD, and DevOps literacy in a single cohesive artifact
- Every architectural decision is intentional, documented, and defensible in a technical interview
- Zero-cost infrastructure using free tiers exclusively

## Long-Term Vision

Extensible beyond a static portfolio — the desktop environment is designed to support future
additions: Start Menu, Settings window, File Explorer, sound effects, multi-monitor simulation,
and real-time visitor presence. The Admin account provides a private workspace for non-public
projects and tooling.

---

# SYSTEM*ARCHITECTURE*&\_STACK

## Architectural Overview

```
[ Browser ]
    ↕
[ Next.js 14 + React ]     — rendering, routing, server/client component split
    ↕
[ Apollo Client ]          — GraphQL client, normalized cache, auth header injection
    ↕
[ GraphQL / pg_graphql ]   — query layer auto-generated from Postgres schema
    ↕
[ Supabase ]               — Postgres DB, Auth, Storage, RLS enforcement

[ Redux Toolkit ]          — horizontal across React layer; in-memory UI state only
[ CSS Modules ]            — scoped per-component; Aero Glass token system
```

## Stack Reference

### Next.js 14 (App Router)

- **Role:** Core framework — SSR, file-based routing, API routes, server/client component model
- **Design Rationale:** App Router enables granular server vs client rendering decisions per
  component. Server components reduce client bundle size and enable SSR by default. Client
  components opt in via `'use client'` directive. Provider components (Redux, Apollo) are
  isolated as dedicated client components to preserve server component integrity of root layout.
- **Key constraint:** `src/app/layout.tsx` is a pure server component. All client-side context
  providers live in `src/components/providers/`.

### TypeScript

- **Role:** Type safety enforced across every application layer
- **Design Rationale:** Eliminates class of runtime errors at compile time. GraphQL schema types,
  Redux state shapes, component prop interfaces, and Supabase response structures are all
  statically typed. Named prop interfaces used over inlined types for extensibility.
- **Key constraint:** `strict` mode enabled. `!` non-null assertion used only where environment
  variables are guaranteed present. All Redux hooks are typed wrappers (`useAppDispatch`,
  `useAppSelector`) — never raw `useDispatch`/`useSelector`.

### Redux Toolkit

- **Role:** Global in-memory state management for desktop environment, window manager, and
  client session
- **Design Rationale:** Multiple disconnected components (Taskbar, Desktop, Window instances)
  share state that has no natural single-component owner. Redux provides a single predictable
  store with auditable state transitions. Chosen over Zustand for enterprise familiarity and
  Fortune 500 job description coverage.
- **Store slices:**
  - `windowSlice` — open windows, z-index stack, minimize/maximize state, positions
  - `sessionSlice` — authenticated role (guest | admin), JWT, auth status
  - `desktopSlice` — icon positions, selected icon, wallpaper setting
- **Provider pattern:** `ReduxProviderWrapper` client component mounts Redux `Provider` into
  React Context tree. Wraps `ApolloProviderWrapper` so Redux state is accessible to Apollo link
  chain (required for Admin JWT injection in Phase 1).

### CSS Modules

- **Role:** Scoped per-component styling with a centralized Aero Glass design token system
- **Design Rationale:** Tailwind rejected — Aero Glass UI requires precise, named, intentional
  design decisions that utility classes obscure. CSS custom properties define every color, shadow,
  blur, gradient, and radius in the Windows 7 Aero theme. `backdrop-filter: blur()` for frosted
  glass. Segoe UI typeface via system font stack.
- **Key constraint:** All design tokens defined in `globals.css`. No magic values in component
  stylesheets — all values reference custom properties.

### Framer Motion

- **Role:** Declarative animations for window open/close/minimize transitions and desktop
  interactions
- **Design Rationale:** Windows 7 animations are specific and product-defining. `AnimatePresence`
  handles mount/unmount lifecycle. Layout animations handle position transitions. Targets:
  window open (scale 0.95 → 1.0 + fade, 120ms), close (reverse, 100ms), minimize (translate +
  scale toward taskbar position).

### @dnd-kit

- **Role:** Drag-and-drop for desktop icon repositioning with snap-to-grid behavior
- **Design Rationale:** Handles icon dragging specifically. Window dragging uses raw
  `pointermove` events — dnd-kit is not appropriate for pixel-perfect window repositioning with
  boundary clamping and z-index promotion. Two distinct dragging problems require two distinct
  solutions.

### GraphQL

- **Role:** Query language for structured, typed data fetching from Supabase
- **Design Rationale:** Meta-standard API layer present at Netflix, Airbnb, GitHub, Shopify.
  Client declares exact data shape needed — server returns exactly that, nothing more. Eliminates
  REST over-fetching. `pg_graphql` Postgres extension auto-generates full GraphQL schema from
  table definitions. Relay Connection Specification (`edges/node`) implemented by default for
  cursor-based pagination at scale.
- **Naming convention:** `pg_graphql` converts `snake_case` column names to `camelCase` field
  names automatically (`tech_stack` → `techStack`).

### Apollo Client

- **Role:** GraphQL client with normalized cache and session-aware authentication header
  injection
- **Design Rationale:** Normalized `InMemoryCache` keys objects by UUID — data fetched once is
  available to all components without redundant network requests. Link chain architecture
  (authLink → httpLink) makes authentication injection composable and independently swappable.
- **Link chain:**
  ```
  SetContextLink (authLink)   ← injects apikey + Authorization headers
       ↓
  HttpLink (httpLink)         ← POST to NEXT_PUBLIC_GRAPHQL_URL
       ↓
  InMemoryCache               ← normalizes response by id field (UUID)
  ```
- **Auth header pattern:** Both `apikey` (Supabase API gateway) and `Authorization: Bearer`
  (RLS policy evaluation) required on every request. Phase 1: `Authorization` header swaps from
  anon key to Admin JWT read from Redux `sessionSlice`.
- **Current imports:** `SetContextLink` from `@apollo/client/link/context` (not deprecated
  `setContext`). `HttpLink` class constructor (not deprecated `createHttpLink`).
- **Provider pattern:** `ApolloProviderWrapper` client component. Nested inside
  `ReduxProviderWrapper` in root layout.

### Postman

- **Role:** API platform for constructing, testing, and validating GraphQL requests against the
  Supabase endpoint
- **Design Rationale:** Used during development to validate GraphQL queries and Supabase RLS
  behavior before Apollo Client integration. Requests require `Content-Type: application/json`,
  `apikey: <anon-key>`, and `Authorization: Bearer <anon-key>` headers. Saved request
  collections maintained per project for repeatable endpoint validation.

### Supabase

- **Role:** Managed PostgreSQL database, authentication system, and file storage
- **Design Rationale:** BaaS providing zero-server-code backend at zero cost for solo developer.
  Postgres chosen for `pg_graphql` compatibility. Row Level Security (RLS) enforces data access
  at database layer — Guest role reads `visibility = 'guest'` rows only; Admin reads all.
  Supabase JS SDK used exclusively for authentication (`supabase.auth.signInWithPassword`). All
  data fetching routes through Apollo Client + GraphQL only.
- **Schema — `public.projects`:**
  ```
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
  title          text NOT NULL
  description    text
  tech_stack     text[] DEFAULT '{}'
  live_url       text
  github_url     text
  thumbnail_url  text
  visibility     text NOT NULL DEFAULT 'guest' CHECK (IN ('guest','admin'))
  status         text NOT NULL DEFAULT 'complete' CHECK (IN ('complete','wip'))
  created_at     timestamptz NOT NULL DEFAULT now()
  ```
- **RLS state:** Enabled from initialization. Phase 0 uses permissive dev read policy
  (`USING (true)`). Phase 3 replaces with role-based policies.

### Jest + React Testing Library

- **Role:** Unit and integration test runner (Jest) + behavior-driven component testing (RTL)
- **Design Rationale:** RTL tests against user behavior not implementation details — queries by
  accessible role, label, and text rather than CSS selectors or component internals. Jest handles
  Redux slice logic, utility functions, and Apollo query mocking.

### Cypress

- **Role:** End-to-end testing for complete Guest and Admin user journeys
- **Design Rationale:** Validates the full stack integration — login → desktop → window open →
  window interactions — in a real browser environment. CI pipeline runs Cypress suite on every
  merge to `main`.

### Storybook

- **Role:** Isolated component development environment and living UI documentation
- **Design Rationale:** All UI components built and validated in Storybook before integration.
  Stories cover every state variant (focused, blurred, minimized, maximized). Serves as
  reference documentation for the Aero Glass design system.

### Docker

- **Role:** Containerized local development environment for reproducibility
- **Design Rationale:** Ensures environment parity between local development and CI. Not used as
  the primary dev environment — Node.js installed on host for Cursor IDE extension compatibility
  (ESLint, Prettier, TypeScript language server require host-level Node.js). Docker provides a
  production-equivalent runtime artifact.

### GitHub Actions

- **Role:** CI/CD pipeline executing lint, format check, build, and deploy on every merge
- **Design Rationale:** Two workflows: `ci.yml` (lint → format → build on every PR to `main`),
  `deploy.yml` (confirms Vercel deployment on merge to `main`). Supabase credentials stored as
  GitHub repository secrets for build-time environment variable injection.

### Vercel

- **Role:** Production hosting with automatic Git-based deployments
- **Design Rationale:** Zero-config Next.js deployment. Hobby tier covers portfolio traffic.
  Environment variables configured in Vercel dashboard mirror `.env.local`. Auto-deploy on
  `main` branch merge.

---

# PERSISTENT_DOMAIN_LOGIC

## Authentication Model

- Two roles: `guest` (public, sessionStorage-scoped) and `admin` (owner, JWT-persisted)
- Guest: no password, session expires on tab close, sees only `visibility = 'guest'` projects
- Admin: password via Supabase Auth, JWT stored and injected into Apollo authLink, sees all rows
- All routes under `/desktop` are server-side protected via Next.js middleware
- Client-side role stored in Redux `sessionSlice`

## Content Visibility Rules

- `visibility = 'guest'` → visible to all authenticated sessions
- `visibility = 'admin'` → visible to Admin session only
- Enforcement occurs at two layers: Supabase RLS (database) + GraphQL filter (query)
- Admin-only cards visually distinguished in UI (badge/border treatment — Phase 3)

## Window Manager Rules

- Every open window has: `id`, `title`, `position (x,y)`, `size (w,h)`, `zIndex`,
  `isMinimized`, `isMaximized`
- Z-index managed globally via Redux — clicking any window dispatches `focusWindow`
- Windows cannot be dragged outside viewport bounds (boundary clamping)
- Window dragging: raw `pointermove` events (not dnd-kit)
- Icon dragging: `@dnd-kit` with snap-to-grid
- Admin icon positions persist in Redux; Guest positions reset on session end

## Design Token Constraints

- All Aero Glass values (colors, shadows, blurs, radii) defined as CSS custom properties in
  `globals.css`
- No hardcoded values in component stylesheets
- `backdrop-filter: blur()` on all window chrome and taskbar
- Segoe UI via system font stack with fallbacks
- Typeface hierarchy: Title `Georgia 16pt`, Heading 2 `Georgia 13pt`, Body `Arial 12pt`

## Debug Logging Convention

- All debug output routes through `src/lib/debug.ts` utility
- `debug.log` internally calls `console.warn` with `[debug]` prefix
- Guarded by `process.env.NODE_ENV === 'development'` — zero output in production
- Label convention: `Module:Function → context description`
- Raw `console.log` banned via ESLint `no-console: ['error']`
- `console.warn` and `console.error` permitted for legitimate production signals only

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     Supabase public anon key (safe to expose client-side)
NEXT_PUBLIC_GRAPHQL_URL           Supabase GraphQL endpoint URL
NEXT_PUBLIC_ADMIN_EMAIL           Admin account email for Supabase Auth sign-in
```

- `NEXT_PUBLIC_` prefix required for browser-accessible variables
- Server-only variables (e.g. service role key) must never carry `NEXT_PUBLIC_` prefix
- `.env.local` is gitignored; values duplicated in Vercel dashboard and GitHub Secrets

## Commit Convention

- Enforced by commitlint + `@commitlint/config-conventional` via Husky `commit-msg` hook
- Format: `type(optional-scope): description`
- Valid types: `feat` `fix` `docs` `style` `refactor` `test` `chore` `perf` `ci` `revert`
- Atomic commits required — one logical change per commit
- Multi-change commits use conventional body (blank line between subject and body)
- Subject line max 72 characters

## Code Quality Gates

- Pre-commit: lint-staged runs `npx eslint --fix --max-warnings=0` and `npx prettier --write`
  on all staged `.ts` `.tsx` `.css` files
- ESLint flat config (`eslint.config.mjs`) — plain exported array, no `defineConfig` wrapper
- `curly: ['error', 'all']` — braces required on all control flow blocks
- `import/order` — enforced import grouping: builtin → external → internal → parent → sibling
- `@typescript-eslint/no-unused-vars` — all vars, args after-used, `^_` pattern ignored
- Short-circuit evaluation (`&&`, `?.`) preferred over braceless one-liner if statements

## File Structure Conventions

```
src/
  app/                    Next.js App Router pages and layouts
  components/
    providers/            Client-side context provider wrapper components only
  lib/                    Third-party client initializations and shared utilities
    supabase.ts           Supabase JS client (auth only)
    apollo-client.ts      Apollo Client with link chain
    debug.ts              NODE_ENV-aware debug logging utility
  store/
    index.ts              Redux store configuration + RootState/AppDispatch exports
    hooks.ts              Typed useAppDispatch and useAppSelector
    slices/               One file per Redux domain slice
```

---

# ROADMAP\_&_PHASE_RESPONSIBILITIES

## Phase 0 — Environment & Infrastructure

**Responsibility:** Establish complete, reproducible development environment and CI/CD pipeline
before any product code is written. Phase 0 is complete when any developer can clone the repo
and be fully operational in under ten minutes, and when a green CI pipeline confirms the full
lint → build → deploy chain functions end-to-end.

**Structural baselines established in Phase 0:**

- Next.js 14 project initialized with TypeScript, App Router, `src/` directory
- ESLint flat config, Prettier, Husky pre-commit hooks, commitlint
- Redux Toolkit store scaffolded with typed hooks and placeholder slices
- Supabase project provisioned with `projects` schema and RLS enabled
- GraphQL endpoint validated via Postman
- Apollo Client configured with `SetContextLink` + `HttpLink` chain
- Provider architecture established (`ReduxProviderWrapper`, `ApolloProviderWrapper`)
- Docker local environment containerized
- GitHub Actions CI/CD pipeline operational
- Vercel production deployment live on custom domain

## Phase 1 — Design System & Login Screen

**Responsibility:** Establish the complete Aero Glass design token system and deliver a
pixel-perfect, fully functional login screen. All UI components built in Storybook first.
Authentication flows (Guest + Admin) implemented against Supabase Auth. Admin JWT injected into
Apollo `authLink` from Redux `sessionSlice`. Route protection enforced via Next.js middleware.

## Phase 2 — Desktop & Window Manager

**Responsibility:** Deliver the core desktop environment. Virtual icon grid, drag-and-drop
repositioning, right-click context menus. Full window manager implementation: open, close,
minimize, maximize, focus, z-index stacking, boundary clamping, Framer Motion transitions.
Taskbar with live clock and open window list. All state managed in Redux. Full integration and
E2E test coverage.

## Phase 3 — Portfolio Content

**Responsibility:** Connect live Supabase data to the desktop window applications. Replace
permissive dev RLS policy with production role-based policies. Implement GraphQL queries for
public and admin project sets. Build ResumeWindow (PDF viewer + download), ProjectsWindow
(role-filtered card grid), ProjectDetailWindow (full project metadata). Upload resume and
thumbnails to Supabase Storage.

## Phase 4 — Polish, Performance & Launch

**Responsibility:** Production readiness. Lighthouse 90+ across all four categories.
Accessibility audit (full keyboard navigation, ARIA labels). Responsive degradation (tablet
graceful, mobile friendly fallback screen). Cross-browser validation (Chrome, Firefox, Safari,
Edge). Security review (RLS policies, JWT enforcement, no Admin data leakage). Final Cypress E2E
suite. Tag `v1.0.0`, merge to `main`, confirm production URL on custom domain with active SSL.

## Definition of Done (Project-Level)

A feature is complete when it: passes all unit and integration tests, has a Storybook story (UI
components), is keyboard accessible with correct ARIA labels, references only Aero Glass design
tokens (no hardcoded values), and produces zero TypeScript errors or ESLint warnings. The project
is complete when all four phases are done, Lighthouse targets are met, and the production URL
resolves on a custom domain.
