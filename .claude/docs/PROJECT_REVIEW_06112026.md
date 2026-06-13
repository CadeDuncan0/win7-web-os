<!-- Created: 2026-06-11 -->

# Project Review — June 11, 2026

**Scope:** Full review of every layer of the codebase against `CLAUDE.md` and the phase
documentation — Redux store and slices, authentication stack, Apollo/GraphQL layer, desktop
and login components, design token system, test suites, CI/CD workflows, and project
configuration. All quality gates (`npm run build`, `npx jest`, `npx eslint --max-warnings=0`,
`npx prettier --check .`) were executed and are green as of this review. Issues discovered
during the review were remediated in the same pass; `CLAUDE.md` was reconciled with the
implemented reality where the two had drifted.

**Project position:** Phase 2 (Desktop & Window Manager), 9 of 19 tasks complete. The Redux
state layer, desktop shell, icon grid, Start Menu, and Redux-wired window chrome are built and
tested. Window dragging, taskbar, Internet Explorer shell, route composition, and the desktop
E2E suite remain.

---

## Findings

### State Management (Redux Toolkit)

The strongest layer of the codebase. All three slices (`windowSlice`, `desktopSlice`,
`sessionSlice`) follow a consistent, deliberate architecture:

- **Normalized state shape** — `byId` record + `ids` array gives O(1) lookup with stable
  render order, mirrored across the window and desktop slices.
- **Monotonic z-counter** for window stacking avoids re-sorting and keeps focus promotion a
  single-field write, with a churn-avoidance guard for repeat clicks on the active window.
- **`prevGeometry` snapshot** on maximize enables exact restore — the state design anticipates
  the behavior tasks (10–13) that consume it.
- **Selector discipline** — three documented categories (primitive access, O(1) lookup,
  memoized derived computation) applied consistently, with `createSelector` reserved for
  allocating selectors. Components and links read state exclusively through selectors.
- **Cross-slice persistence boundary** — the Guest-vs-Admin icon layout rule is enforced in
  `desktopSlice.extraReducers` listening to `sessionSlice` actions, translating role into a
  durability flag at the only moment role is observable. This is the correct Redux idiom for
  cross-domain rules.
- 93 Jest tests cover every reducer, including idempotency, unknown-id no-ops, and the
  cross-slice reset semantics.

### Authentication & Route Protection

Correctly layered with defense at each tier:

- **Server tier** — `src/proxy.ts` (the Next 16 successor to middleware) gates `/desktop`,
  verifying Admin via Supabase `getClaims()` + email match and Guest via a session cookie.
- **Client tier** — `useAuthListener` subscribes to Supabase auth events and rehydrates Redux;
  Guest sessions in `sessionStorage` are validated with a zod discriminated union before
  trust, with tampered payloads evicted.
- **Data tier** — Apollo's `SetContextLink` swaps the anon key for the Admin JWT read through
  `selectJwt`, exactly as the documented link-chain design specifies, using the current
  (non-deprecated) Apollo APIs.
- The `AuthResult<T>` discriminated-union return type keeps error handling explicit and
  exception-free at call sites.

### Styling & Design System

- The two-tier token system in `globals.css` (primitives → semantic tokens) is well executed,
  and component modules reference tokens rather than literals.
- `7.css` serves as the sanctioned Windows 7 base stylesheet, supplying widget chrome and the
  `--w7-*` token set; project tokens layer on top. `CLAUDE.md` now documents this explicitly.
- The two-dragging-solutions decision (`@dnd-kit` for icons, raw pointer events for windows)
  is not just documented — it is _mechanically enforced_ by an ESLint `no-restricted-imports`
  rule scoped to the Window component directories. This is exemplary: an architectural
  decision that cannot silently erode.
- Layered z-index tokens (`--dsk-z-*`) establish a single stacking-order authority for the
  icon layer, window layer, overlay, and taskbar.

### Testing

- **Jest + RTL:** 8 suites / 93 tests, querying by accessible role/label per the project
  mandate. Slice tests are exhaustive; component tests assert behavior (selection, dispatch
  payloads, position reactivity) rather than internals.
- **Cypress:** harness smoke tests exercise the real login flows for both roles using
  `cy.session` caching, with cookie-based validation. The full desktop journey suite is
  correctly deferred to Task 18 when there is a desktop to journey through.
- **Storybook-first** discipline held — every UI primitive has stories, and interactive
  components have both stories and RTL tests.

### CI/CD & Infrastructure

- `ci.yml` is strict and well-sequenced: `npm ci` → ESLint with `--max-warnings=0` → Prettier
  `--check` → production build with secrets, then a downstream Cypress job. Concurrency
  cancellation prevents queue buildup.
- The Dockerfile is layer-cache-aware and documented line-by-line; Docker remains a parity
  artifact rather than the dev environment, per the documented constraint.
