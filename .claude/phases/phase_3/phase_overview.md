<!-- Created: 2026-06-13 03:12:40 -->

# Phase 3 — Verification, Polish & Live Portfolio Data

**Status:** `in-progress`

**Start Date:** 06-13-2026

**End Date:** —

---

## Flags

| Flag            | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Phase           | 3                                                                    |
| Status          | in-progress                                                          |
| Tasks Complete  | 0 / 21                                                               |
| Blocking Issues | ⛔ Content-storage decision UNRESOLVED (see Blocking Decision below) |
| Current Task    | — (awaiting user review of this roadmap)                             |

---

## ⚠️ Read Before Executing Any Task

**This roadmap is a draft for the product owner (the Junior) to review and edit.** Per the
project's working agreement, **no Phase 3 task may be executed until the user has manually read
every task in this overview and modified it as needed.** The task list, the schema design, the
visibility model, and especially every visual-polish decision are proposals — the user has the
**final say on all visual and product design choices**. Treat the numbers, column names, and
copy below as a starting point, not a contract.

Two classes of task exist in this phase and they are governed differently:

- **🔒 User Sign-Off tasks (Band 1).** Manual verification and visual polish. The AI **may not**
  mark these complete, may not "sign off," and may not assert that a component "looks correct."
  The AI's only role is to author the verification checklist; the **user** walks each component
  one-by-one and records the result. A Band 1 task is complete only when the user signs it.
- **🛠️ Implementation tasks (Bands 2–5).** Generated and validated under the normal
  pair-programming protocol (`AGENTS.md`): the AI writes the tutorial, the Junior writes the
  production code, automated gates verify it.

---

## ⛔ Blocking Decision (must be resolved before Band 3)

`.claude/TASKS.md` → "Open Design Decisions" records **project-content storage** as
`UNRESOLVED` and explicitly **blocking Phase 3**. The three candidate approaches each produce a
materially different schema and a different set of integration tasks, so this **must be answered
and recorded in `TASKS.md` before Task 8 begins**.

| Approach            | Card grid / RLS source  | Rich subpage body (copy, gallery, demos)       | Honors `CLAUDE.md` data-layer thesis? |
| ------------------- | ----------------------- | ---------------------------------------------- | ------------------------------------- |
| **Hybrid** _(rec.)_ | `projects` table        | Repo-resident MDX/React keyed by `slug`        | ✅ Yes — grid + RLS are DB-driven     |
| All in Supabase     | `projects` table        | Additional DB columns / `project_images` table | ✅ Yes — fully DB-driven              |
| All in repo         | Static in-repo registry | Repo                                           | ❌ No — undercuts GraphQL + RLS       |

**Recommended (pending user confirmation): Hybrid.** The `projects` table stays the single
source of truth for everything the **card grid and Row Level Security** need — `title`,
`tech_stack`, `visibility`, `status`, `thumbnail_url`, links, ordering — driving the listing and
visibility enforcement through GraphQL exactly as `CLAUDE.md` describes. Long-form per-project
**bodies** (narrative copy, image galleries, the embedded Super Mario Bros demo) render from
repo-resident MDX/React keyed to the table by a `slug` column. This keeps the data-layer thesis
intact while keeping heavy DOM/asset content in version control where it is diffable and
deployable.

> The schema in Band 3 is designed for **Hybrid**. If the user chooses **All in Supabase**, Task
> 9 grows additional body columns (and likely promotes `project_images` from optional to
> required); if **All in repo**, Bands 3–4 collapse to a repo registry and the GraphQL tasks are
> struck. **Do not start Task 8 until the chosen approach and its rationale are written into
> `TASKS.md`.**

---

## Goal

Turn the navigable-but-hollow Phase 2 shell into a **complete, data-backed product** — the last
implementation phase before a production build. Phase 3 has two halves:

1. **Verify and polish what already exists.** Every page, component, and interaction shipped in
   Phases 1–2 is walked **one component at a time** for both functional correctness and visual
   fidelity to authentic Windows 7. The user owns these sign-offs. This half exists because
   Phase 4 is purely launch — it assumes the product is already visually and functionally final.

