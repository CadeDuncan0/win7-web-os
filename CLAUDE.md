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
additions: Start Menu, Settings window, File Explorer, sound effects, and real-time visitor presence.
The Admin account provides a private workspace for non-public projects and tooling, and is the seam
for planned per-user features (tailored apps for specific users, visitor-created accounts and
persisted data) — the work that will reintroduce a server-side data layer when it genuinely needs one.

---

# SYSTEM ARCHITECTURE & STACK

## Architectural Overview

```
[ Browser ]
    ↕
[ Next.js + React ]        — rendering, routing, server/client component split
    ↕
[ Supabase ]               — Auth (sign-in) + Storage (resume PDF) only.
                             Postgres + RLS reserved for future per-user data.

[ Repo content layer ]     — typed project registry + MDX/React bodies: the single
                             source of truth for project data, compiled with the app
[ Redux Toolkit ]          — horizontal across React layer; in-memory UI state only
[ CSS Modules ]            — scoped per-component; Aero Glass token system
```

> **Project data is repo-resident, not database-backed.** The decision and its full rationale are
> recorded in `.claude/docs/PROJECT_REDESIGN_SUPABASEPROJECTS.md`. Supabase remains for
> authentication and resume Storage, and is retained for future per-user data features.

## Stack Reference

\* Reference dependency versions in `package.json` and `package-lock.json` before making version-specific decisions

\* No version numbers appear in this file intentionally. If a version number is present
elsewhere in this document, it is stale — delete it and defer to `package.json`.

\* Stack behavior described here reflects latest stable at time of last edit.
Always verify against installed versions before acting on any API or convention described below.

### Next.js (App Router)

- **Role:** Core framework — SSR, file-based routing, API routes, server/client component model
- **Design Rationale:** App Router enables granular server vs client rendering decisions per
  component. Server components reduce client bundle size and enable SSR by default. Client
  components opt in via `'use client'` directive. The Redux provider is isolated as a dedicated
  client component to preserve server component integrity of the root layout.
- **Key constraint:** `src/app/layout.tsx` is a pure server component. All client-side context
  providers live in `src/components/providers/`.

### TypeScript

- **Role:** Type safety across every layer (the repo project-content registry, Redux state,
  props, Supabase auth responses).
- **Key constraint:** `strict` mode enabled. `!` non-null assertion used only where environment
  variables are guaranteed present. All Redux hooks are typed wrappers (`useAppDispatch`,
  `useAppSelector`) — never raw `useDispatch`/`useSelector`. Named prop interfaces over inlined types.

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
  - `desktopSlice` — icon positions, selected icon
- **Provider pattern:** `ReduxProviderWrapper` client component creates ONE store per
  request/mount via the `setupStore()` factory (no module singleton — SSR passes must never
  share state across requests) and mounts Redux `Provider` into the React Context tree as the
  sole client-side context provider in the root layout.

### CSS Modules + 7.css

- **Role:** Scoped per-component styling with a centralized Aero Glass design token system,
  layered on top of the `7.css` base stylesheet
- **Design Rationale:** Tailwind rejected — Aero Glass UI requires precise, named, intentional
  design decisions that utility classes obscure. `7.css` is the one sanctioned styling library:
  it supplies authentic Windows 7 widget chrome (window frames, title bars, buttons) and the
  `--w7-*` custom property set, imported globally in `layout.tsx`. Project-specific CSS custom
  properties define every additional color, shadow, blur, gradient, and radius in the Windows 7
  Aero theme. `backdrop-filter: blur()` for frosted glass. Segoe UI typeface via system font
  stack.
- **Key constraint:** All project design tokens defined in `globals.css`; `--w7-*` tokens come
  from `7.css`. No magic values in component stylesheets — all values reference custom
  properties.

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

### Repo Content Layer (project data)

