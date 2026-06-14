# Portfolio Website — Windows 7 Theme

[![CI](https://github.com/CadeDuncan/PortfolioWebsite-Windows7/actions/workflows/ci.yml/badge.svg)](https://github.com/CadeDuncan/PortfolioWebsite-Windows7/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)

A personal portfolio website implemented as a fully functional, browser-rendered recreation of
the **Windows 7 Aero Glass** desktop environment. Visitors land on an authentic Win7 login
screen, sign in as **Guest** or **Admin**, and explore portfolio content as openable desktop
windows — complete with draggable icons, a window manager, and a live taskbar clock.

## Why this project

This portfolio is engineered to serve two audiences simultaneously:

- **Hiring teams** evaluating full-stack engineering capability — every architectural choice is
  intentional, documented, and defensible in a technical interview.
- **Portfolio visitors** experiencing the work as a nostalgic, interactive desktop.

### Key features

- **Authentic Windows 7 Aero Glass UI** — frosted glass surfaces, Segoe UI typography, and a
  fully tokenized design system (no hardcoded colors, shadows, or radii).
- **Dual-role authentication** — Guest (public, session-scoped) and Admin (JWT-persisted,
  unlocks private project windows).
- **Window manager** — open, close, minimize, maximize, focus, z-index stacking, and boundary
  clamping; animated via Framer Motion.
- **Drag-and-drop desktop icons** — snap-to-grid repositioning via `@dnd-kit`.
- **Repo-resident content** — project data lives in the repo as a typed registry + MDX/React
  bodies (single source of truth, version-controlled); the resume PDF is served from Supabase
  Storage. Role-based visibility (Guest vs Admin/WIP) is filtered by session role.
- **Zero-cost infrastructure** — runs entirely on free tiers (Vercel, Supabase, GitHub).

## Architecture at a glance

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
[ CSS Modules ]            — scoped per-component; Aero Glass design tokens
```

See [CLAUDE.md](CLAUDE.md) for the full architectural thesis, design rationale, and
anti-patterns.

### Tech stack

| Layer         | Technology                                                         |
| ------------- | ------------------------------------------------------------------ |
| Framework     | Next.js (App Router) + React + TypeScript (`strict`)               |
| State         | Redux Toolkit (typed `useAppDispatch` / `useAppSelector`)          |
| Styling       | CSS Modules + Aero Glass design tokens in `globals.css`            |
| Animation     | Framer Motion (`AnimatePresence`, layout animations)               |
| Drag & drop   | `@dnd-kit` (icons only — window dragging uses raw `pointermove`)   |
| Content       | Repo-resident typed registry + MDX/React bodies (project data)     |
| Auth + Files  | Supabase Auth + Storage (resume PDF); Postgres/RLS for future use  |
| Testing       | Jest + React Testing Library, Vitest, Playwright, Storybook + a11y |
| Tooling       | ESLint flat config, Prettier, Husky, commitlint, lint-staged       |
| CI / Hosting  | GitHub Actions → Vercel (Hobby tier)                               |
| Local runtime | Docker (parity environment; host Node.js is the primary dev shell) |

## Getting started

### Prerequisites

- **Node.js 20** (matches the Dockerfile base image and CI runner)
- **npm** (lockfile is npm-format)
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
> server-only secrets (e.g. service-role keys) with `NEXT_PUBLIC_`.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should land on the Windows 7 login
screen.

### Optional: run via Docker

```bash
docker compose up --build
```

Docker is provided for production-parity validation. Day-to-day development should use host
Node.js so Cursor/VS Code extensions (ESLint, Prettier, TS server) work correctly.

## Available scripts

| Script                    | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `npm run dev`             | Start the Next.js dev server                       |
| `npm run dev:docker`      | Dev server with Webpack (for container hot reload) |
| `npm run build`           | Production build                                   |
| `npm run start`           | Run the production server                          |
| `npm run lint`            | ESLint (flat config, `--max-warnings=0` in CI)     |
| `npm run test`            | Jest unit + integration tests                      |
| `npm run storybook`       | Launch Storybook on port 6006                      |
| `npm run build-storybook` | Build a static Storybook bundle                    |

## Project layout

```
src/
  app/                    Next.js App Router pages and layouts
  components/
    foundations/          Shared design-system primitives (e.g. GlassSurface)
    login/                Login-screen components
    providers/            Client-side context provider wrappers
  hooks/                  Custom React hooks
  content/                Repo-resident project data: typed registry + MDX/React bodies
  lib/                    Third-party client initializations and shared utilities
    debug.ts                NODE_ENV-aware debug logger
    supabase/               Supabase clients (auth only)
  store/
    index.ts              Redux store + RootState / AppDispatch exports
    hooks.ts              Typed useAppDispatch / useAppSelector
    slices/               One file per Redux domain slice
  proxy.ts                Next.js middleware (route protection)
```

## Quality gates

- **Pre-commit** — `lint-staged` runs `eslint --fix --max-warnings=0` and `prettier --write`
  on staged `.ts` / `.tsx` / `.css` files.
- **commit-msg** — commitlint enforces
  [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`,
  `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `revert`).
- **CI** — every PR runs lint → format check → production build on Node 20.

Bypassing these gates (`--no-verify`, ignoring warnings) is not permitted — investigate the
root cause instead.

## Roadmap

| Phase | Scope                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------ |
| 0     | Environment & infrastructure: Next.js, Redux, Supabase, Docker, CI/CD, Vercel — **complete**           |
| 1     | Design tokens + pixel-perfect login screen, Guest/Admin auth, route protection — **in progress**       |
| 2     | Desktop environment, icon grid, full window manager, taskbar with live clock                           |
| 3     | Portfolio content: repo content layer, ResumeWindow (Storage PDF), ProjectsWindow, ProjectDetailWindow |
| 4     | Polish, performance (Lighthouse 90+), a11y audit, cross-browser validation, `v1.0.0` launch            |

Phase task documents live under [`.claude/phases/`](.claude/phases/).

## Getting help

- **Architecture & conventions:** [CLAUDE.md](CLAUDE.md) — full project thesis, stack rationale,
  and anti-patterns.
- **Pair-programming protocol:** [AGENTS.md](AGENTS.md) — how AI assistants are scoped on this
  repo.
- **Issues:** open a [GitHub issue](https://github.com/CadeDuncan/PortfolioWebsite-Windows7/issues)
  with reproduction steps and environment details.

## Maintainer

- **Cade Duncan** — [cadeduncan72@gmail.com](mailto:cadeduncan72@gmail.com)

Contributions are not actively solicited (this is a personal portfolio), but bug reports and
suggestions are welcome via GitHub Issues.

## License

Released under the [MIT License](LICENSE).