2. **Implement live data end-to-end.** Stand up the Supabase data layer the way a **database
   administrator** would: a deliberate schema migration, normalized where it earns its keep,
   Storage buckets with explicit policies, production role-based RLS replacing the permissive dev
   policy, and seeded real content. Then wire it through the existing Apollo + GraphQL link chain
   into the live surfaces — the role-filtered **Projects** grid, per-project **detail subpages**,
   the real **Resume** document, the embedded **Super Mario Bros** demo, and **Admin-only**
   project visibility.

Phase 3 is complete when a Guest and an Admin can each land on `/desktop`, open the Projects
window and see the **correct role-filtered set of real projects** rendered from Supabase, open
any project's detail subpage, view and download the **real resume**, launch the embedded demo in
its own IE window — with **every** Phase 1–2 component verified and signed off by the user, the
production RLS policies enforcing visibility at the database layer, and both test suites
(Vitest + RTL, and a repaired Cypress E2E suite) green locally and in CI. After Phase 3, the only
remaining work is Phase 4: final checks, deployment, and replacing the current portfolio site's
references and redirects.

---

## Non-Goals (deferred to Phase 4)

- **Deployment, domain cutover, and redirects.** Tagging the release, the production Vercel
  promotion, swapping the current portfolio URL, and setting up redirects from the old site are
  **all Phase 4**. Phase 3 ends at "production-build-ready," not "deployed."
- **Lighthouse / performance tuning and the formal accessibility audit.** Phase 3 keeps the a11y
  and token discipline already in force (keyboard paths, ARIA, `var(--w7-*)` only) and verifies
  it per component, but the 90+ Lighthouse targets and the full audit are Phase 4.
- **Mobile / responsive fallback.** The graceful mobile screen and tablet degradation remain
  Phase 4.
- **Settings window, File Explorer, sound effects, real-time presence.** Long-Term Vision items;
  out of scope.
- **Public user accounts.** Still exactly two identities — Guest and Admin.

---

## Key Decisions

| Decision                                                                        | Rationale                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual verification + visual polish leads the phase and is **user-signed-off**  | Phase 4 is launch-only and assumes a finished product. The cheapest place to catch a visual or behavioral defect is before data wiring layers more surface on top of it. The product owner — not the AI — is the authority on whether a Windows 7 surface "looks right," so those tasks are theirs to close.         |
| **Hybrid** content storage (DB index + repo body) is the recommended default    | Keeps the card grid, visibility, and RLS DB-driven (honoring the `CLAUDE.md` thesis) while keeping galleries, long copy, and the embedded demo in the repo where they are diffable and deploy with the app. Final choice is the user's and must be recorded in `TASKS.md` before Band 3.                             |
| The Supabase layer is built **migration-first, DBA-style**                      | Schema changes, indexes, constraints, RLS policies, Storage buckets, and seed data are authored as ordered, replayable SQL — not clicked together in the dashboard ad hoc. A migration history is auditable, reviewable in a PR, and reproducible on a fresh project. This is also an interview-defensible artifact. |
| Production **role-based RLS replaces** the permissive `USING (true)` dev policy | `CLAUDE.md` mandates DB-layer enforcement: Guest reads `visibility = 'guest'`; Admin reads all. Enforcement must live in Postgres, not only in the GraphQL filter — the filter is defense-in-depth, RLS is the wall. Validated with anon vs Admin JWT via Postman before any UI consumes it.                         |
| Project **detail subpages are IE routes**, not a new `WindowKind`               | Phase 2 already established Resume and Projects as IE routes, not window kinds. A detail page is `portfolio://projects/:slug` walked via the existing IE history stack — reusing back/forward, the address bar, and the route registry. No new window kind, no new manager surface.                                  |
| The Super Mario Bros demo opens in a **new IE window**, per the product brief   | `TASKS.md` calls this out explicitly. It dispatches a fresh `openWindow({ kind: 'internet-explorer', ... })` rather than navigating in place, so the demo runs in its own chrome and the user can keep the project page open beside it.                                                                              |
| Data fetching stays **Apollo + GraphQL only**; Supabase JS remains auth-only    | The anti-pattern in `CLAUDE.md` is absolute: no `supabase.from()` data reads anywhere. New project/resume reads go through the existing `makeApolloClient` link chain (`apikey` + `Authorization: Bearer`), which already swaps anon key for Admin JWT.                                                              |
| The deferred Phase 2 Cypress suite is **repaired and finished in Phase 3**      | Phase 2 closed with Task 17 deferred over a React 19 / Cypress event-dispatch incompatibility on the Start orb. The desktop is now data-backed and the E2E journeys finally have real assertions to make — Phase 3 is where the suite goes green and the CI gate (mandated by `CLAUDE.md`) is honored.               |
| Storybook-first holds for every new/changed data surface                        | Same gate as Phases 1–2: the live Projects grid, the detail subpage, the PDF resume frame, and the Admin badge land in Storybook (with loading / error / empty / guest / admin variants, fed by Apollo `MockedProvider`) before composition.                                                                         |
| Every new value remains a `var(--w7-*)` token in `globals.css`                  | The token discipline is non-negotiable through Phase 3. Card chrome, the Admin badge/border, the PDF frame, and the detail-page layout all reference custom properties; raw color/shadow/blur/gradient/radius literals are a ship-blocker.                                                                           |

