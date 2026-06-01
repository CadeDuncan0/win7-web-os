<!-- Created: 2026-05-28 00:42:28 -->

# Phase 2 — Desktop Environment & Window Manager

**Status:** `in-progress`

**Start Date:** 05-28-2026

**End Date:** --

---

## Flags

| Flag            | Value                               |
| --------------- | ----------------------------------- |
| Phase           | 2                                   |
| Status          | in-progress                         |
| Tasks Complete  | 1 / 24                              |
| Blocking Issues | None                                |
| Current Task    | Task 2 — Expand Desktop Slice Logic |

---

## Goal

Deliver the core post-login experience: a fully interactive Windows 7 desktop environment with
a virtual icon grid, drag-and-drop icon repositioning, right-click context menus, and a
production-grade window manager (open, close, minimize, maximize, focus, z-index stacking,
boundary clamping, Framer Motion transitions). A taskbar with a live clock and an active-window
list anchors the experience along the bottom edge. **All ephemeral UI state lives in Redux** —
`windowSlice` owns every open window's geometry and stacking, `desktopSlice` owns icon
positions, the selected icon, and the wallpaper setting. Phase 2 is complete when a Guest or
Admin can land on `/desktop`, reposition icons (snap-to-grid), open multiple windows from those
icons, drag/minimize/maximize/restore/close them with correct z-index promotion on focus, and
when both the unit/integration test suite (Jest + React Testing Library) and the end-to-end
suite (Cypress) cover the full happy-path journey for both roles in CI.

Beyond the bare manager, Phase 2 now ships the **navigational shell required to make the
desktop a usable, demoable product**: a functional Start orb that opens a **Start Menu
(Iteration 1)** — an account header carrying the avatar over from the logon screen, Resume /
Projects row shortcuts, GitHub / LinkedIn / Source folder shortcuts, a search box that filters
the shortcuts, and the Sign Out action — a taskbar tray showing live **time over date**, and a
**fake Internet Explorer window** (Aero IE chrome: address bar, back / forward / refresh)
registered as a window kind and reachable from both a desktop icon and the Start Menu. Every
app surface renders **stub content only**: the live Supabase project grid, the real resume
document, per-project subpages, and the data layer behind them remain Phase 3 (see Non-Goals).

---

## Non-Goals

- **Live portfolio data & rendering.** The Resume and Projects windows exist in Phase 2 as
  **IE-hosted shells with stub content**. GraphQL queries against `public.projects`, the
  role-filtered project card grid, the real resume document, per-project subpages, and Supabase
  Storage thumbnails are all Phase 3. Phase 2's openable-window registry covers the
  _navigational_ surface (Internet Explorer, a Resume launcher, a Projects launcher, plus a
  "Welcome" and an "About This PC" window) — enough to exercise the manager and the Start Menu
  without wiring the data layer.
- **Production RLS policies.** Phase 0's permissive dev read policy remains. Role-based RLS is
  introduced in Phase 3 once a concrete query surface exists.
- **Settings window & File Explorer (the Start Menu _is_ in scope).** Phase 2 ships a Start
  Menu (Iteration 1) opened by the Start orb — see the Goal and Tasks 23–24. What stays out of
  scope are the Settings window and File Explorer, which remain in the project's "Long-Term
  Vision" (per `CLAUDE.md`). Start Menu shortcut _targets_ that need live data (the real
  Projects grid, the resume document) open IE stub pages in Phase 2 and are wired to data in
  Phase 3.
- **Sound effects and real-time visitor presence.** Both are Long-Term Vision items.
- **Login screen visual polish.** Tracked in `phase_1/deferred/task_12_polish_finalize_ui.md`
  and re-anchored to Phase 4.
- **Mobile / responsive layout.** The desktop targets desktop-class viewports. A graceful
  mobile fallback screen and tablet degradation are Phase 4 concerns.