- **Role:** The single source of truth for all project content — both the index the card grid
  and routing need (title, tech stack, links, thumbnail, visibility, ordering) and the rich
  per-project body (long-form copy, galleries, and interactive demos such as the embedded Super
  Mario Bros / Godot build).
- **Design Rationale:** Project content is static, developer-authored, small (~10 records), and
  read-only at runtime, with bodies that are inherently code. That is the profile of
  version-controlled content, not database rows. Keeping it in the repo gives a single place to
  add/edit/remove a project, end-to-end type safety, diffable history, atomic deploys, and zero
  content network latency. Full rationale (and the pros/cons of the rejected DB/Hybrid approach)
  in `.claude/docs/PROJECT_REDESIGN_SUPABASEPROJECTS.md`.
- **Shape:** a typed registry (the index) plus per-project MDX/React bodies keyed by `slug`.
  Bespoke interactive bodies (e.g. the Godot demo) are ordinary repo components/assets.
- **Visibility:** role-based (guest vs admin/WIP) as a filter over the registry, driven by the
  session role. This is a UX/structural gate today, **not** a hard data boundary — all project
  content ships in the bundle, which is acceptable because none of it is confidential. A real
  server-side boundary returns only if genuinely private content is ever introduced.

### Supabase

- **Role:** Authentication system and file storage. (Postgres + Row Level Security remain
  available but are **not** used for project content — see "Repo Content Layer" above.)
- **Design Rationale:** BaaS providing zero-server-code auth and storage at zero cost for a solo
  developer. The Supabase JS SDK is used **exclusively** for authentication
  (`supabase.auth.signInWithPassword` and session lifecycle) and for resolving the resume's
  Storage URL. The Postgres database and RLS are retained for planned future per-user data
  (tailored apps, visitor accounts) — not for project content.
- **Storage:** a single `resume` bucket holds the current resume PDF as **one object**
  (overwrite-on-upload, public read). This lets the resume be replaced without a redeploy. No
  version history is kept.
- **No project data in the database.** There is no `projects` table in the product's data flow;
  see `.claude/docs/PROJECT_REDESIGN_SUPABASEPROJECTS.md`.

### Vitest + React Testing Library

- **Role:** Unit/integration tests + behavior-driven component tests (RTL), all on a single
  runner. The `unit` Vitest project (jsdom) is the former Jest suite; the `storybook` project
  runs stories in a real browser via the Storybook Vitest addon.
- **Key constraint:** RTL queries by accessible role/label/text — never by CSS selector or
  component internals. Vitest covers Redux slices, utilities, and component behavior.

### Cypress

- **Role:** E2E for full Guest/Admin journeys (login → desktop → window interactions).
- **Key constraint:** Cypress suite runs in CI on every merge to `main`.

### Storybook

- **Role:** Isolated component development; living UI documentation for Aero Glass system.
- **Key constraint:** Every UI component built in Storybook FIRST. Stories must cover all state
  variants (focused, blurred, minimized, maximized).

### Docker

- **Role:** Production-equivalent runtime artifact for environment parity.
- **Key constraint:** NOT the primary dev environment — Node.js runs on host for Cursor IDE
  extensions (ESLint, Prettier, TS language server require host Node).

### GitHub Actions

- **Workflows:**
  - `ci.yml` — lint → format → build on every PR to `main`
  - `deploy.yml` — confirms Vercel deployment on merge to `main`
- **Secrets:** Supabase credentials stored as GitHub repo secrets for build-time injection.

### Vercel

- **Role:** Production hosting, auto-deploy on `main` merge. Hobby tier.
- **Key constraint:** Env vars in Vercel dashboard MUST mirror `.env.local`.

---

# PERSISTENT_DOMAIN_LOGIC

## Authentication Model

- Two roles: `guest` (public, sessionStorage-scoped) and `admin` (owner, JWT-persisted)
- Guest: no password, session expires on tab close, sees only guest-visible projects
- Admin: password via Supabase Auth, JWT (the Supabase access token) stored in Redux
  `sessionSlice`, sees all projects including admin/WIP