---

## Tooling

| Tool                                                    | Purpose                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Supabase SQL Editor / migrations                        | DBA-style schema changes, indexes, constraints, RLS policies, and seed data authored as ordered SQL   |
| Supabase Storage                                        | `resume` (PDF) and `project-thumbnails` (+ gallery) buckets with explicit access policies             |
| Row Level Security (Postgres RLS)                       | Production role-based read policies replacing the Phase 0 permissive `USING (true)` dev policy        |
| Postman                                                 | Validates GraphQL queries and RLS behavior with anon key vs Admin JWT **before** Apollo consumes them |
| Apollo Client (`makeApolloClient` link chain) + GraphQL | Typed queries for the projects list and single-project-by-slug; normalized cache keyed by UUID        |
| MDX / repo-resident React (Hybrid only)                 | Long-form per-project body content keyed to the DB by `slug`                                          |
| Redux Toolkit (`windowSlice`)                           | Unchanged — `openWindow` still drives the new IE detail route and the new demo window                 |
| CSS Modules + CSS Custom Properties                     | New Aero tokens for live card chrome, the Admin badge, the PDF frame, and the detail layout           |
| Storybook (Apollo `MockedProvider`)                     | Loading / error / empty / guest / admin variants for every new data-backed surface                    |
| Vitest + React Testing Library (`MockedProvider`)       | Query-shape tests, role-filter logic, and component behavior for the data surfaces                    |
| Cypress                                                 | Repaired + extended E2E: Guest and Admin data-driven journeys, runs in CI on every PR to `main`       |
| `src/lib/debug.ts`                                      | Still the only sanctioned `console.warn` wrapper — `no-console` rule unchanged                        |

---

## Known Maintenance & Component Interaction Guide

> A reference map of the surfaces Phase 3 touches: where each lives, what maintenance it is known
> to need, and the rules for modifying it safely. Read the relevant entry **before** editing a
> component — most "bugs" in this codebase are token or registry violations, not logic errors.

### Carried-forward maintenance debt (address in Task 7)

- **Deferred Cypress suite.** Spec scaffolding exists (`cypress/e2e/guest-desktop.cy.ts`,
  `admin-desktop.cy.ts`, `start-menu-ie.cy.ts`); Start Menu + Admin specs fail under a React 19 /
  Cypress 15 event-dispatch incompatibility on the Start orb button. Repaired in Task 19.
- **Missing asset.** `public/imgs/desktop/projects_mockup.png` is referenced by `TASKS.md` and
  the Phase 2 IE task but is **not in the repo** (only `background.jpg` is present). It must be
  added before the Projects grid layout (Task 14) can be matched against it.
