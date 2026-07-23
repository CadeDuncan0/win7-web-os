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
- **Dual-role authentication** — Guest (public, session-scoped) and Admin (a single server-only
  password secret, no external service), with server-side route protection via the Next.js proxy.
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
- **Zero-cost, zero-dependency infrastructure** — no database or external auth service; the only
  secret is the Admin password. Deploy the Next.js app anywhere you like.

## Getting started

### Prerequisites

- **Node.js 20+**
- **npm** (the lockfile is npm-format)

No database or external services are required. Guest mode needs no configuration at all; Admin
sign-in needs only a password you choose.

### Install

```bash
git clone https://github.com/CadeDuncan0/win7-web-os.git
cd win7-web-os
npm ci
```

### Configure environment

Copy [`.env.example`](.env.example) to `.env.local` and set the Admin password:

```env
ADMIN_PASSWORD=<the password for your Admin account>
```

> `ADMIN_PASSWORD` is a **server-only secret** — it has no `NEXT_PUBLIC_` prefix, so it is never
> shipped to the browser. The Admin sign-in form posts the entered password to the `/api/admin`
> route, which compares it server-side and, on success, issues an `httpOnly` session cookie the
> proxy gates on. Leave it unset to disable Admin sign-in (Guest still works). `.env.local` is
> gitignored; set the same value as a secret env var in your hosting provider when you deploy.
> The endpoint has no built-in rate limiting — choose a long, unguessable password and enable
> your host's rate limiting / bot protection if it offers one.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the root serves the Windows 7 login screen
(rewritten to `/win7` without changing the URL). Sign in as **Guest** to explore; the desktop
renders at the same URL.

## Make it yours

This is the one section a forker needs. Everything you would change is plain-data registries
collected in `src/config/`:

| To change…                            | Edit…                                                          |
| ------------------------------------- | -------------------------------------------------------------- |
| Desktop icons                         | `src/config/desktopIcons.ts`                                   |
| Start Menu shortcuts + external links | `src/config/startMenuItems.ts`                                 |
| Pages inside Internet Explorer        | `src/config/ieRoutes.ts`                                       |
| Logon-screen branding subtitle        | the `subtitle` default in `src/components/ui/OsBranding`       |
| Legacy-path redirects to `/win7`      | the `legacyRedirects` list in `next.config.ts`                 |
| Wallpapers / icons / avatars          | `public/assets/` (paths registered in `src/lib/assetPaths.ts`) |

An `ieRoutes.ts` entry with `redirect: true` is an external link: selecting it opens the URL in
a new browser tab while IE shows a redirect page (the Source Code entry is a worked example).

To add a whole new app window, see the [Architecture overview](#architecture-overview) below.

The intended model: keep your fork private with this repo as an `upstream` remote, put your
personal content in the registries above, and `git fetch upstream && git merge upstream/main` to
pick up template improvements.

## Architecture overview

```text
[ Browser ]
    |
[ Next.js + React ]   — /win7 server-renders logon or desktop by session cookie; URL never changes
    |                   / rewrites to /win7; src/proxy.ts gates the /win7/desktop deep link
[ /api/admin ]        — verifies the ADMIN_PASSWORD secret, issues the httpOnly admin cookie
[ Redux Toolkit ]     — windowSlice (window manager), sessionSlice (auth), desktopSlice (icons)
[ CSS Modules ]       — scoped per component; Aero Glass design tokens in globals.css over 7.css
```

**The window manager** is `windowSlice` (open/close/focus/minimize/maximize/move/resize with
z-index promotion) plus `WindowManager`, which renders each visible window, and `WindowWrapper`,
which supplies the OS chrome (title bar, controls, drag/resize) around any app content.

**Adding an app** is two small steps — the Welcome window is a minimal worked example:

1. Build your window component under `src/components/apps/` (wrap content in `WindowWrapper`
   for the OS chrome) and export a `WindowApp` descriptor (its window `kind` + component)
   from the folder's barrel.
2. Register it: add one `Application` record referencing the descriptor in
   `src/config/applications.ts` — the desktop icon, Start Menu shortcut, taskbar meta, and
   window renderer all derive from that one record, and its `key` joins the typed id space
   automatically.

A few intentional constraints worth calling out:

- **`src/app/layout.tsx` stays a pure server component.** All client context lives in a single
  `ReduxProviderWrapper`, which mints one store per request via a `setupStore()` factory (no
  module singleton — SSR passes never share state across requests).
- **Two dragging problems, two solutions.** Icons use `@dnd-kit` with snap-to-grid; windows use
  raw `pointermove` with boundary clamping and z-index promotion.
- **Design tokens only.** Every color, shadow, blur, gradient, and radius is a CSS custom
  property in `src/app/globals.css` — component stylesheets reference tokens, never literals.

## Tech stack

| Layer       | Technology                                                                          |
| ----------- | ----------------------------------------------------------------------------------- |
| Framework   | Next.js (App Router) + React 19 + TypeScript (`strict`)                             |
| State       | Redux Toolkit (typed `useAppDispatch` / `useAppSelector`)                           |
| Styling     | CSS Modules + Aero Glass design tokens in `globals.css`, over `7.css`               |
| Animation   | Framer Motion (`AnimatePresence`, layout animations)                                |
| Drag & drop | `@dnd-kit` (icons only — window dragging uses raw `pointermove`)                    |
| Validation  | Zod                                                                                 |
| Auth        | Server-only `ADMIN_PASSWORD` secret + httpOnly cookie; cookie-marked Guest sessions |

## Available scripts

| Script          | Purpose                                    |
| --------------- | ------------------------------------------ |
| `npm run dev`   | Start the Next.js dev server               |
| `npm run build` | Production build (also runs type-checking) |
| `npm run start` | Run the production server                  |

## Project layout

```text
src/
  app/                    App Router: /win7 (logon/desktop switch), /win7/desktop, layout, globals.css
    api/admin/            Route handler: POST verifies the password, DELETE signs out
  components/
    apps/                 Window content (InternetExplorer, WelcomeWindow)
    providers/            Client context providers (ReduxProviderWrapper, AuthListener)
    screens/
      login/              Logon screen (AccountSelection, SignIn)
      desktop/            DesktopScreen — composes the shell into the desktop page
      transition/         Boot / welcome transition
    shell/                OS shell (Desktop, IconGrid, Taskbar, StartMenu,
                          WindowManager, WindowWrapper)
    ui/                   Reusable Windows 7 primitives built on 7.css
  config/                 Fork configuration: plain-data registries (applications,
                          ieRoutes, notifications)
  hooks/                  Shared React hooks (auth listener, dnd-kit sensors)
  lib/
    adminAuth.ts          Server-side password check + httpOnly cookie token (route + proxy)
    auth.ts               Client auth orchestration (guest / admin sign-in, sign-out, rehydrate)
    adminSession.ts       Client Admin session marker; guestSession.ts is its Guest counterpart
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