- **Window content interactivity beyond chrome + the IE navigation shell.** Phase 2 proves the
  _manager_ (chrome, drag, stack, minimize, focus) and the IE _navigation_ shell (address bar,
  back / forward, the allow-listed route → stub-page map). The live data and real documents
  that eventually render _inside_ those stub pages are the responsibility of Phase 3.

---

## Key Decisions

| Decision                                                              | Rationale                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Window dragging uses raw `pointermove`, **not** `@dnd-kit`            | `@dnd-kit` is optimized for sortable lists with snap targets and accessibility heuristics that fight pixel-perfect free-form dragging. Windows need viewport-clamped, sub-pixel-smooth repositioning with z-index promotion mid-drag — a different problem class.                                                                                                                      |
| Icon dragging uses `@dnd-kit` with snap-to-grid                       | Icons _do_ snap, _do_ have collision semantics, _do_ need keyboard-accessible drag for a11y — exactly what `@dnd-kit` was built for. Two distinct dragging problems get two distinct solutions, and we never blur the boundary between them.                                                                                                                                           |
| Window geometry, z-index, min/max state live in Redux (not component) | Multiple disconnected components — Taskbar buttons, the Window itself, the focus handler — read and write the same per-window state. A single store with auditable transitions beats prop-drilling or event-bus juggling. Selectors gate re-renders.                                                                                                                                   |
| Each window has stable `id` assigned at `openWindow` dispatch time    | Window identity must outlive React reconciliation (a window minimized to the taskbar still needs an id when un-minimized). The id is the Redux key, the React key, and the Framer Motion `layoutId` — one identity, three uses.                                                                                                                                                        |
| Framer Motion `AnimatePresence` per window, not per manager           | Mounting/unmounting at the window level lets each window independently animate in/out without re-triggering siblings. `layoutId` on the minimize target enables the shared-layout animation from window-position to taskbar-button-position with one motion primitive.                                                                                                                 |
| Cypress is introduced in Phase 2, not later                           | The desktop is the first part of the product with multi-step interactive journeys where E2E gives real value (login alone is too thin to justify the test infrastructure). `CLAUDE.md` mandates Cypress in CI; Phase 2 is when that gate goes live.                                                                                                                                    |
| React Testing Library is added now for component behavior tests       | Phase 1's tests were slice-level (pure Redux) and validation was manual. Phase 2 has components whose behavior — drag boundary clamping, focus promotion, context menu keyboard nav — must be asserted by behavior, not by inspecting internals. RTL is non-negotiable.                                                                                                                |
| Icon positions persist in Redux only for Admin; Guest resets on close | Matches the auth-model semantics established in Phase 1: Guest is a transient viewing mode, Admin is a persistent identity. Persistence boundary is enforced in `desktopSlice`, not the component layer — same shape, different lifecycle.                                                                                                                                             |
| Every new desktop / window / taskbar surface adds tokens, not values  | `globals.css` remains the single source of truth. Window chrome blur, taskbar gradient, icon selection halo, context-menu shadow — all defined as `--w7-*` custom properties before any component CSS references them. Hardcoded values are a Phase 2 ship-blocker.                                                                                                                    |
| Storybook-first for every new UI primitive                            | Same gate as Phase 1: `<DesktopIcon>`, `<Taskbar>`, `<ContextMenu>`, `<StartMenu>`, `<InternetExplorerWindow>`, the wired `<Window>` shell — each lands in Storybook before composition. Stories cover idle / focused / active / disabled / maximized / minimized / open / closed variants per primitive.                                                                              |
| Phase 2 expands to a "shippable shell," not just the window manager   | Per the product owner, the desktop must be _navigable and demoable_ to ship — so a working Start Menu (Iteration 1), a live taskbar clock, and a fake IE window are in. The hard boundary is **shell + launchers + stub content** in Phase 2; **real data + documents + subpages** in Phase 3. No GraphQL, Storage, or PDF rendering crosses into Phase 2.                             |
| Internet Explorer is a `WindowKind`, not a real browser               | The fake IE renders Aero IE chrome around an internal route map (`about:home`, `/resume`, `/projects`, external-link cards). It never embeds a live web view or iframes a third-party origin. Navigation is controlled React state over an allow-list — no arbitrary URLs. This keeps it safe, deterministic, and unit-testable, and honors the "only specific URLs" note in the TODO. |
| The logon-screen avatar is persisted into session state               | The Start Menu account header must show the _same_ avatar the visitor saw at logon. Today `login/page.tsx` picks it via `pickTwoDistinctIcons()` and discards it on navigation. Task 20 lifts the chosen avatar into Redux at sign-in so the desktop and Start Menu read one source of truth.                                                                                          |
| Desktop shortcuts come from a **static in-repo registry** in Phase 2  | The TODO floats a Supabase table (with a `projects` FK) for shortcut metadata. That is deferred — Phase 2 declares the shortcut / icon set in a typed in-repo registry. Whether shortcuts become DB-backed is downstream of the unresolved project-content-storage decision recorded in `.claude/TASKS.md`.                                                                            |
| Project-content storage is an **open decision that blocks Phase 3**   | Where per-project copy / images / demos live (Supabase vs repo vs hybrid) is unresolved. It does **not** block Phase 2 (stub content only), but an answer **must** be recorded before Phase 3 begins. Tracked in `.claude/TASKS.md` → "Open Design Decisions."                                                                                                                         |