- **Pending renames (`TASKS.md` → "ADJUSTMENTS").** `AccountIcon[s]` → `LogonAccount`,
  any `Login*` → `Logon*`, `SubmitButton` → `LogonSubmitButton`, `OsBranding` →
  `LogonOsBranding`. These are Phase 1 cleanup; bundle them into Task 7 so the tree is consistent
  before new files land. Renames must update barrels, imports, Storybook IDs, and test paths.
- **Spinner timing.** `TASKS.md` → "IMPROVEMENTS" wants smoother spinner timing per the logon
  reference video. Optional polish; capture under Task 1's sign-off if the user wants it now.

### Component interaction rules

| Surface / files                                                                                                        | Known maintenance in Phase 3                                                              | How to interact with it safely                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design tokens** — `src/app/globals.css`                                                                              | New tokens for card chrome, Admin badge, PDF frame, detail layout                         | The single source of truth for color/shadow/blur/gradient/radius. **Define the token here first, then reference it.** Never write a literal in a `*.module.css`. `--w7-*` come from `7.css`.       |
| **Window kinds** — `src/store/slices/windowSlice.ts`                                                                   | None expected — detail pages are IE routes, not new kinds                                 | If a genuinely new kind is ever needed, add it to the `WindowKind` union **and** the content registry in `WindowManager.tsx`, or the window renders blank. Prefer an IE route over a new kind.     |
| **Window content registry** — `src/components/screens/desktop/WindowManager/WindowManager.tsx`                         | Possibly a registry entry if a non-IE surface is added                                    | Maps `WindowKind → React content`. IE windows derive their start route from `titleToRoute(window.title)`. Keep the slice content-agnostic — the mapping lives here, not in Redux.                  |
| **IE routes** — `src/components/screens/desktop/InternetExplorer/ieRoutes.ts`                                          | Add `portfolio://projects/:slug` detail route; confirm external link URLs are correct     | Navigation is an **allow-list** over `IE_ROUTES` — no arbitrary URLs, no live web views. A new IE destination is a new entry here plus a page component; `resolveRoute`/`titleToRoute` resolve it. |
| **IE pages** — `src/components/screens/desktop/InternetExplorer/pages/*`                                               | `ProjectsPage` + `ResumePage` lose their stubs; add `ProjectDetailPage`                   | These are the route targets. `ProjectsPage`/`ResumePage` currently render **hardcoded placeholders** (`PLACEHOLDER_CARDS`, "PDF viewer coming in Phase 3") — those are what Phase 3 replaces.      |
| **IE navigation** — `InternetExplorer/useIENavigation.ts`, `IEToolbar.tsx`, `IEFavoritesBar.tsx`                       | Detail route must participate in the back/forward history stack                           | History is controlled React state. A detail page pushed onto the stack must restore correctly via back; verify the address bar reflects the slug route.                                            |
| **Desktop icon registry** — `src/components/screens/desktop/desktopIcons.ts`                                           | Confirm/replace placeholder icon paths; ensure Projects/Resume launch the right IE routes | Static product data: `{ id, label, iconSrc, windowKind, windowTitle }`. `windowTitle` drives `titleToRoute`. Redux stores only positions (`desktopSlice`); metadata is looked up here.             |
| **Apollo client** — `src/lib/apollo-client.ts`                                                                         | No structural change — new queries consume the existing chain                             | `makeApolloClient(getAuthToken)` injects `apikey` + `Authorization: Bearer`. Do not add a second client or a module singleton. New queries are `gql` documents consumed via hooks.                 |
| **Supabase clients** — `src/lib/supabase/{client,server,proxy}.ts`                                                     | None — **auth only**                                                                      | Auth lifecycle only (`signInWithPassword`, `onAuthStateChange`, session reads for the proxy). **Never** add `supabase.from()` data reads — that is a hard `CLAUDE.md` anti-pattern.                |
| **Session role** — `src/store/slices/sessionSlice.ts`                                                                  | Read by the Projects grid + detail pages to gate Admin-only content client-side           | The role here drives the **client** filter and badge treatment; RLS is the authoritative server-side gate. Both layers must agree. Read role via `selectRole`, never raw `useSelector`.            |
| **Logon screen** — `src/components/screens/login/*`, `src/components/windows7/{AccountIcon,SubmitButton,OsBranding}/*` | Verification + the pending renames                                                        | Pure visual/auth surface from Phase 1. Renames (above) must be atomic across barrels, imports, stories, tests. Don't "fix" `SubmitEvent` typing — it's the correct React 19 form (see memory).     |
| **7.css primitives** — `src/components/windows7/*`                                                                     | Verify only the primitives actually used render correctly                                 | The sanctioned base widget library. Build on it; don't replace its chrome with custom CSS. Tokens override, not rewrite.                                                                           |
| **Resume / thumbnail assets** — Supabase Storage (Hybrid: bodies in repo)                                              | Upload real resume PDF + thumbnails; create gallery assets                                | The PDF and thumbnails live in Storage buckets with explicit policies (Task 10). Under Hybrid, gallery images + MDX bodies live in the repo keyed by `slug`.                                       |

