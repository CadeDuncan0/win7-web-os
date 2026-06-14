<!-- Created: 2026-06-13 03:12:40 -->
<!-- Revised: 2026-06-13 — content-storage redesign (project data is repo-resident; Apollo/GraphQL removed) -->

# Phase 3 — Verification, Polish & Portfolio Content

**Status:** `in-progress`

**Start Date:** 06-13-2026

**End Date:** —

---

## Flags

| Flag            | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Phase           | 3                                                                            |
| Status          | in-progress                                                                  |
| Tasks Complete  | 1 / 19                                                                       |
| Blocking Issues | None — content-storage decision **resolved** (All in repo; see Task 1 / ADR) |
| Current Task    | — (Band 1 verification + Band 2 maintenance ready; awaiting user)            |

---

## ⚠️ Read Before Executing Any Task

**This roadmap is for the product owner (the Junior) to review and edit.** Per the project's
working agreement, **no Phase 3 implementation task may be executed until the user has read it and
modified it as needed.** The task list, the content-layer design, the visibility model, and
especially every visual-polish decision are proposals — the user has the **final say on all visual
and product design choices**. Treat the numbers, names, and copy below as a starting point, not a
contract.

Three classes of task exist in this phase and they are governed differently:

- **🧭 Decision record (Task 1).** Already resolved and recorded — the content-storage redesign
  (project data is repo-resident; Apollo/GraphQL removed; resume in Storage). This is the visible
  first step of the phase; its artifact is the ADR plus the commits that executed it.
- **🔒 User Sign-Off tasks (Band 1).** Manual verification and visual polish. The AI **may not**
  mark these complete, may not "sign off," and may not assert that a component "looks correct."
  The AI's only role is to author the verification checklist; the **user** walks each component
  one-by-one and records the result. A Band 1 task is complete only when the user signs it.
- **🛠️ Implementation tasks (Bands 2–5).** Generated and validated under the normal
  pair-programming protocol (`AGENTS.md`): the AI writes the tutorial, the Junior writes the
  production code, automated gates verify it.

---

## ✅ Resolved: Content-Storage Decision

The Phase 3 blocking decision — _where per-project content lives_ — is **resolved** in favor of
**All in repo**. Project data (metadata **and** body) lives in the repository as a typed registry
plus per-project MDX/React bodies keyed by `slug`. Supabase holds **no** project data; the
`projects` table, project RLS, and the Apollo/GraphQL query path are removed. Supabase is retained
for **auth** and for the **resume** PDF (a single overwrite-on-upload object in a `resume` Storage
bucket, no version history). Role-based project visibility (guest vs admin/wip) is a **filter over
the registry** driven by the session role — a UX/structural gate, not a DB boundary, acceptable
while no project content is confidential.

| Approach                      | Project index (card grid) | Rich body (copy, gallery, demos)        | Status        |
| ----------------------------- | ------------------------- | --------------------------------------- | ------------- |
| **All in repo** _(now)_       | Typed in-repo registry    | Repo-resident MDX/React keyed by `slug` | ✅ **CHOSEN** |
| Hybrid (DB index + repo body) | `projects` table          | Repo-resident MDX/React                 | ❌ rejected   |
| All in Supabase               | `projects` table          | DB columns / `project_images` table     | ❌ rejected   |

> Full rationale (pros/cons of every approach, scope, and why now) lives in
> `.claude/docs/PROJECT_REDESIGN_SUPABASEPROJECTS.md`; the decision is recorded in
> `.claude/TASKS.md` → "Open Design Decisions" and reflected in `CLAUDE.md` + `README.md`.
> Apollo/GraphQL was removed in commit `ac1e619`; the docs were aligned in `5e323a6`.

---

## Goal

Turn the navigable-but-hollow Phase 2 shell into a **complete, content-backed product** — the last
implementation phase before a production build. Phase 3 has two halves:

1. **Verify and polish what already exists.** Every page, component, and interaction shipped in
   Phases 1–2 is walked **one component at a time** for both functional correctness and visual
   fidelity to authentic Windows 7. The user owns these sign-offs. This half exists because
   Phase 4 is purely launch — it assumes the product is already visually and functionally final.