- Husky + lint-staged + commitlint enforce the commit convention and quality gates locally
  before CI ever sees a push.

### Documentation & Process

- The phase/task documentation system (`.claude/phases/`) is unusually strong: each phase has
  goals, non-goals, key decisions with rationale, task dependency bands, and a definition of
  done. Completed work matches its task specs faithfully.
- `CLAUDE.md` was reconciled during this review so its stack descriptions, ESLint config
  description, file-structure map, and styling rules match the implementation exactly. Its
  "no version numbers" self-rule is now honored throughout.

---

## Retrospective — If Starting Over

A reflection on the current system design: what would change on a clean slate, and what has
earned its place and would be rebuilt the same way.

### What I would change

1. **Per-request store and client factories instead of module singletons.** The Redux store
   and Apollo client are created once at module scope and shared by every SSR pass. The
   `setupStore()` factory already exists for tests; on a restart I would make the providers
   create the store per request (`useRef` in `ReduxProviderWrapper`) and have the Apollo auth
   link read session state through an injected accessor rather than importing the singleton.
   The current design works because state only mutates client-side, but the SSR-shared
   singleton is a latent footgun and the first thing a systems-minded interviewer will probe.

2. **One source of truth for layout constants.** Grid cell dimensions, padding, and the
   taskbar reserve each live twice — as TypeScript constants in `gridMath.ts`/`IconGrid.tsx`
   and as CSS custom properties in `globals.css` — held together by "must stay in sync"
   comments. On a restart, a single typed constants module would generate both, or components
   would read the CSS custom properties at runtime. Sync-by-comment is a bug waiting for a
   refactor.

3. **One test runner, not two.** The repo carries Jest (+ ts-jest) for unit/component tests
   and Vitest (via the Storybook addon) side by side. Starting over, I would standardize on
   Vitest everywhere — it shares the Vite pipeline Storybook already uses, removes the ts-jest
   transform layer, and halves the config surface.

4. **Linux-parity checks from day one.** Developing on a case-insensitive filesystem while
   deploying to case-sensitive Linux runners means filename-casing mistakes are invisible
   locally by construction. A restart would adopt an all-lowercase directory convention (or a
   lint check) from the first commit rather than relying on CI to surface it.

5. **A consistent module-boundary convention.** Component folders are inconsistent about
   barrel `index.ts` files, so import paths vary between `Component/Component` and
   `Component`. Either every component folder gets a barrel (enforced by a generator or lint
   rule) or none do. The mixed style invites resolution surprises.

6. **A single session abstraction.** Guest session state is currently expressed in three
   places — a sessionStorage marker, a cookie for the server gate, and Redux. Each exists for
   a defensible reason (tab-lifetime semantics, server visibility, UI reactivity), but on a
   restart I would design one `session` module that owns all three representations behind a
   single API from the beginning, rather than coordinating them across `auth.ts`,
   `guestCookie.ts`, and the listener hook.

7. **Carry presentation state in the session payload from the start.** The logon avatar is
   picked at the login screen and discarded, and retrofitting it into the session now touches
   the schema, both sign-in paths, and the slice. Designing `AppSession` with the full set of
   "what the desktop needs to greet you" fields up front would have made that a non-event.

### What worked well and would be rebuilt the same way

- **Redux Toolkit with normalized slices, typed hooks, and selector discipline.** The state
  layer has absorbed two phases of feature growth without a single structural rework. The
  documented selector categories and the cross-slice `extraReducers` boundary are patterns
  worth keeping verbatim.
- **Encoding architectural decisions as lint rules.** The `no-restricted-imports` guard on
  `@dnd-kit` inside window components turns a doc sentence into a compiler error. More
  decisions should graduate to this tier, not fewer.
- **Storybook-first component development.** Every primitive existing in isolation before
  composition has kept components genuinely presentational and made the screens thin
  assemblies. The stub-content-first sequencing (shell in Phase 2, data in Phase 3) is the
  right decomposition.
- **The phase/task documentation system.** Goals, non-goals, decision tables with rationale,
  and definition-of-done per phase made this review possible at all — intent was always
  recoverable. This process scaffolding is the project's most transferable asset.
- **The two-audience token system.** Primitives-then-semantics CSS custom properties, with
  7.css supplying the OS chrome underneath, has scaled cleanly from the login screen to the
  desktop shell and Start Menu without value duplication.
- **Strict, layered quality gates.** `--max-warnings=0` in both lint-staged and CI, Prettier
  as a check rather than a suggestion, conventional commits enforced by hook — the cost is
  paid in seconds per commit and repaid in a history that is uniformly reviewable.
- **The zero-cost infrastructure constraint.** Supabase + Vercel + GitHub Actions free tiers
  have imposed no architectural compromises to date, and the constraint itself has kept the
  design honest (RLS at the database, static-first rendering, no bespoke servers).