---

## Task List

> Format: `Task N — Name` · `stack` · description. **All tasks below are proposals pending user
> review.** Per-task tutorials are generated later via `EXECUTE TASK n`, after the user has
> approved (and edited) this list. Tasks in **Band 1 are 🔒 user-signed-off and the AI may not
> close them.**

### Band 1 — Manual Verification & Polish (🔒 USER SIGN-OFF ONLY)

- **Task 1 — Logon Screen Verification & Polish**
  - Manual walkthrough · Visual reference (`AGENTS.md` → Visual References)
  - One-by-one check of the logon surface: account tiles / `LogonAccount` selection outline,
    password gate, submit button, OS branding, spinner, and the login→desktop transition.
    Functional (Guest enters with no password; Admin gates on password; correct routing) **and**
    visual (1:1 with the Windows 7 logon reference). Captures any polish the user wants now
    (spinner timing, selection halo). The AI authors the checklist; the **user** signs each row.

- **Task 2 — Desktop, Wallpaper, Icons & Grid Verification & Polish**
  - Manual walkthrough · `@dnd-kit` · `desktopSlice`
  - Wallpaper render, icon set + labels, single-click select, double-click open, snap-to-grid
    drag, collision behavior, keyboard traversal/activation, and the Admin-persist / Guest-reset
    position rule. Functional + visual fidelity. User-signed-off.

- **Task 3 — Window Manager Verification & Polish**
  - Manual walkthrough · `windowSlice` · Framer Motion
  - Per-window: drag with boundary clamping, maximize/restore (exact prior geometry),
    minimize-to-taskbar and restore, focus + z-index promotion, active vs inactive chrome, and
    the open/close/minimize Framer Motion transitions. Functional + visual. User-signed-off.

- **Task 4 — Taskbar & Start Menu Verification & Polish**
  - Manual walkthrough · CSS Modules · Framer Motion
  - Taskbar: Aero glass, per-window buttons with correct active/inactive/minimized click
    semantics, the live time-over-date clock. Start Menu: open/close + outside-click/Escape,
    account header avatar carry-over, Resume/Projects/GitHub/LinkedIn/Source shortcuts, search
    filtering, and Sign Out → `/login`. Functional + visual. User-signed-off.

- **Task 5 — Internet Explorer Shell & Navigation Verification & Polish**
  - Manual walkthrough · IE route registry
  - IE chrome (address bar, back/forward/refresh, favorites bar, title), navigation across the
    allow-listed routes, back/forward history correctness, and external-link card behavior.
    Verifies the shell is solid **before** live pages are mounted into it. User-signed-off.

- **Task 6 — Cross-Cutting Verification (A11y · Tokens · Role Parity)**
  - Manual walkthrough · ESLint · keyboard
  - End-to-end keyboard sweep across `/desktop`; ARIA roles/labels on icons, menus, window
    controls; a design-token audit (zero raw literals in any `*.module.css`); `no-console` clean;
    and a **Guest vs Admin parity pass** confirming each role's current (pre-data) experience is
    correct. User-signed-off.

### Band 2 — Known Maintenance & Pre-flight

