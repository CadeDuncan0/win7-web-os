# Portfolio Website — Windows 7 Theme

[![CI](https://github.com/CadeDuncan/PortfolioWebsite-Windows7/actions/workflows/ci.yml/badge.svg)](https://github.com/CadeDuncan/PortfolioWebsite-Windows7/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A personal portfolio website implemented as a fully functional, browser-rendered recreation of
the **Windows 7 Aero Glass** desktop environment. Visitors land on an authentic Win7 login
screen, sign in as **Guest** or **Admin**, and explore portfolio content as openable desktop
windows — complete with draggable icons, a window manager, a Start menu, and a live taskbar
clock.

## Table of Contents

- [Why this project](#why-this-project)
- [Key features](#key-features)
- [Architecture at a glance](#architecture-at-a-glance)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project layout](#project-layout)
- [Quality gates](#quality-gates)
- [Roadmap](#roadmap)
- [Author](#author)
- [License](#license)

## Why this project

This portfolio is engineered to serve two audiences simultaneously:

- **Hiring teams** evaluating full-stack engineering capability — every architectural choice is
  intentional, documented, and defensible in a technical interview.
- **Portfolio visitors** experiencing the work as a nostalgic, interactive desktop.

## Key features

- **Authentic Windows 7 Aero Glass UI** — frosted-glass surfaces, Segoe UI typography, and a
  fully tokenized design system (no hardcoded colors, shadows, or radii) layered on `7.css`.
- **Dual-role authentication** — Guest (public, session-scoped) and Admin (Supabase Auth,
  JWT-persisted), with Admin unlocking private/WIP content the public never sees.
- **Full window manager** — open, close, minimize, maximize, focus, z-index stacking, and
  viewport boundary clamping, animated via Framer Motion. All state lives in Redux.
- **In-desktop Internet Explorer** — a working browser window with a toolbar, favorites bar,
  address routing, and internal (`portfolio://`) plus external page handling.
- **Drag-and-drop desktop** — snap-to-grid icon repositioning via `@dnd-kit`; window dragging
  uses raw `pointermove` for pixel-perfect control.
- **Reusable Windows 7 UI kit** — 25+ Win7 primitives (buttons, tabs, tree view, menus, sliders,
  scrollbars, and more), each developed in isolation with a Storybook story.
- **Zero-cost infrastructure** — runs entirely on free tiers (Vercel, Supabase, GitHub).

## Architecture at a glance

```text
[ Browser ]
    |
[ Next.js + React ]        — rendering, routing, server/client component split
    |
[ Supabase ]               — Auth (sign-in) + Storage (resume PDF) only.
                             Postgres + RLS reserved for future per-user data.

[ Repo content layer ]     — typed project registry + MDX/React bodies: the single
                             source of truth for project data, compiled with the app
[ Redux Toolkit ]          — horizontal across the React layer; in-memory UI state only
[ CSS Modules ]            — scoped per component; Aero Glass design tokens
```

A few intentional constraints worth calling out:

- **`src/app/layout.tsx` stays a pure server component.** All client context lives in a single
  `ReduxProviderWrapper`, which mints one store per request via a `setupStore()` factory (no
  module singleton — SSR passes never share state across requests).
- **Project data is repo-resident, not database-backed.** Supabase is used _only_ for auth and
  résumé storage; there is no relational data client for portfolio content.
- **Two dragging problems, two solutions.** Icons use `@dnd-kit` with snap-to-grid; windows use
  raw `pointermove` with boundary clamping and z-index promotion.

See [CLAUDE.md](CLAUDE.md) for the full architectural thesis, design rationale, and anti-patterns.

### Tech stack

| Layer        | Technology                                                                             |
| ------------ | -------------------------------------------------------------------------------------- |
| Framework    | Next.js (App Router) + React 19 + TypeScript (`strict`)                                |
| State        | Redux Toolkit (typed `useAppDispatch` / `useAppSelector`)                              |
| Styling      | CSS Modules + Aero Glass design tokens in `globals.css`, over `7.css`                  |
| Animation    | Framer Motion (`AnimatePresence`, layout animations)                                   |
| Drag & drop  | `@dnd-kit` (icons only — window dragging uses raw `pointermove`)                       |
| Validation   | Zod                                                                                    |
| Auth + Files | Supabase Auth + Storage (résumé PDF); Postgres/RLS for future use                      |
| Testing      | Vitest + React Testing Library (unit/component), Cypress (E2E), Storybook + a11y addon |
| Tooling      | ESLint flat config, Prettier, Husky, commitlint, lint-staged                           |
| CI / Hosting | GitHub Actions → Vercel (Hobby tier)                                                   |

## Getting started

### Prerequisites

- **Node.js 20** (matches the CI runner)
- **npm** (the lockfile is npm-format)
- A **Supabase** project for Auth + Storage (see [CLAUDE.md](CLAUDE.md#supabase)). No `projects`
  table is required — project data is repo-resident.

### Install

```bash
git clone https://github.com/CadeDuncan/PortfolioWebsite-Windows7.git
cd PortfolioWebsite-Windows7
npm ci
```

### Configure environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_ADMIN_EMAIL=<admin-account-email>
```

> Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never prefix
> server-only secrets (e.g. service-role keys) with `NEXT_PUBLIC_`. `.env.local` is gitignored;
> mirror these values in the Vercel dashboard and GitHub Secrets for deploys.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should land on the Windows 7 login
screen. Sign in as **Guest** to explore.

> A `docker-compose.yml` is also provided for a production-parity runtime. Day-to-day development
> should use host Node.js so editor extensions (ESLint, Prettier, TS server) work correctly.

## Available scripts

| Script                    | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `npm run dev`             | Start the Next.js dev server                       |
| `npm run dev:docker`      | Dev server with Webpack (for container hot reload) |
| `npm run build`           | Production build (also runs type-checking)         |
| `npm run start`           | Run the production server                          |
| `npm run lint`            | ESLint (flat config, `--max-warnings=0` in CI)     |
| `npm run test`            | Vitest unit + component tests                      |
| `npm run test:watch`      | Vitest in watch mode                               |
| `npm run storybook`       | Launch Storybook on port 6006                      |
| `npm run build-storybook` | Build a static Storybook bundle                    |
| `npm run cypress:open`    | Open the Cypress E2E runner                        |
| `npm run e2e`             | Run the Cypress E2E suite headlessly               |

## Project layout

```text
src/
  app/                    App Router pages (login, desktop), layout, globals.css
  components/
    providers/            Client context providers (ReduxProviderWrapper, AuthListener)
    screens/
      login/              Login screen (AccountSelection, SignIn)
      desktop/            Desktop, IconGrid, Taskbar, StartMenu, WindowManager, InternetExplorer
      Transition/         Boot / welcome transition
    windows7/             Reusable Windows 7 primitives built on 7.css (+ Storybook stories)
  content/                (Phase 3) repo-resident project registry + MDX/React bodies
  hooks/                  Shared React hooks (auth listener, dnd-kit sensors)
  lib/
    supabase/             Supabase clients (auth + storage)
    debug.ts              NODE_ENV-aware debug logger
  store/
    index.ts              setupStore factory + RootState / AppDispatch exports
    hooks.ts              Typed useAppDispatch / useAppSelector
    slices/               One file per Redux domain slice (window, session, desktop)
  test-utils/             renderWithProviders and shared test helpers
  proxy.ts                Next.js route protection for /desktop
```

## Quality gates

- **Pre-commit** — `lint-staged` runs `eslint --fix --max-warnings=0` and `prettier --write`
  on staged files.
- **commit-msg** — commitlint enforces
  [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`,
  `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `revert`).
- **CI** — every PR runs **lint → format check → unit tests → production build** on Node 20.

Bypassing these gates (`--no-verify`, ignoring warnings) is not permitted — investigate the
root cause instead.

## Roadmap

| Phase | Scope                                                                                         | Status         |
| ----- | --------------------------------------------------------------------------------------------- | -------------- |
| 0     | Environment & infrastructure: Next.js, Redux, Supabase, Docker, CI/CD, Vercel                 | ✅ Complete    |
| 1     | Aero Glass design tokens + pixel-perfect login screen, Guest/Admin auth, route protection     | ✅ Complete    |
| 2     | Desktop environment, icon grid, full window manager, Start menu, taskbar with live clock      | ✅ Complete    |
| 3     | Portfolio content: repo content layer, résumé viewer (Storage PDF), projects gallery + detail | 🚧 In progress |
| 4     | Polish, performance (Lighthouse 90+), a11y audit, cross-browser validation, `v1.0.0` launch   | ⏳ Planned     |

> The résumé and projects windows currently render placeholders pending the Phase 3 content
> layer. The Cypress E2E suite is written but its CI job is temporarily disabled.

Phase task documents live under [`.claude/phases/`](.claude/phases/), and supporting design
notes under [`.claude/docs/`](.claude/docs/).

## Author

**Cade Duncan**

- GitHub — [@CadeDuncan](https://github.com/CadeDuncan)
- LinkedIn — [cade-duncan](https://linkedin.com/in/cade-duncan)
- Email — [cadeduncan72@gmail.com](mailto:cadeduncan72@gmail.com)

Contributions are not actively solicited (this is a personal portfolio), but bug reports and
suggestions are welcome via [GitHub Issues](https://github.com/CadeDuncan/PortfolioWebsite-Windows7/issues).

## License

Released under the [MIT License](LICENSE).
