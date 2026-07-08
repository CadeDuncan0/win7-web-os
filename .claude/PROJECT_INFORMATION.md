# PROJECT_CORE_THESIS

**win7-web-os: an open-source, forkable Windows 7 desktop environment that runs in the browser,
built with React and Next.js.**

This repo is a public, generic scaffold. Forks personalize it through a single config location
(`src/config/site.ts`) and the plain-data registries it documents; a separate private repo (forked
from this one) holds any owner-specific content and deployment.

## Core Product Behavior

- Visitors land on an authentic Windows 7 login screen at the canonical `/win7` route
- Two accounts exist: Guest (public, no password) and Admin (password-gated via Supabase)
- Post-login (`/win7/desktop`): a Windows 7 Aero Glass desktop environment with draggable icons,
  a window manager, and a taskbar with live clock
- Placeholder apps (Internet Explorer with Home/Getting Started pages, a Welcome window)
  demonstrate the app-registration pattern a fork extends
- Legacy paths (`/`, `/hub`, `/login`, `/desktop`) redirect to `/win7` via an extensible list in
  `next.config.ts`

## Tech Stack

\* Reference dependency versions in `package.json` and `package-lock.json` before making version-specific decisions

\* No version numbers appear in this file intentionally. If a version number is present
elsewhere in this document, it is stale — delete it and defer to `package.json`.

\* Stack behavior described here reflects latest stable at time of last edit.
Always verify against installed versions before acting on any API or convention described below.

| Technology            | Role                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| Next.js               | Core framework — SSR, file-based routing, and the `proxy` auth gate    |
| TypeScript            | Type safety enforced across every layer of the application             |
| Redux Toolkit         | Global state management for the desktop, windows, and session          |
| CSS Modules           | Scoped component styling with a centralized Aero Glass token system    |
| Framer Motion         | Declarative animations for window transitions and desktop interactions |
| @dnd-kit              | Drag-and-drop for desktop icon repositioning with grid snapping        |
| Supabase              | Managed PostgreSQL database, authentication, and file storage          |
| Vitest                | Unit and integration test runner for logic and component behavior      |
| React Testing Library | Component testing against user behavior rather than implementation     |
| Cypress               | End-to-end testing covering complete Guest and Admin user journeys     |
| Storybook             | Isolated component development and living UI documentation             |
| Docker                | Containerized local development environment for reproducibility        |
| GitHub Actions        | CI/CD pipeline — lint, format, build, and deploy on every merge        |
| Vercel                | Production hosting with automatic Git-based deployments                |