- **Task 7 — Pre-flight Maintenance & Cleanup**
  - Refactor · assets · docs
  - Execute the carried-forward debt: the `TASKS.md` renames (`LogonAccount` /
    `Logon*` / `LogonSubmitButton` / `LogonOsBranding`) atomically across barrels, imports,
    stories, and tests; add the missing `public/imgs/desktop/projects_mockup.png`; replace
    placeholder desktop-icon paths with real assets; and re-anchor any stale deferred references.
    Leaves a clean tree before new data files land.

### Band 3 — Data Layer Foundation (Supabase · DBA setup) — _blocked until the decision is recorded_

- **Task 8 — Resolve Content-Storage Decision & Final Schema Design**
  - Design · `TASKS.md` · Supabase
  - Record the chosen content-storage approach + rationale in `TASKS.md` (unblocks the phase),
    then finalize the `projects` schema on paper: columns, types, constraints, indexes, the
    `slug` strategy, and whether `project_images` is normalized out. Produces the spec the
    migration in Task 9 implements. **No SQL runs until this is signed off.**

- **Task 9 — Schema Migration: extend `projects` (+ optional `project_images`)**
  - Supabase SQL · migrations
  - Author the migration as ordered, replayable SQL: add `slug` (unique, not null),
    `long_description`/body pointer, `demo_url`, `sort_order`, `featured`, `updated_at` (with a
    trigger), tighten existing `CHECK` constraints, and add indexes (`visibility`, `sort_order`,
    unique `slug`). Under "All in Supabase," add body columns; under Hybrid, `project_images` is
    optional. Verified by inspecting the table + constraints post-migration.

- **Task 10 — Storage Buckets: resume PDF + project thumbnails/gallery**
  - Supabase Storage · bucket policies
  - Create the `resume` and `project-thumbnails` buckets with explicit access policies (public
    read for guest-visible assets; admin-gated where appropriate), set MIME/size limits, and wire
    `thumbnail_url` to resolve against the bucket. DBA-style: policies authored deliberately, not
    left at defaults.

- **Task 11 — Production RLS Policies (role-based)**
  - Postgres RLS · Postman
  - Replace the Phase 0 permissive `USING (true)` read policy with production policies: Guest
    reads `visibility = 'guest'`; Admin (JWT `app_metadata.role`) reads all. Validate with
    Postman using the anon key vs an Admin JWT and confirm row counts differ correctly **before**
    any UI consumes the data. This is the authoritative visibility gate.

- **Task 12 — Seed Real Content**
  - Supabase SQL · Storage upload
  - Insert the real project rows (a mix of `guest` and `admin`/`wip`), set `sort_order`/`featured`,
    upload the real resume PDF and project thumbnails to the Task 10 buckets, and (Hybrid)
    author the repo-resident MDX/React bodies keyed by `slug`. Seed authored as a replayable
    script. Verified by querying the seeded set via Postman as both roles.

### Band 4 — Data Layer Integration (App · Apollo + GraphQL)

- **Task 13 — GraphQL Query Layer**
  - Apollo Client · GraphQL · TypeScript
  - Author the typed `gql` operations against `pg_graphql` (Relay `edges/node`): a projects-list
    query (ordered, role-filtered by RLS) and a single-project-by-`slug` query. Consume through
    the existing `makeApolloClient` link chain; verify the normalized cache keys by UUID. No
    `supabase.from()` anywhere. RTL/Vitest with `MockedProvider`.

- **Task 14 — Projects Window: live role-filtered card grid**
  - React · Apollo · CSS Modules · Storybook
  - Replace `ProjectsPage`'s `PLACEHOLDER_CARDS` with the live grid driven by the Task 13 query,
    laid out to `projects_mockup.png`. Loading / error / empty states; thumbnails from Storage;
    tech-stack tags from `tech_stack`. Card click navigates IE to the detail route. Storybook
    variants via `MockedProvider`. Tokens only.

