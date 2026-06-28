# PROJECT_CORE_THESIS

**A personal portfolio website architecturally implemented as a fully functional browser-rendered recreation of the Windows 7 operating system.**

## Core Product Behavior

- Visitors land on an authentic Windows 7 login screen
- Two accounts exist: Guest (public, no password) and Admin (owner-only, password-gated)
- Post-login: a Windows 7 Aero Glass desktop environment with draggable icons, a window manager,
  and a taskbar with live clock
- Portfolio content (projects, resume) surfaces as openable desktop internet explorer windows

## Tech Stack

\* Reference dependency versions in `package.json` and `package-lock.json` before making version-specific decisions

\* No version numbers appear in this file intentionally. If a version number is present
elsewhere in this document, it is stale — delete it and defer to `package.json`.

\* Stack behavior described here reflects latest stable at time of last edit.
Always verify against installed versions before acting on any API or convention described below.

| Technology              | Role                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| Next.js 16 (App Router) | Core framework — SSR, API routes, and file-based routing               |
| TypeScript              | Type safety enforced across every layer of the application             |
| Redux Toolkit           | Global state management for the desktop, windows, and session          |
| CSS Modules             | Scoped component styling with a centralized Aero Glass token system    |
| Framer Motion           | Declarative animations for window transitions and desktop interactions |
| @dnd-kit                | Drag-and-drop for desktop icon repositioning with grid snapping        |
| GraphQL                 | Query language for structured, typed data fetching from Supabase       |
| Postman                 | API platform used to create GraphQL requests                           |
| Supabase                | Managed PostgreSQL database, authentication, and file storage          |
| Jest                    | Unit and integration test runner for logic and component behavior      |
| React Testing Library   | Component testing against user behavior rather than implementation     |
| Cypress                 | End-to-end testing covering complete Guest and Admin user journeys     |
| Storybook               | Isolated component development and living UI documentation             |
| Docker                  | Containerized local development environment for reproducibility        |
| GitHub Actions          | CI/CD pipeline — lint, format, build, and deploy on every merge        |
| Vercel                  | Production hosting with automatic Git-based deployments                |