- All routes under `/desktop` are server-side protected via Next.js proxy
  (`src/proxy.ts` — the App Router successor to `middleware.ts`)
- Client-side role stored in Redux `sessionSlice`

## Content Visibility Rules

- Each project in the repo registry is marked `guest` or `admin` (and `complete` or `wip`)
- `guest` → visible to all authenticated sessions; `admin`/`wip` → visible to Admin session only
- Enforcement is a **role-based filter over the repo registry**, driven by the session role.
  This is a UX/structural gate, not a hard data boundary — all project content ships in the
  bundle. There is no DB/RLS visibility layer for projects; a server-side boundary returns only
  if genuinely confidential content is introduced.
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
- `debug.log` internally calls `console.warn` with `[debug]` prefix;
  `debug.error` calls `console.error` under the same development-only guard
- Guarded by `process.env.NODE_ENV === 'development'` — zero output in production
- Label convention: `Module:Function → context description`
- Raw `console.log` banned via ESLint `no-console: ['error']`
- `console.warn` and `console.error` permitted for legitimate production signals only

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     Supabase public anon key (safe to expose client-side)
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
- ESLint flat config (`eslint.config.mjs`) — `defineConfig` from `eslint/config`
- `curly: ['error', 'all']` — braces required on all control flow blocks
- `import-x/order` (via `eslint-plugin-import-x`) — enforced import grouping:
  builtin → external → internal → parent → sibling
- `@typescript-eslint/no-unused-vars` — all vars, args after-used, `^_` pattern ignored
- Short-circuit evaluation (`&&`, `?.`) preferred over braceless one-liner if statements

## File Structure Conventions

```
src/
  app/                    Next.js App Router pages and layouts
  components/
    providers/            Client-side context provider wrapper components only
    screens/              Screen-level compositions (login, desktop, Transition)
    windows7/             Reusable Windows 7 primitives built on 7.css
  content/                Repo-resident project data: typed registry (index) + per-project
                          MDX/React bodies (the single source of truth for project content)
  hooks/                  Shared React hooks (auth listener, dnd-kit sensors)
  lib/                    Third-party client initializations and shared utilities
    supabase/             Supabase JS clients (auth only): client, server, proxy
    debug.ts              NODE_ENV-aware debug logging utility
  proxy.ts                Next.js route protection (App Router successor to middleware.ts)
  store/
    index.ts              Redux store configuration + RootState/AppDispatch exports
    hooks.ts              Typed useAppDispatch and useAppSelector
    slices/               One file per Redux domain slice
  test-utils/             renderWithProviders and shared test helpers
```

## Anti-Patterns (DO NOT)

- **DO NOT** use raw `useDispatch` / `useSelector` — always import the typed wrappers
  `useAppDispatch` / `useAppSelector` from `src/store/hooks.ts`.
- **DO NOT** add a GraphQL / Apollo / relational data-fetching client for project content —
  project data is repo-resident (a typed registry + MDX/React bodies). A query layer returns
  only when a future feature genuinely needs server-delivered, per-user data.
- **DO NOT** use `console.log` — banned by ESLint. Route through `src/lib/debug.ts`.
  `console.warn` / `console.error` are reserved for legitimate production signals.
- **DO NOT** hardcode colors, shadows, blurs, radii, or gradients in CSS modules —
  reference CSS custom properties from `globals.css`.
- **DO NOT** makeup css values — reference the links provided in `AGENTS.md` under `Visual Reference`
- **DO NOT** install Tailwind, styled-components, or any other styling library. The sole
  exception is `7.css`, the sanctioned Windows 7 base stylesheet. Aero Glass requires named,
  intentional design tokens; CSS Modules are mandatory.
- **DO NOT** read application data through the Supabase JS SDK (`supabase.from(...)`). The SDK is
  for **auth** (`supabase.auth.*`) and resolving the resume's Storage URL only. Project data is
  repo-resident — there is no relational data client.