- **Task 15 — Project Detail Subpages**
  - React · IE route · Apollo (+ MDX under Hybrid)
  - Add the `portfolio://projects/:slug` IE route and a `ProjectDetailPage`: DB metadata (title,
    tech stack, links, status) via the by-slug query + the rich body (repo MDX under Hybrid).
    Integrates with the IE back/forward history and address bar. Live/demo/github links resolve.
    Storybook + RTL.

- **Task 16 — Resume Window: PDF viewer + download**
  - React · Supabase Storage · CSS Modules
  - Replace `ResumePage`'s "PDF viewer coming in Phase 3" placeholder with a real in-window PDF
    frame served from the `resume` Storage bucket, plus a download action. Aero framing via
    tokens. Loading/error states. Storybook + RTL.

- **Task 17 — Embedded Demo: Super Mario Bros in a new IE window**
  - React · `windowSlice`
  - From the relevant project's detail page, the demo launches by dispatching a fresh
    `openWindow({ kind: 'internet-explorer', ... })` so it runs in its **own** IE window beside
    the project page (per the product brief). Define the demo route/host and confirm it does not
    navigate the existing window in place.

- **Task 18 — Admin Visibility & Distinction**
  - React · Redux `sessionSlice` · CSS Modules
  - Confirm Admin sees `visibility = 'admin'` / `wip` projects that Guest never receives (RLS +
    GraphQL filter agreeing), and give Admin-only/WIP cards a visual distinction (badge/border)
    defined as tokens. RTL asserts the role-gated set for both roles; manual confirm against the
    seeded data.

### Band 5 — Test & Validate

- **Task 19 — Cypress E2E: repair deferred suite + data-driven journeys**
  - Cypress · GitHub Actions
  - Resolve the React 19 / Cypress 15 Start-orb incompatibility that deferred Phase 2's Task 17,
    then extend the specs to the data-backed journeys: Guest sees only guest projects; Admin sees
    all + WIP; open a detail page; view/download the resume; launch the demo window. Green locally
    and in the CI `cypress` job.

- **Task 20 — Unit / Integration / Storybook Coverage for the Data Layer**
  - Vitest · RTL (`MockedProvider`) · Storybook
  - Query-shape and role-filter tests, component behavior for the grid/detail/resume surfaces,
    and Storybook stories covering loading / error / empty / guest / admin for every new
    data-backed component. Coverage parity with the Phase 2 bar.

- **Task 21 — Validate Phase 3 (pre-production gate)**
  - All Phase 3 tooling
  - Final integration sweep — the gate before a production build: `npm run build` clean,
    `npm test` + Cypress green locally and in CI, Storybook builds, token + `no-console` audit
    clean, RLS verified as both roles, and a confirmation that **every Band 1 sign-off is
    recorded by the user**. Produces the Phase 3 validation report.

---

## Task Status

| Task | Name                                               | Band | Status           |
| ---- | -------------------------------------------------- | ---- | ---------------- |
| 1    | Logon Screen Verification & Polish                 | 1    | 🔒 User Sign-Off |
| 2    | Desktop, Wallpaper, Icons & Grid Verification      | 1    | 🔒 User Sign-Off |
| 3    | Window Manager Verification & Polish               | 1    | 🔒 User Sign-Off |
| 4    | Taskbar & Start Menu Verification & Polish         | 1    | 🔒 User Sign-Off |
| 5    | Internet Explorer Shell & Navigation Verification  | 1    | 🔒 User Sign-Off |
| 6    | Cross-Cutting Verification (A11y · Tokens · Roles) | 1    | 🔒 User Sign-Off |
| 7    | Pre-flight Maintenance & Cleanup                   | 2    | ⬜ Pending       |
| 8    | Resolve Content-Storage Decision & Schema Design   | 3    | ⛔ Blocked       |
| 9    | Schema Migration: extend `projects`                | 3    | ⬜ Pending       |
| 10   | Storage Buckets: resume + thumbnails               | 3    | ⬜ Pending       |
| 11   | Production RLS Policies                            | 3    | ⬜ Pending       |
| 12   | Seed Real Content                                  | 3    | ⬜ Pending       |
| 13   | GraphQL Query Layer                                | 4    | ⬜ Pending       |
| 14   | Projects Window: live card grid                    | 4    | ⬜ Pending       |
| 15   | Project Detail Subpages                            | 4    | ⬜ Pending       |
| 16   | Resume Window: PDF viewer + download               | 4    | ⬜ Pending       |
| 17   | Embedded Demo: Super Mario Bros (new IE window)    | 4    | ⬜ Pending       |
| 18   | Admin Visibility & Distinction                     | 4    | ⬜ Pending       |
| 19   | Cypress E2E: repair + data journeys                | 5    | ⬜ Pending       |
| 20   | Unit / Integration / Storybook Coverage            | 5    | ⬜ Pending       |
| 21   | Validate Phase 3 (pre-production gate)             | 5    | ⬜ Pending       |