2. **Implement real content end-to-end.** Author the **repo-resident content layer**: a typed
   project registry (the index the card grid and routing need) plus per-project MDX/React bodies
   keyed by `slug`, with thumbnails and gallery assets in version control. Stand up a single
   `resume` Supabase Storage bucket so the PDF can be replaced without a redeploy. Then render it
   all through the existing surfaces — the role-filtered **Projects** grid, per-project **detail
   subpages**, the real **Resume** document, the embedded **Super Mario Bros** demo, and
   **Admin-only** project visibility.

Phase 3 is complete when a Guest and an Admin can each land on `/desktop`, open the Projects window
and see the **correct role-filtered set of real projects** rendered from the repo registry, open
any project's detail subpage, view and download the **real resume** from Storage, launch the
embedded demo in its own IE window — with **every** Phase 1–2 component verified and signed off by
the user, the role filter agreeing for both roles, and both test suites (Vitest + RTL, and a
repaired Cypress E2E suite) green locally and in CI. After Phase 3, the only remaining work is
Phase 4: final checks, deployment, and replacing the current portfolio site's references and
redirects.

---

## Non-Goals (deferred to Phase 4 or later)

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
- **Per-user data / a server-side data layer.** Public visitor accounts, tailored per-user apps,
  and the database/query layer they would need are **future work** — explicitly out of scope. They
  are why the backend (Supabase auth) is retained, not removed, but Phase 3 adds none of them.
- Still exactly two identities — Guest and Admin.

---

## Key Decisions

| Decision                                                                       | Rationale                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual verification + visual polish leads the phase and is **user-signed-off** | Phase 4 is launch-only and assumes a finished product. The cheapest place to catch a visual or behavioral defect is before content wiring layers more surface on top of it. The product owner — not the AI — is the authority on whether a Windows 7 surface "looks right," so those are theirs to close. |
| **Project data is repo-resident** (typed registry + MDX/React bodies)          | The data is static, developer-authored, ~10 records, read-only, with code-shaped bodies (the Godot/Mario embed). That is version-controlled content, not database rows. One source of truth, diffable, type-safe, atomic deploys, zero content network latency. See the ADR.                              |
| The **resume lives in Supabase Storage** as a single object                    | The resume changes on a cadence decoupled from code, so it earns dynamic storage — one `resume` object, public read, overwrite-on-upload, no version history. Updating it requires **no redeploy** (fixing a known pain point of the current portfolio).                                                  |
| Role-based project visibility is a **registry filter**, not RLS                | With project data in the repo, visibility is filtered by the session role over the registry. It is a UX/structural gate, not a hard data boundary — all project content ships in the bundle, acceptable because none is confidential. A server-side boundary returns only for genuinely private content.  |
| Project **detail subpages are IE routes**, not a new `WindowKind`              | Phase 2 already established Resume and Projects as IE routes, not window kinds. A detail page is `portfolio://projects/:slug` walked via the existing IE history stack — reusing back/forward, the address bar, and the route registry. No new window kind, no new manager surface.                       |
| The Super Mario Bros demo opens in a **new IE window**, per the product brief  | `TASKS.md` calls this out explicitly. It dispatches a fresh `openWindow({ kind: 'internet-explorer', ... })` rather than navigating in place, so the demo runs in its own chrome and the user can keep the project page open beside it.                                                                   |
| **No data-fetching client** for project content; Supabase JS stays auth-only   | Apollo/GraphQL is removed (`ac1e619`). Project reads are direct imports from the typed registry — no `gql`, no `supabase.from()`. The Supabase JS SDK is for auth (`supabase.auth.*`) and resolving the resume's Storage URL only.                                                                        |
| The deferred Phase 2 Cypress suite is **repaired and finished in Phase 3**     | Phase 2 closed with a spec deferred over a React 19 / Cypress event-dispatch incompatibility on the Start orb. The desktop is now content-backed and the E2E journeys finally have real assertions to make — Phase 3 is where the suite goes green and the CI gate (mandated by `CLAUDE.md`) is honored.  |
| Storybook-first holds for every new/changed surface                            | Same gate as Phases 1–2: the Projects grid, the detail subpage, the PDF resume frame, and the Admin badge land in Storybook (guest / admin / empty variants from registry fixtures; loading / error for the resume Storage fetch) before composition.                                                     |
| Every new value remains a `var(--w7-*)` token in `globals.css`                 | The token discipline is non-negotiable through Phase 3. Card chrome, the Admin badge/border, the PDF frame, and the detail-page layout all reference custom properties; raw color/shadow/blur/gradient/radius literals are a ship-blocker.                                                                |

---

## Tooling

