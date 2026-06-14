# Phase 1 — Design System & Login Screen

**Status:** `complete`

**Start Date:** 04-16-2026

**End Date:** 05-28-2026

---

## Flags

| Flag            | Value          |
| --------------- | -------------- |
| Phase           | 1              |
| Status          | complete       |
| Tasks Complete  | 11 / 11        |
| Blocking Issues | None           |
| Current Task    | Phase Complete |

---

## Goal

Establish the complete Aero Glass design token system in `globals.css`, stand up Storybook as the
isolated component development environment, and deliver a pixel-perfect, fully functional Windows 7
login screen. Both authentication flows — Guest (sessionStorage-scoped, no password) and Admin
(Supabase Auth, JWT-persisted) — are wired end-to-end from the login UI through Redux
`sessionSlice` to Apollo's auth link and Next.js edge Proxy. Phase 1 is complete when a
visitor can land on the login screen, sign in as Guest or Admin, receive the correct role and
session persistence model, and be routed to `/desktop` — with Apollo GraphQL requests carrying the
correct authorization header for each role and `/desktop` blocked from unauthenticated access at
the edge.

---

## Non-Goals

- **Desktop environment and window manager.** The post-login UI — icons, windows, taskbar,
  z-index management — is Phase 2. Phase 1 terminates at the `/desktop` route's protected boundary;
  the page itself may be a placeholder.
- **Live portfolio data.** GraphQL queries against `public.projects`, thumbnail fetching, and
  visibility filtering are Phase 3. Apollo's auth link must be correct in Phase 1, but no feature
  code consumes it yet.
- **Production RLS policies.** Phase 0's permissive dev read policy (`USING (true)`) remains in
  place. Role-based RLS is a Phase 3 concern driven by the actual query surface.
- **End-to-end tests.** Cypress is introduced in Phase 2 once the desktop flow gives it meaningful
  assertions. Phase 1 validation is manual — a full checklist sweep.
- **Public user registration.** Two fixed accounts exist: Guest and Admin. No signup flow, no
  password reset flow, no account management UI.

---

## Key Decisions

| Decision                                                  | Rationale                                                                                                                                                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storybook-first UI development                            | Every primitive is validated in isolation before page-level composition — catches token drift, state variants, and accessibility gaps that integration tests miss                                         |
| CSS Modules over Tailwind                                 | Aero Glass requires named, intentional design decisions; utility classes would fragment the token system and obscure the design intent in markup                                                          |
| All design tokens centralized in `globals.css`            | Single source of truth — component stylesheets reference custom properties only. Prevents magic values from metastasizing through the codebase                                                            |
| Guest session in `sessionStorage`, Admin via Supabase JWT | Matches the product semantics: Guest is a transient viewing mode that resets on tab close; Admin is a persistent authenticated identity managed by Supabase's native session lifecycle                    |
| Supabase JS SDK is auth-only                              | Strict boundary: `supabase.auth.*` methods only. Data fetching is exclusively through Apollo + GraphQL — no `supabase.from()` queries anywhere in the codebase                                            |
| Apollo auth link reads JWT from Redux                     | Single source of truth for auth state. The link subscribes to the store so the `Authorization` header swaps from anon key to Admin JWT the moment a sign-in completes, with no request-level coordination |
| Next.js Proxy for route protection                        | Runs at the edge before rendering — eliminates the flash-of-protected-content a client-side `useEffect` guard cannot prevent, and keeps `/desktop` unreachable to unauthenticated browsers                |

---

## Tooling

| Tool                                | Purpose                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| CSS Modules + CSS Custom Properties | Scoped component styling with centralized Aero Glass token system                 |
| Storybook                           | Isolated component development environment and living design system documentation |
| Supabase Auth                       | Email provider for Admin identity and JWT issuance                                |
| `@supabase/supabase-js`             | `signInWithPassword`, `signOut`, `onAuthStateChange` client methods               |
| Redux Toolkit (`sessionSlice`)      | Global auth state — role, authStatus, JWT, session origin                         |
| Apollo Client (`SetContextLink`)    | Dynamic auth header injection; subscribes to Redux store                          |
| React hooks                         | `useAuthListener` — bridges Supabase auth events into Redux                       |
| Next.js Proxy                       | Edge-level route protection reading Supabase session cookie                       |
| Framer Motion                       | Login screen entrance, account-tile selection, and transition animations          |

---

## Tasks

| #   | Task                                     | Tooling                                     | Deliverable                                                                                                                                                                                                                                                                | Status      |
| --- | ---------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Enable Supabase Auth Provider            | Supabase Dashboard                          | Email provider on; public sign-ups off; redirect URLs configured; admin user created                                                                                                                                                                                       | ✅ Complete |
| 2   | Create Auth Utility Module               | `@supabase/supabase-js` · TypeScript        | `src/lib/auth.ts` — typed `signInAsAdmin`, `signInAsGuest`, `signOut`, `getCurrentSession` helpers with discriminated return types                                                                                                                                         | ✅ Complete |
| 3   | Implement Session Slice Logic            | Redux Toolkit · TypeScript                  | `setSession`, `clearSession` reducers; typed selectors `selectRole`, `selectAuthStatus`, `selectJwt`; session shape finalized                                                                                                                                              | ✅ Complete |
| 4   | Build Auth State Listener Hook           | React · Supabase · Redux                    | `useAuthListener` — subscribes to `supabase.auth.onAuthStateChange`, dispatches session updates, handles Guest sessionStorage rehydration                                                                                                                                  | ✅ Complete |
| 5   | Wire Dynamic JWT into Apollo Auth Link   | Apollo Client · Redux                       | `authLink` reads JWT from Redux store on every request; anon key fallback when unauthenticated; verified via DevTools Network tab                                                                                                                                          | ✅ Complete |
| 6   | Establish Aero Glass Design Token System | CSS Modules · CSS Custom Properties         | `globals.css` defines full token scales — color, typography, glass (blur + gradient), shadow, radius, spacing; typography hierarchy enforced (Georgia 16pt / Georgia 13pt / Arial 12pt)                                                                                    | ✅ Complete |
| 7   | Configure Storybook                      | Storybook · Next.js · CSS Modules           | Storybook installed, running on port 6006; global decorator applies `globals.css`; Next.js App Router compatibility configured                                                                                                                                             | ✅ Complete |
| 8   | Build Login Screen Primitives            | React · CSS Modules · Storybook             | `AccountTile`, `PasswordInput`, `SignInButton` components — each with Storybook stories covering all state variants (default, focus, error, disabled)                                                                                                                      | ✅ Complete |
| 9   | Assemble Login Screen Page               | React · CSS Modules · Framer Motion · Redux | `/login` route — authentic Windows 7 background, two account tiles (Guest + Admin), password gate on Admin selection, entrance and selection animations; Guest click dispatches session and routes to `/desktop`, Admin submit calls `signInAsAdmin` and routes on success | ✅ Complete |
| 10  | Add Route Protection Proxy               | Next.js Proxy · Supabase                    | `proxy.ts` — intercepts `/desktop/*` requests; reads Supabase session cookie and Guest sessionStorage signal; redirects unauthenticated traffic to `/login` before render                                                                                                  | ✅ Complete |
| 11  | Validate Phase 1                         | All Phase 1 tooling                         | Full integration sweep: Guest flow, Admin sign-in, session persistence across reload, JWT in Apollo requests, `/desktop` protection, Storybook green, design token coverage audit                                                                                          | ✅ Complete |

---