---

## Tooling

| Tool                                                                             | Purpose                                                                                                  |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Redux Toolkit (`windowSlice`, `desktopSlice`)                                    | Single source of truth for all window geometry, stacking, and icon state                                 |
| `@dnd-kit/core` + `@dnd-kit/utilities`                                           | Accessible drag-and-drop for **icons only** (snap-to-grid, keyboard drag, screen reader announcements)   |
| Pointer Events API (`pointerdown` / `pointermove` / `pointerup`)                 | Raw input pipeline for **window** dragging and pointer capture during drag                               |
| Framer Motion (`AnimatePresence`, `motion`, `layoutId`)                          | Window open / close / minimize-to-taskbar transitions and context-menu reveal                            |
| CSS Modules + CSS Custom Properties                                              | Scoped per-component styling; new Aero tokens for window chrome, taskbar, icons, context menu            |
| Storybook                                                                        | Isolated development + state-variant documentation for every new UI primitive                            |
| Jest + ts-jest (already installed)                                               | Slice reducer tests and pure logic tests (geometry math, clamping, snap math)                            |
| React Testing Library (`@testing-library/react`, `user-event`, `jest-dom`) — NEW | Component behavior tests queried by accessible role / label / text — never by selector or internal state |
| Cypress — NEW                                                                    | End-to-end Guest and Admin desktop journeys; runs in CI on every PR to `main`                            |
| GitHub Actions (`ci.yml`)                                                        | Adds a `cypress` job downstream of the existing lint → build job                                         |
| `src/lib/debug.ts`                                                               | Continues to be the only sanctioned `console.warn` wrapper — banned ESLint `no-console` rule still holds |

---

## Task List

- Task 1
  - Expand Window Slice Logic
  - Redux Toolkit · TypeScript · Jest
  - State shape per `CLAUDE.md` Window Manager Rules (`id`, `title`, `position`, `size`, `zIndex`, `isMinimized`, `isMaximized`), reducers (`openWindow`, `closeWindow`, `minimizeWindow`, `restoreWindow`, `toggleMaximize`, `focusWindow`, `moveWindow`, `resizeWindow`), typed selectors (`selectOpenWindows`, `selectWindowById`, `selectTopWindowId`), exhaustive Jest unit coverage on every reducer. The `WindowKind` union grows to include `internet-explorer` (Task 21); Resume and Projects are IE _routes_, not separate window kinds.