| Tool                                           | Purpose                                                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Repo content layer (TypeScript)                | A typed project registry (the index) consumed by the grid, detail pages, and visibility filter             |
| MDX / repo-resident React                      | Long-form per-project body content (copy, galleries) keyed by `slug`; bespoke interactive bodies           |
| Supabase Storage                               | A single `resume` bucket (one object, public read, overwrite-on-upload) for the resume PDF                 |
| Supabase JS SDK                                | **Auth only** (`supabase.auth.*`) + resolving the resume's public Storage URL                              |
| Redux Toolkit (`windowSlice` / `sessionSlice`) | `openWindow` drives the IE detail route and the new demo window; `selectRole` drives the visibility filter |
| CSS Modules + CSS Custom Properties            | New Aero tokens for card chrome, the Admin badge, the PDF frame, and the detail layout                     |
| Storybook                                      | Guest / admin / empty variants (registry fixtures) + loading / error (resume) for every new surface        |
| Vitest + React Testing Library                 | Role-filter logic, registry shape, and component behavior for the content surfaces                         |
| Cypress                                        | Repaired + extended E2E: Guest and Admin content-driven journeys, runs in CI on every PR to `main`         |
| `src/lib/debug.ts`                             | Still the only sanctioned `console.warn` wrapper — `no-console` rule unchanged                             |

---

## Known Maintenance & Component Interaction Guide

> A reference map of the surfaces Phase 3 touches: where each lives, what maintenance it is known
> to need, and the rules for modifying it safely. Read the relevant entry **before** editing a
> component — most "bugs" in this codebase are token or registry violations, not logic errors.

### Carried-forward maintenance debt (address in Task 8)

- **Deferred Cypress suite.** Spec scaffolding exists (`cypress/e2e/guest-desktop.cy.ts`,
  `admin-desktop.cy.ts`, `start-menu-ie.cy.ts`); Start Menu + Admin specs fail under a React 19 /
  Cypress 15 event-dispatch incompatibility on the Start orb button. Repaired in Task 17.
- **Missing asset.** `public/imgs/desktop/projects_mockup.png` is referenced by `TASKS.md` and
  the Phase 2 IE task but is **not in the repo** (only `background.jpg` is present). It must be
  added before the Projects grid layout (Task 12) can be matched against it.
- **Pending renames (`TASKS.md` → "ADJUSTMENTS").** `AccountIcon[s]` → `LogonAccount`,
  any `Login*` → `Logon*`, `SubmitButton` → `LogonSubmitButton`, `OsBranding` →
  `LogonOsBranding`. These are Phase 1 cleanup; bundle them into Task 8 so the tree is consistent
  before new files land. Renames must update barrels, imports, Storybook IDs, and test paths.
- **Spinner timing.** `TASKS.md` → "IMPROVEMENTS" wants smoother spinner timing per the logon
  reference video. Optional polish; capture under Task 2's sign-off if the user wants it now.

### Component interaction rules