- **DO NOT** add `'use client'` to `src/app/layout.tsx` — it must remain a pure server
  component. Client providers belong in `src/components/providers/`.
- **DO NOT** use `@dnd-kit` for window dragging — it is for icon dragging only. Window
  dragging uses raw `pointermove` events with boundary clamping.
- **DO NOT** prefix server-only env vars with `NEXT_PUBLIC_` — that prefix exposes them
  to the browser.
- **DO NOT** use braceless one-liner `if` statements where short-circuit (`&&`, `?.`)
  would do. ESLint enforces `curly: ['error', 'all']` on actual blocks.
- **DO NOT** bypass commit hooks (`--no-verify`) or skip lint warnings — `--max-warnings=0`
  is enforced for a reason.

---

# ROADMAP\_&_PHASE_RESPONSIBILITIES

## Phase 0 — Environment & Infrastructure

**Responsibility:** Establish complete, reproducible development environment and CI/CD pipeline
before any product code is written. Phase 0 is complete when any developer can clone the repo
and be fully operational in under ten minutes, and when a green CI pipeline confirms the full
lint → build → deploy chain functions end-to-end.

**Structural baselines established in Phase 0:**

- Next.js project initialized with TypeScript, App Router, `src/` directory
- ESLint flat config, Prettier, Husky pre-commit hooks, commitlint
- Redux Toolkit store scaffolded with typed hooks and placeholder slices
- Supabase project provisioned (Auth + Storage; Postgres/RLS available for future per-user data)
- Provider architecture established (`ReduxProviderWrapper`)
- Docker local environment containerized
- GitHub Actions CI/CD pipeline operational
- Vercel production deployment live on custom domain

## Phase 1 — Design System & Login Screen

**Responsibility:** Establish the complete Aero Glass design token system and deliver a
pixel-perfect, fully functional login screen. All UI components built in Storybook first.
Authentication flows (Guest + Admin) implemented against Supabase Auth. Admin JWT (the Supabase
access token) stored in Redux `sessionSlice`. Route protection enforced via Next.js middleware.

## Phase 2 — Desktop & Window Manager

**Responsibility:** Deliver the core desktop environment. Virtual icon grid, drag-and-drop
repositioning, right-click context menus. Full window manager implementation: open, close,
minimize, maximize, focus, z-index stacking, boundary clamping, Framer Motion transitions.
Taskbar with live clock and open window list. All state managed in Redux. Full integration and
E2E test coverage.

## Phase 3 — Portfolio Content

**Responsibility:** Make the desktop shell a complete product by wiring in real content. Author
the repo-resident project content layer (typed registry + per-project MDX/React bodies) and
render it through the existing windows: ResumeWindow (PDF from Supabase Storage + download),
ProjectsWindow (role-filtered card grid), ProjectDetailWindow (full project metadata + rich
body). Upload the resume PDF to a Supabase Storage bucket. Role-based project visibility is a
registry filter driven by the session role.

## Phase 4 — Polish, Performance & Launch

**Responsibility:** Production readiness. Lighthouse 90+ across all four categories.
Accessibility audit (full keyboard navigation, ARIA labels). Responsive degradation (tablet
graceful, mobile friendly fallback screen). Cross-browser validation (Chrome, Firefox, Safari,
Edge). Security review (route protection, JWT/session enforcement, and confirming the
admin/guest visibility gate behaves as designed). Final Cypress E2E suite. Tag `v1.0.0`, merge
to `main`, confirm production URL on custom domain with active SSL.

## Definition of Done (Project-Level)

A feature is complete when it: passes all unit and integration tests, has a Storybook story (UI
components), is keyboard accessible with correct ARIA labels, references only Aero Glass design
tokens (no hardcoded values), and produces zero TypeScript errors or ESLint warnings. The project
is complete when all four phases are done, Lighthouse targets are met, and the production URL
resolves on a custom domain.