- Task 2
  - Expand Desktop Slice Logic
  - Redux Toolkit · TypeScript · Jest
  - Icon registry shape, position map, `selectedIconId`, wallpaper setting; reducers (`registerIcon`, `setIconPosition`, `setSelectedIcon`, `clearSelection`, `setWallpaper`, `resetGuestPositions`); persistence boundary — Admin positions persist, Guest positions reset on `sessionSlice` clear; Jest coverage including the role-boundary reset

- Task 3
  - Install React Testing Library + jest-dom
  - `@testing-library/react` · `@testing-library/user-event` · `@testing-library/jest-dom` · Jest
  - Install RTL alongside existing Jest 30; configure `jest.setup.ts` for `@testing-library/jest-dom` matchers; author a custom `renderWithProviders` helper that wraps `Provider` (Redux) and `MockedProvider` (Apollo) so component tests get the real store API without network calls

- Task 4
  - Install Cypress + Wire into CI
  - Cypress · GitHub Actions · Next.js
  - Install Cypress, scaffold `cypress.config.ts` with `baseUrl` and Next.js dev-server integration, write Guest and Admin login support commands that hit the real auth flow against a seeded test account, extend `.github/workflows/ci.yml` with a `cypress` job that runs after the existing build job

- Task 5
  - Install @dnd-kit for Icon Drag
  - `@dnd-kit/core` · `@dnd-kit/utilities`
  - Install the smallest viable `@dnd-kit` surface (core + utilities — no `sortable`, since icons are positioned, not sorted), configure pointer + keyboard sensors with the required activation distance to coexist with `:active` click semantics, document the hard constraint that windows must never import from this library

- Task 6
  - Build Wallpaper & Desktop Shell
  - React · CSS Modules · Storybook
  - `<Desktop>` server-side-safe shell renders the Aero wallpaper layer (full-bleed, fixed) and exposes named slots for the icon grid and the window-manager layer; new tokens added to `globals.css` for wallpaper gradient and grid spacing; Storybook story per state (empty, with icons, with active window, with right-click menu open)

- Task 7
  - Build Desktop Icon Primitive
  - React · CSS Modules · Storybook
  - `<DesktopIcon>` with icon image, label, selection halo, double-click to open, single-click to select, keyboard activation (Enter / Space) and arrow-key focus traversal contract; Storybook stories cover idle / hover / selected / focused / disabled / long-label-truncation variants

- Task 8
  - Implement Icon Grid + Snap-to-Grid Drag
  - `@dnd-kit` · Redux · CSS Modules
  - Virtual column/row grid math (column-row ↔ x,y px conversion), snap-on-release behavior, drag preview, naive collision avoidance (target cell occupied → next free cell in scan order), `setIconPosition` dispatch on drop; RTL test asserts a dropped icon's redux position matches the snapped target

- Task 9
  - Build Context Menu System
  - React · CSS Modules · Framer Motion
  - Generic `<ContextMenu>` primitive with full keyboard navigation (Arrow Up/Down, Enter, Esc), outside-click and Escape dismissal, ARIA `menu` / `menuitem` roles; two consumers — `DesktopContextMenu` (View / Sort by / Refresh / New) and `IconContextMenu` (Open / Rename / Delete / Properties) — most actions wired as no-op stubs in Phase 2 except Open

- Task 10
  - Wire Window Component to Redux State
  - React · CSS Modules · Storybook · Redux
  - Extend the existing 7.css `<Window>` (`src/components/windows7/Window/`) into a `<ManagedWindow>` that reads its geometry / focus / min-max state from `windowSlice` by id and dispatches close / minimize / maximize from the title-bar controls; Storybook stories drive a mock store and demonstrate the full roundtrip on a single window instance

- Task 11
  - Window Dragging via Raw `pointermove` + Boundary Clamping
  - React · Pointer Events API · Redux
  - `pointerdown` on the title bar captures the pointer (`setPointerCapture`), `pointermove` updates a transient local offset for smoothness, `pointerup` commits the final position via `moveWindow`; clamp every frame so the window can never leave the viewport (title bar must remain reachable); RTL test simulates pointer events and asserts the final clamped position

