# win7-web-os

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A **Windows 7 desktop environment built with React and Next.js — fork it and make it your own.**

Visitors land on an authentic Win7 Aero Glass login screen at `/win7`, sign in as **Guest** or
**Admin**, and get a working desktop: draggable icons, a full window manager, a Start menu, an
in-desktop Internet Explorer, and a live taskbar clock. The repo is a generic, open-source
template — everything identity-specific lives in one config file so a fork can rebrand it in
minutes.

## Table of Contents

- [Key features](#key-features)
- [Getting started](#getting-started)
- [Make it yours](#make-it-yours)
- [Architecture overview](#architecture-overview)
- [Tech stack](#tech-stack)
- [Available scripts](#available-scripts)
- [Project layout](#project-layout)
- [License](#license)

## Key features

- **Authentic Windows 7 Aero Glass UI** — frosted-glass surfaces, Segoe UI typography, and a
  fully tokenized design system (no hardcoded colors, shadows, or radii) layered on `7.css`.
- **Dual-role authentication** — Guest (public, session-scoped) and Admin (Supabase Auth,
  JWT-persisted), with server-side route protection via the Next.js proxy.
- **Full window manager** — open, close, minimize, maximize, focus, z-index stacking, and
  viewport boundary clamping, animated via Framer Motion. All state lives in Redux.
- **In-desktop Internet Explorer** — a working browser window with a toolbar, page links,
  address-bar autocomplete, and back/forward history.
- **App-registration pattern** — adding a new "app" window is a union member, a switch case, and
  a registry entry (see [Architecture overview](#architecture-overview)). Two placeholder apps
  (Welcome, Getting Started) demonstrate it.
- **Drag-and-drop desktop** — snap-to-grid icon repositioning via `@dnd-kit`; window dragging
  uses raw `pointermove` for pixel-perfect control.
- **Reusable Windows 7 UI kit** — 25+ Win7 primitives (buttons, tabs, tree view, menus, sliders,
  scrollbars, and more), ready to compose into new apps.
- **Zero-cost infrastructure** — a Supabase free-tier project is the only external dependency;
  deploy the Next.js app anywhere you like.

## Getting started

### Prerequisites

- **Node.js 20+**
- **npm** (the lockfile is npm-format)
- A **Supabase** project for Auth (Admin sign-in). Guest mode needs no data — the client is just
  constructed at boot.

### Install

```bash
git clone https://github.com/CadeDuncan0/win7-web-os.git
cd win7-web-os
npm ci
```

### Configure environment

Copy [`.env.example`](.env.example) to `.env.local` and fill in your Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_ADMIN_EMAIL=<admin-account-email>
```

> Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never prefix
> server-only secrets (e.g. service-role keys) with `NEXT_PUBLIC_`. `.env.local` is gitignored;
> mirror these values in your hosting provider's dashboard when you deploy.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the root redirects to `/win7`, the Windows 7
login screen. Sign in as **Guest** to explore.

## Make it yours

This is the one section a forker needs. Identity lives in **one config module**:

**[`src/config/site.ts`](src/config/site.ts)** — your site URL (shown in IE's address bar), the
external links (GitHub / LinkedIn / Source Code in the Start menu and IE home page), and the
"Windows® 7 _____" branding subtitle on the logon screen.

Content beyond identity is plain-data registries next to the components that render them:

| To change…                       | Edit…                                                          |
| -------------------------------- | -------------------------------------------------------------- |
| Desktop icons                    | `src/components/screens/desktop/desktopIcons.ts`               |
| Start Menu shortcuts             | `src/components/screens/desktop/StartMenu/startMenuItems.ts`   |
| Pages inside Internet Explorer   | `src/components/screens/desktop/InternetExplorer/ieRoutes.ts`  |
| Legacy-path redirects to `/win7` | the `legacyRedirects` list in `next.config.ts`                 |
| Wallpapers / icons / avatars     | `public/assets/` (paths registered in `src/lib/assetPaths.ts`) |

To add a whole new app window, see the [Architecture overview](#architecture-overview) below.

The intended model: keep your fork private with this repo as an `upstream` remote, put your
personal content in the registries above, and `git fetch upstream && git merge upstream/main` to
pick up template improvements.

## Architecture overview

```text
[ Browser ]
    |
[ Next.js + React ]   — /win7 (logon) and /win7/desktop routes; legacy paths redirect
    |                   src/proxy.ts gates /win7/desktop server-side (Supabase session or guest cookie)
[ Supabase ]          — Auth for the Admin account only; Guest is a client-side role assertion
[ Redux Toolkit ]     — windowSlice (window manager), sessionSlice (auth), desktopSlice (icons)
[ CSS Modules ]       — scoped per component; Aero Glass design tokens in globals.css over 7.css
```

**The window manager** is `windowSlice` (open/close/focus/minimize/maximize/move/resize with
z-index promotion) plus `WindowManager`, which renders each visible window, and `WindowWrapper`,
which supplies the OS chrome (title bar, controls, drag/resize) around any app content.

**Adding an app** is three small steps — the Welcome window is a minimal worked example:

1. Add your kind to the `WindowKind` union in `src/store/slices/windowSlice.ts`.
2. Render it: add a case in `src/components/screens/desktop/WindowManager/WindowManager.tsx`
   returning your component (wrap content in `WindowWrapper` for the OS chrome), and give it a
   taskbar icon/label in `src/components/screens/desktop/Taskbar/taskbarApps.ts`.
3. Launch it: add entries to `desktopIcons.ts` and/or `startMenuItems.ts` with your kind.

A few intentional constraints worth calling out:

- **`src/app/layout.tsx` stays a pure server component.** All client context lives in a single
  `ReduxProviderWrapper`, which mints one store per request via a `setupStore()` factory (no
  module singleton — SSR passes never share state across requests).
- **Two dragging problems, two solutions.** Icons use `@dnd-kit` with snap-to-grid; windows use
  raw `pointermove` with boundary clamping and z-index promotion.
- **Design tokens only.** Every color, shadow, blur, gradient, and radius is a CSS custom
  property in `src/app/globals.css` — component stylesheets reference tokens, never literals.

## Tech stack

| Layer       | Technology                                                            |
| ----------- | --------------------------------------------------------------------- |
| Framework   | Next.js (App Router) + React 19 + TypeScript (`strict`)               |
| State       | Redux Toolkit (typed `useAppDispatch` / `useAppSelector`)             |
| Styling     | CSS Modules + Aero Glass design tokens in `globals.css`, over `7.css` |
| Animation   | Framer Motion (`AnimatePresence`, layout animations)                  |
| Drag & drop | `@dnd-kit` (icons only — window dragging uses raw `pointermove`)      |
| Validation  | Zod                                                                   |
| Auth        | Supabase Auth (Admin); cookie-marked Guest sessions                   |

## Available scripts

| Script          | Purpose                                    |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Start the Next.js dev server               |
| `npm run build` | Production build (also runs type-checking) |
| `npm run start` | Run the production server                  |

## Project layout

```text
src/
  app/                    App Router: /win7 (logon), /win7/desktop, layout, globals.css
  components/
    providers/            Client context providers (ReduxProviderWrapper, AuthListener)
    screens/
      login/              Logon screen (AccountSelection, SignIn)
      desktop/            Desktop, IconGrid, Taskbar, StartMenu, WindowManager,
                          InternetExplorer, WelcomeWindow
      transition/         Boot / welcome transition
    windows7/             Reusable Windows 7 primitives built on 7.css
  config/
    site.ts               ★ Fork configuration — start here to make it yours
  hooks/                  Shared React hooks (auth listener, dnd-kit sensors)
  lib/
    supabase/             Supabase clients (browser, server, proxy)
  store/
    index.ts              setupStore factory + RootState / AppDispatch exports
    hooks.ts              Typed useAppDispatch / useAppSelector
    slices/               One file per Redux domain slice (window, session, desktop)
  proxy.ts                Next.js route protection for /win7/desktop
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to fork, where content goes, and coding
conventions. Bug reports and suggestions are welcome via
[GitHub Issues](https://github.com/CadeDuncan0/win7-web-os/issues).

## License

Released under the [MIT License](LICENSE).