| Surface / files                                                                                                        | Known maintenance in Phase 3                                                              | How to interact with it safely                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design tokens** — `src/app/globals.css`                                                                              | New tokens for card chrome, Admin badge, PDF frame, detail layout                         | The single source of truth for color/shadow/blur/gradient/radius. **Define the token here first, then reference it.** Never write a literal in a `*.module.css`. `--w7-*` come from `7.css`.                                        |
| **Repo content layer** — `src/content/` (new)                                                                          | Author the typed registry + per-project MDX/React bodies keyed by `slug`                  | The single source of truth for project data — index in the typed registry, bodies as MDX/React. Add/edit/remove a project here in one place. No DB, no `gql`. Visibility is a field on each entry.                                  |
| **Window kinds** — `src/store/slices/windowSlice.ts`                                                                   | None expected — detail pages are IE routes, not new kinds                                 | If a genuinely new kind is ever needed, add it to the `WindowKind` union **and** the content registry in `WindowManager.tsx`, or the window renders blank. Prefer an IE route over a new kind.                                      |
| **Window content registry** — `src/components/screens/desktop/WindowManager/WindowManager.tsx`                         | Possibly a registry entry if a non-IE surface is added                                    | Maps `WindowKind → React content`. IE windows derive their start route from `titleToRoute(window.title)`. Keep the slice content-agnostic — the mapping lives here, not in Redux.                                                   |
| **IE routes** — `src/components/screens/desktop/InternetExplorer/ieRoutes.ts`                                          | Add `portfolio://projects/:slug` detail route; confirm external link URLs are correct     | Navigation is an **allow-list** over `IE_ROUTES` — no arbitrary URLs, no live web views. A new IE destination is a new entry here plus a page component; `resolveRoute`/`titleToRoute` resolve it.                                  |
| **IE pages** — `src/components/screens/desktop/InternetExplorer/pages/*`                                               | `ProjectsPage` + `ResumePage` lose their stubs; add `ProjectDetailPage`                   | These are the route targets. `ProjectsPage`/`ResumePage` currently render **hardcoded placeholders** (`PLACEHOLDER_CARDS`, "PDF viewer coming in Phase 3") — those are what Phase 3 replaces with the registry and the Storage PDF. |
| **IE navigation** — `InternetExplorer/useIENavigation.ts`, `IEToolbar.tsx`, `IEFavoritesBar.tsx`                       | Detail route must participate in the back/forward history stack                           | History is controlled React state. A detail page pushed onto the stack must restore correctly via back; verify the address bar reflects the slug route.                                                                             |
| **Desktop icon registry** — `src/components/screens/desktop/desktopIcons.ts`                                           | Confirm/replace placeholder icon paths; ensure Projects/Resume launch the right IE routes | Static product data: `{ id, label, iconSrc, windowKind, windowTitle }`. `windowTitle` drives `titleToRoute`. Redux stores only positions (`desktopSlice`); metadata is looked up here.                                              |
| **Supabase clients** — `src/lib/supabase/{client,server,proxy}.ts`                                                     | None — **auth only** (+ resolving the resume's public Storage URL)                        | Auth lifecycle (`signInWithPassword`, `onAuthStateChange`, session reads for the proxy) and the resume Storage URL only. **Never** add `supabase.from()` data reads — a hard `CLAUDE.md` anti-pattern.                              |
| **Session role** — `src/store/slices/sessionSlice.ts`                                                                  | Read by the Projects grid + detail pages to gate Admin-only content                       | The role here drives the project visibility filter and badge treatment. There is no server-side gate for projects — the registry filter is authoritative. Read role via `selectRole`, never raw `useSelector`.                      |
| **Logon screen** — `src/components/screens/login/*`, `src/components/windows7/{AccountIcon,SubmitButton,OsBranding}/*` | Verification + the pending renames                                                        | Pure visual/auth surface from Phase 1. Renames (above) must be atomic across barrels, imports, stories, tests. Don't "fix" `SubmitEvent` typing — it's the correct React 19 form (see memory).                                      |
| **7.css primitives** — `src/components/windows7/*`                                                                     | Verify only the primitives actually used render correctly                                 | The sanctioned base widget library. Build on it; don't replace its chrome with custom CSS. Tokens override, not rewrite.                                                                                                            |
| **Assets** — repo (`public/` + `src/content/`) and the `resume` Storage bucket                                         | Add real thumbnails + gallery images (repo); upload the real resume PDF (Storage)         | Project thumbnails, gallery images, and MDX bodies live in the repo keyed by `slug`. Only the resume PDF lives in Storage — a single object (Task 10).                                                                              |

---

## Task List

> Format: `Task N — Name` · `stack` · description. **Implementation tasks (Bands 2–5) are proposals
> pending user review.** Per-task tutorials are generated later via `EXECUTE TASK n`, after the user
> has approved (and edited) this list. Tasks in **Band 1 are 🔒 user-signed-off and the AI may not
> close them.**

### Task 1 — Content-Storage Redesign: Decision Record & Phase Re-scope ✅

- Design · docs · `TASKS.md` — **complete**
- The visible first step of the phase: resolve the content-storage blocking decision in favor of
  **All in repo**, remove the Apollo/GraphQL data layer, and adopt a single-object Supabase Storage
  resume. Authored the ADR (`.claude/docs/PROJECT_REDESIGN_SUPABASEPROJECTS.md`), removed Apollo/GraphQL (commit `ac1e619`), aligned `CLAUDE.md` + `README.md`
  (commit `5e323a6`), and re-scoped this roadmap. No further action — this entry documents the
  decisions that govern the rest of the phase.

### Band 1 — Manual Verification & Polish (🔒 USER SIGN-OFF ONLY)

- **Task 2 — Logon Screen Verification & Polish**
  - Manual walkthrough · Visual reference (`AGENTS.md` → Visual References)
  - One-by-one check of the logon surface: account tiles / `LogonAccount` selection outline,
    password gate, submit button, OS branding, spinner, and the login→desktop transition.
    Functional (Guest enters with no password; Admin gates on password; correct routing) **and**
    visual (1:1 with the Windows 7 logon reference). Captures any polish the user wants now
    (spinner timing, selection halo). The AI authors the checklist; the **user** signs each row.

- **Task 3 — Desktop, Wallpaper, Icons & Grid Verification & Polish**
  - Manual walkthrough · `@dnd-kit` · `desktopSlice`
  - Wallpaper render, icon set + labels, single-click select, double-click open, snap-to-grid
    drag, collision behavior, keyboard traversal/activation, and the Admin-persist / Guest-reset
    position rule. Functional + visual fidelity. User-signed-off.

- **Task 4 — Window Manager Verification & Polish**
  - Manual walkthrough · `windowSlice` · Framer Motion
  - Per-window: drag with boundary clamping, maximize/restore (exact prior geometry),
    minimize-to-taskbar and restore, focus + z-index promotion, active vs inactive chrome, and
    the open/close/minimize Framer Motion transitions. Functional + visual. User-signed-off.

- **Task 5 — Taskbar & Start Menu Verification & Polish**
  - Manual walkthrough · CSS Modules · Framer Motion
  - Taskbar: Aero glass, per-window buttons with correct active/inactive/minimized click
    semantics, the live time-over-date clock. Start Menu: open/close + outside-click/Escape,
    account header avatar carry-over, Resume/Projects/GitHub/LinkedIn/Source shortcuts, search
    filtering, and Sign Out → `/login`. Functional + visual. User-signed-off.

- **Task 6 — Internet Explorer Shell & Navigation Verification & Polish**
  - Manual walkthrough · IE route registry
  - IE chrome (address bar, back/forward/refresh, favorites bar, title), navigation across the
    allow-listed routes, back/forward history correctness, and external-link card behavior.
    Verifies the shell is solid **before** live pages are mounted into it. User-signed-off.

- **Task 7 — Cross-Cutting Verification (A11y · Tokens · Role Parity)**
  - Manual walkthrough · ESLint · keyboard
  - End-to-end keyboard sweep across `/desktop`; ARIA roles/labels on icons, menus, window
    controls; a design-token audit (zero raw literals in any `*.module.css`); `no-console` clean;
    and a **Guest vs Admin parity pass** confirming each role's current (pre-content) experience is
    correct. User-signed-off.

### Band 2 — Known Maintenance & Pre-flight

- **Task 8 — Pre-flight Maintenance & Cleanup**
  - Refactor · assets · docs
  - Execute the carried-forward debt: the `TASKS.md` renames (`LogonAccount` /
    `Logon*` / `LogonSubmitButton` / `LogonOsBranding`) atomically across barrels, imports,
    stories, and tests; add the missing `public/imgs/desktop/projects_mockup.png`; replace
    placeholder desktop-icon paths with real assets; and re-anchor any stale deferred references.
    Leaves a clean tree before new content files land.

### Band 3 — Content Foundation (repo content layer + resume Storage)

- **Task 9 — Repo Content Layer: registry schema, types & body convention**
  - TypeScript · MDX
  - Define the typed project registry (the index): `slug`, `title`, `description`, `techStack`,
    `liveUrl`/`githubUrl`/`demoUrl`, `thumbnail`, `visibility` (`guest` | `admin`), `status`
    (`complete` | `wip`), `sortOrder`, `featured`. Establish the per-project body convention
    (MDX/React keyed by `slug`) and the lookup helpers the surfaces consume. Pure types + structure;
    no content yet. RTL/Vitest cover the registry shape and the role-filter helper.

- **Task 10 — Resume Storage Bucket (single object)**
  - Supabase Storage · bucket policy
  - Create the `resume` Storage bucket: a **single object**, public read, overwrite-on-upload, no
    version history; set MIME (`application/pdf`) and size limits; policy authored deliberately, not
    left at defaults. Wire a helper that resolves the public Storage URL. Updating the resume must
    require **no redeploy**.

- **Task 11 — Author & Seed Real Content**
  - Content · assets · Storage upload
  - Author the real project entries in the registry (a mix of `guest` and `admin`/`wip`), set
    `sortOrder`/`featured`, write the per-project MDX/React bodies, and place thumbnails + gallery
    images in the repo keyed by `slug`. Upload the real resume PDF to the Task 10 bucket. Verified
    by rendering each role's set and confirming assets resolve.

### Band 4 — Content Integration (App surfaces)

- **Task 12 — Projects Window: role-filtered card grid**
  - React · content registry · CSS Modules · Storybook
  - Replace `ProjectsPage`'s `PLACEHOLDER_CARDS` with the grid driven by the registry, role-filtered
    by `selectRole`, laid out to `projects_mockup.png`. Thumbnails from the repo; tech-stack tags
    from `techStack`; an empty state. Card click navigates IE to the detail route. Storybook
    guest / admin / empty variants from registry fixtures. Tokens only.

- **Task 13 — Project Detail Subpages**
  - React · IE route · MDX
  - Add the `portfolio://projects/:slug` IE route and a `ProjectDetailPage`: registry metadata
    (title, tech stack, links, status) + the rich MDX/React body. Integrates with the IE
    back/forward history and address bar. Live/demo/github links resolve. Storybook + RTL.

- **Task 14 — Resume Window: PDF viewer + download**
  - React · Supabase Storage · CSS Modules
  - Replace `ResumePage`'s "PDF viewer coming in Phase 3" placeholder with a real in-window PDF
    frame served from the `resume` Storage bucket, plus a download action. Aero framing via
    tokens. Loading/error states for the Storage fetch. Storybook + RTL.

- **Task 15 — Embedded Demo: Super Mario Bros in a new IE window**
  - React · `windowSlice`
  - From the relevant project's detail page, the demo launches by dispatching a fresh
    `openWindow({ kind: 'internet-explorer', ... })` so it runs in its **own** IE window beside
    the project page (per the product brief). Define the demo route/host (the repo-resident Godot
    build) and confirm it does not navigate the existing window in place.

- **Task 16 — Admin Visibility & Distinction**
  - React · Redux `sessionSlice` · CSS Modules
  - Confirm Admin sees `visibility = 'admin'` / `wip` projects that Guest never receives (the
    registry filter agreeing for both roles), and give Admin-only/WIP cards a visual distinction
    (badge/border) defined as tokens. RTL asserts the role-gated set for both roles; manual confirm
    against the authored content.

### Band 5 — Test & Validate

- **Task 17 — Cypress E2E: repair deferred suite + content-driven journeys**
  - Cypress · GitHub Actions
  - Resolve the React 19 / Cypress 15 Start-orb incompatibility that deferred the Phase 2 spec,
    then extend the specs to the content-backed journeys: Guest sees only guest projects; Admin sees
    all + WIP; open a detail page; view/download the resume; launch the demo window. Green locally
    and in the CI `cypress` job.

- **Task 18 — Unit / Integration / Storybook Coverage for the Content Layer**
  - Vitest · RTL · Storybook
  - Registry-shape and role-filter tests, component behavior for the grid/detail/resume surfaces,
    and Storybook stories covering guest / admin / empty (and loading / error for the resume) for
    every new surface. Coverage parity with the Phase 2 bar.

- **Task 19 — Validate Phase 3 (pre-production gate)**
  - All Phase 3 tooling
  - Final integration sweep — the gate before a production build: `npm run build` clean,
    `npm test` + Cypress green locally and in CI, Storybook builds, token + `no-console` audit
    clean, the role filter verified for both roles, and a confirmation that **every Band 1 sign-off
    is recorded by the user**. Produces the Phase 3 validation report.

---

## Task Status

| Task | Name                                               | Band | Status           |
| ---- | -------------------------------------------------- | ---- | ---------------- |
| 1    | Content-Storage Redesign: Decision & Re-scope      | —    | ✅ Complete      |
| 2    | Logon Screen Verification & Polish                 | 1    | 🔒 User Sign-Off |
| 3    | Desktop, Wallpaper, Icons & Grid Verification      | 1    | 🔒 User Sign-Off |
| 4    | Window Manager Verification & Polish               | 1    | 🔒 User Sign-Off |
| 5    | Taskbar & Start Menu Verification & Polish         | 1    | 🔒 User Sign-Off |
| 6    | Internet Explorer Shell & Navigation Verification  | 1    | 🔒 User Sign-Off |
| 7    | Cross-Cutting Verification (A11y · Tokens · Roles) | 1    | 🔒 User Sign-Off |
| 8    | Pre-flight Maintenance & Cleanup                   | 2    | ⬜ Pending       |
| 9    | Repo Content Layer: registry schema & types        | 3    | ⬜ Pending       |
| 10   | Resume Storage Bucket (single object)              | 3    | ⬜ Pending       |
| 11   | Author & Seed Real Content                         | 3    | ⬜ Pending       |
| 12   | Projects Window: role-filtered card grid           | 4    | ⬜ Pending       |
| 13   | Project Detail Subpages                            | 4    | ⬜ Pending       |
| 14   | Resume Window: PDF viewer + download               | 4    | ⬜ Pending       |
| 15   | Embedded Demo: Super Mario Bros (new IE window)    | 4    | ⬜ Pending       |
| 16   | Admin Visibility & Distinction                     | 4    | ⬜ Pending       |
| 17   | Cypress E2E: repair + content journeys             | 5    | ⬜ Pending       |
| 18   | Unit / Integration / Storybook Coverage            | 5    | ⬜ Pending       |
| 19   | Validate Phase 3 (pre-production gate)             | 5    | ⬜ Pending       |

---

## Suggested Task Ordering

| Band                      | Tasks              | Why this order                                                                                                                          |
| ------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Decision (done)        | 1                  | The content-storage redesign is recorded first — it governs every task below. Already complete.                                         |
| 1. Verify & Polish (user) | 2–7                | Establish a known-good, visually-final baseline before any new surface is layered on. User-signed-off; can run in parallel with Task 8. |
| 2. Pre-flight maintenance | 8                  | Clean the tree (renames, missing asset, real icons) so new content files don't compound existing debt. Can interleave with Band 1.      |
| 3. Content foundation     | 9 → 10 → 11        | The registry types (9) first; the resume bucket (10) is independent; real content + resume upload (11) need both.                       |
| 4. Content integration    | 12, 13, 14, 15, 16 | The surfaces consume the registry/Storage. 12/13/14 are largely parallel; 15 depends on 13; 16 spans 12–13.                             |
| 5. Test & validate        | 17, 18 → 19        | E2E + coverage land once the surfaces exist; Task 19 is the final pre-production gate and closes the phase.                             |

---

## Definition of Done (Phase 3)

Phase 3 is the **final implementation gate before a production build** — Phase 4 does no feature
work, only launch. Phase 3 is **complete** when **every** one of these is true:

**A. Verification & polish (user-owned).**

1. Each Band 1 task (2–7) is **signed off by the user** — every Phase 1–2 component verified
   one-by-one for function and visual fidelity. The AI has **not** closed any of these.
2. All visual-design decisions surfaced during verification are resolved to the **user's**
   satisfaction.

**B. Content layer.** 3. The content-storage decision is **recorded** (Task 1 / `TASKS.md` / ADR) and
the repo content layer (typed registry + per-project MDX/React body convention) is authored. 4. The
`resume` Storage bucket exists with an explicit policy (single object, public read), and the real
resume PDF is uploaded — replaceable without a redeploy. 5. Real project content is authored in the
repo (guest + admin/wip), with thumbnails/gallery assets keyed by `slug`.

**C. Live surfaces.** 6. The Projects window renders the **role-filtered** grid from the registry
(mockup-matched, with an empty state). 7. Project detail subpages render registry metadata + the MDX
body via the `portfolio://projects/:slug` IE route, integrated with back/forward. 8. The Resume
window shows the **real** PDF from Storage with a working download (loading/error handled). 9. The
Super Mario Bros demo opens in its **own** IE window. 10. Admin sees admin/WIP projects (visually
distinguished) that Guest never receives; the registry filter is correct for both roles.

**D. Quality gates.** 11. `npm run build`, `npm run lint` (`--max-warnings=0`, `no-console`, `curly`),
and `npm run build-storybook` are all green. 12. `npm test` (Vitest + RTL) green; the **repaired
Cypress suite** green locally and in CI. 13. Zero raw color/shadow/blur/gradient/radius literals in
any component CSS Module; every value is a `var(--w7-*)`; new tokens defined in `globals.css`. 14. Every new surface has Storybook stories (guest/admin/empty; loading/error for the resume) and is
keyboard accessible with correct ARIA. 15. Task 19's validation report is written and confirms A–D,
leaving the branch **ready for the Phase 4 production build** — nothing in the product requires
further feature work.

> When this list is fully satisfied, the desktop is a complete, content-backed, role-aware product.
> Phase 4 then handles only: final checks, deployment, and replacing the current portfolio
> website's references and redirects.