- Task 12
  - Maximize / Restore / Minimize Geometry
  - React · Redux · CSS Modules
  - On `toggleMaximize`, persist `prevGeometry` in the slice so `restore` returns the window to exactly its prior `x/y/w/h`; double-click on the title bar toggles maximize/restore; minimized windows are hidden from the DOM (no display:none — fully unmounted from the active stack) but remain present in `windowSlice` so the taskbar button keeps the id

- Task 13
  - Z-Index Stacking + Focus Promotion
  - Redux · React
  - Monotonically increasing `zCounter` in `windowSlice`; `focusWindow(id)` reassigns the target window's `zIndex = ++zCounter` so it floats to the top; `pointerdown` anywhere within a window dispatches `focusWindow` before its own handler runs; active vs inactive title-bar chrome reflects the top-of-stack window

- Task 14
  - Framer Motion Window Open / Close / Minimize Transitions
  - Framer Motion · Redux
  - `AnimatePresence` wraps the window list so unmounts animate; open (`scale 0.95 → 1.0` + fade, 120ms), close (reverse, 100ms), minimize (translate + scale toward the taskbar button's coordinates resolved via `getBoundingClientRect` on a button ref); easing matches Windows 7's Aero feel

- Task 15
  - Build Taskbar Shell + Live Clock
  - React · CSS Modules · Storybook
  - Full-width Aero taskbar pinned to the viewport bottom; a Start orb that toggles the Start Menu (Task 23); a system tray showing live **time over date** (`h:mm tt` above `M/d/yyyy`) updating once per second via a `setInterval` cleaned up in `useEffect` cleanup; Storybook stories cover idle / with-windows / with-many-windows / different-times-of-day / start-menu-open

- Task 16
  - Taskbar Window List + Minimize/Focus Toggle
  - React · Redux · Framer Motion
  - One button per open window in `windowSlice`; click semantics match Windows 7 — clicking an inactive window's button focuses it, clicking the _active_ window's button minimizes it, clicking a _minimized_ window's button restores and focuses it; active vs inactive button styling; expose button refs to Task 14's minimize animation so it can resolve the target coordinates

- Task 17
  - Compose `/desktop` Route
  - Next.js · React · Redux
  - Replace the placeholder content of `src/app/desktop/page.tsx` with the full composition: `<Desktop>` + `<WindowManager>` + `<Taskbar>` + `<StartMenu>`; declare the typed window / shortcut registry for the Phase 2 ship set — Internet Explorer, a Resume launcher and a Projects launcher (both open an IE window at their stub route), plus "Welcome" / "About This PC"; wire the desktop launcher icons (double-click → `openWindow`); the existing centered placeholder sign-out button is retired and Sign Out relocates into the Start Menu (Task 24) with its `signOut()` → `/login` behavior preserved

- Task 18
  - Cypress E2E Suite — Desktop Journeys
  - Cypress
  - Four flows: (a) Guest full journey — login → desktop renders → drag an icon → open a window → move it → minimize it via title bar → restore from taskbar → close; (b) Admin full journey — same plus multi-window z-index stacking and the maximize/restore toggle; (c) Right-click menus — desktop right-click opens the desktop menu, icon right-click opens the icon menu, Escape and outside-click dismiss; (d) Start Menu + IE — open the Start Menu from the orb, the search box filters the shortcuts, open the Resume / Projects / IE windows from both a Start Menu shortcut and a desktop icon, confirm IE walks between stub routes via back / forward, and Sign Out from the Start Menu returns to `/login`; suite runs in CI per Task 4

- Task 19
  - Validate Phase 2
  - All Phase 2 tooling
  - Full integration sweep: Storybook green for every new primitive and variant, `npm run build` clean, `npm test` (Jest + RTL) green, Cypress green locally and in CI, design token coverage audit (zero raw color / shadow / blur / gradient literals in any `*.module.css` under `src/components/windows7/` or the new desktop / taskbar / window-manager / Start Menu / IE components), keyboard navigation sweep on `/desktop` from initial focus through icon traversal → window focus → control activation → Start Menu open / search / dismiss, accessibility audit on `<ContextMenu>` and `<StartMenu>` (role, focus trap, Escape), `no-console` rule clean

- Task 20
  - Persist Logon Avatar to Session
  - Redux · React · TypeScript · Jest
  - Lift the avatar chosen on the logon screen into Redux so the desktop reads one source of truth. Today `src/app/login/page.tsx` picks avatars via `pickTwoDistinctIcons()` and discards them on navigation. Add an `avatar` field to the authenticated session payload (extend `sessionSlice`'s `setSession` plus the `beginGuestSession` / `signInAsAdmin` results in `src/lib/auth.ts`), dispatch the selected account's avatar at sign-in, and expose a `selectAvatar` selector. Jest covers the new field across the guest and admin paths.

- Task 21
  - Internet Explorer Window Shell
  - React · CSS Modules · Storybook
  - New `<InternetExplorerWindow>` content component for the `internet-explorer` window kind: Windows 7 IE chrome — address bar, back / forward / refresh buttons, page title — composed inside `<ManagedWindow>` on the existing 7.css `<Window>`. Navigation is controlled React state (current route + a history stack for back / forward), never a live web view. New `--w7-*` tokens for the IE chrome. Storybook stories: home / a content route / back-disabled / forward-enabled.

- Task 22
  - IE Navigation Model + Stub Pages
  - React · CSS Modules
  - An allow-listed route registry mapping pseudo-URLs (`about:home`, `/resume`, `/projects`, and external-link cards for GitHub / LinkedIn / Source) to **stub page components**. Back / forward walk the history stack from Task 21. The Resume route renders a placeholder document frame; the Projects route renders a stub card grid laid out per `public/imgs/desktop/projects_mockup.png` (asset is referenced in `TASKS.md` but not yet present — add it before build). No live data, no third-party iframes, no arbitrary URLs. Document inline that the live Projects grid, the real resume document, and per-project subpages are Phase 3.

- Task 23
  - Start Menu Shell + Account Header
  - React · CSS Modules · Framer Motion · Storybook
  - Aero-glass Start Menu panel toggled by the taskbar Start orb (wired in Task 15); opens / closes with Framer Motion; dismisses on outside-click and Escape; full keyboard navigation with `menu` / `menuitem` ARIA. The account header sits top-middle of the right column and extends above the panel's top edge, showing the avatar persisted in Task 20 (reusing the logon account-icon primitive). Storybook stories: closed / open / open-with-search-active.

- Task 24
  - Start Menu Content: Shortcuts, Search & Sign Out
  - React · Redux · CSS Modules
  - Left column: Resume and Projects row shortcuts (each dispatches `openWindow` for an IE window at the matching stub route). Right column: GitHub, LinkedIn, Source Code folder shortcuts (open IE external-link stub pages). A search box that filters the visible row shortcuts by label. The Sign Out action — relocated here from the Phase-1 placeholder button — calls `signOut()` and routes to `/login`. Keyboard-accessible; RTL test asserts search filtering and that a shortcut dispatches the correct `openWindow` payload.

---

## Task Status

| Task | Name                                             | Status      |
| ---- | ------------------------------------------------ | ----------- |
| 1    | Expand Window Slice Logic                        | ✅ Complete |
| 2    | Expand Desktop Slice Logic                       | ⬜ Pending  |
| 3    | Install React Testing Library + jest-dom         | ⬜ Pending  |
| 4    | Install Cypress + Wire into CI                   | ⬜ Pending  |
| 5    | Install @dnd-kit for Icon Drag                   | ⬜ Pending  |
| 6    | Wallpaper & Desktop Shell                        | ⬜ Pending  |
| 7    | Desktop Icon Primitive                           | ⬜ Pending  |
| 8    | Icon Grid + Snap-to-Grid Drag                    | ⬜ Pending  |
| 9    | Context Menu System                              | ⬜ Pending  |
| 10   | Wire Window Component to Redux State             | ⬜ Pending  |
| 11   | Window Dragging via Raw `pointermove` + Clamping | ⬜ Pending  |
| 12   | Maximize / Restore / Minimize Geometry           | ⬜ Pending  |
| 13   | Z-Index Stacking + Focus Promotion               | ⬜ Pending  |
| 14   | Framer Motion Window Transitions                 | ⬜ Pending  |
| 15   | Taskbar Shell + Live Clock                       | ⬜ Pending  |
| 16   | Taskbar Window List + Minimize/Focus Toggle      | ⬜ Pending  |
| 17   | Compose `/desktop` Route                         | ⬜ Pending  |
| 18   | Cypress E2E Suite — Desktop Journeys             | ⬜ Pending  |
| 19   | Validate Phase 2                                 | ⬜ Pending  |
| 20   | Persist Logon Avatar to Session                  | ⬜ Pending  |
| 21   | Internet Explorer Window Shell                   | ⬜ Pending  |
| 22   | IE Navigation Model + Stub Pages                 | ⬜ Pending  |
| 23   | Start Menu Shell + Account Header                | ⬜ Pending  |
| 24   | Start Menu Content: Shortcuts, Search & Sign Out | ⬜ Pending  |

---

## Suggested Task Ordering

The 19 tasks fall into four natural dependency bands. Within a band, tasks are mostly
parallelizable. Across bands, the later band depends on the earlier.

| Band                          | Tasks                            | Why this order                                                                                                                                                         |
| ----------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. State + Tooling Setup      | 1, 2, 3, 4, 5, 20                | Slices, tooling, and the avatar-to-session lift must exist before any component can be built or tested — no inter-dependencies; can interleave                         |
| 2. Surface Primitives         | 6, 7, 10, 15, 21, 23             | Wallpaper, icons, the wired window, the taskbar shell, the IE window shell, and the Start Menu shell are independent surfaces — Storybook-first, no manager wiring yet |
| 3. Manager Behaviors          | 8, 9, 11, 12, 13, 14, 16, 22, 24 | All the interactive layers — icon drag, context menus, window dragging, geometry, stacking, transitions, taskbar wiring, IE navigation, Start Menu content             |
| 4. Composition + Verification | 17, 18, 19                       | Route composition, full E2E, and the phase validation sweep land last and gate phase closure                                                                           |

> **Numbering note:** Tasks 20–24 were appended after Tasks 18 (E2E) and 19 (Validation) were
> already numbered. Despite the lower numbers, **18 and 19 execute last** — they assert the full
> Phase 2 surface, Start Menu and Internet Explorer included.

---

## Definition of Done (Phase 2)

A feature inside this phase is **done** when every one of these is true:

1. **Behavior** — works in both Guest and Admin sessions, verified manually by walking the
   `/desktop` route end-to-end.
2. **Tests** — Jest covers any new reducer or pure function; RTL covers any new interactive
   component by accessible role / label / text; Cypress covers the journey it participates in.
3. **Storybook** — every new UI primitive has stories spanning at least the state variants it
   defines (idle / focused / active / disabled / maximized / minimized / open / closed where
   applicable).
4. **Tokens** — zero raw color, shadow, blur, gradient, or radius literals in component CSS
   Modules; every value is a `var(--w7-*)` reference; new tokens defined in `globals.css`.
5. **A11y** — keyboard activation works for every interactive element; `:focus-visible` chrome
   is present; ARIA roles / labels on icons, context menus, and window controls; tested via
   manual keyboard sweep at minimum.
6. **Lint + build** — `npm run lint`, `npm run build`, and `npm run build-storybook` all green;
   ESLint `no-console` and `curly` rules clean.

The phase is **complete** when all 24 tasks are validated, both test suites are green locally
and in CI, the Vercel preview deploy on this branch renders `/desktop` correctly for both
roles, and Task 19's validation report is signed off by the Junior.