---

## Suggested Task Ordering

| Band                      | Tasks                   | Why this order                                                                                                                          |
| ------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Verify & Polish (user) | 1–6                     | Establish a known-good, visually-final baseline before any new surface is layered on. User-signed-off; can run in parallel with Task 7. |
| 2. Pre-flight maintenance | 7                       | Clean the tree (renames, missing asset, real icons) so new data files don't compound existing debt. Can interleave with Band 1.         |
| 3. Data foundation (DBA)  | 8 → 9 → 10–11 → 12      | Strictly ordered: the decision (8) unblocks the schema (9); buckets (10) and RLS (11) sit on the schema; seed (12) needs all of them.   |
| 4. Data integration (app) | 13 → 14, 15, 16, 17, 18 | Query layer (13) first; then the surfaces consume it. 14/15/16 are largely parallel; 17 depends on 15; 18 spans 14–15.                  |
| 5. Test & validate        | 19, 20 → 21             | E2E + coverage land once the surfaces exist; Task 21 is the final pre-production gate and closes the phase.                             |

---

## Definition of Done (Phase 3)

Phase 3 is the **final implementation gate before a production build** — Phase 4 does no feature
work, only launch. Phase 3 is **complete** when **every** one of these is true:

**A. Verification & polish (user-owned).**

1. Each Band 1 task (1–6) is **signed off by the user** — every Phase 1–2 component verified
   one-by-one for function and visual fidelity. The AI has **not** closed any of these.
2. All visual-design decisions surfaced during verification are resolved to the **user's**
   satisfaction.

**B. Data layer (DBA).** 3. The content-storage decision is **recorded in `TASKS.md`** and the schema migration is applied
on a clean replay. 4. Storage buckets exist with explicit policies; the real resume and thumbnails are uploaded. 5. **Production role-based RLS** has replaced the permissive dev policy and is verified via
Postman as both anon and Admin — Guest and Admin receive provably different row sets. 6. Real content is seeded (guest + admin/wip projects).

**C. Live surfaces.** 7. The Projects window renders the **live, role-filtered** grid from Supabase (mockup-matched,
with loading/error/empty states). 8. Project detail subpages render real DB metadata + body via the `portfolio://projects/:slug`
IE route, integrated with back/forward. 9. The Resume window shows the **real** PDF from Storage with a working download. 10. The Super Mario Bros demo opens in its **own** IE window. 11. Admin sees admin/WIP projects (visually distinguished) that Guest never receives; the RLS and
GraphQL filters agree.

**D. Quality gates.** 12. `npm run build`, `npm run lint` (`--max-warnings=0`, `no-console`, `curly`), and
`npm run build-storybook` are all green. 13. `npm test` (Vitest + RTL) green; the **repaired Cypress suite** green locally and in CI. 14. Zero raw color/shadow/blur/gradient/radius literals in any component CSS Module; every value
is a `var(--w7-*)`; new tokens defined in `globals.css`. 15. Every new data-backed surface has Storybook stories (loading/error/empty/guest/admin) and is
keyboard accessible with correct ARIA. 16. Task 21's validation report is written and confirms A–D, leaving the branch **ready for the
Phase 4 production build** — nothing in the product requires further feature work.

> When this list is fully satisfied, the desktop is a complete, data-backed, role-aware product.
> Phase 4 then handles only: final checks, deployment, and replacing the current portfolio
> website's references and redirects.
