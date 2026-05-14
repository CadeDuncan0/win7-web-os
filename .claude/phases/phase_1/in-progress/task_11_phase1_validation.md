# 🎯 Task 11: Phase 1 Validation

---

## 🧠 Engineering Context & Rationale

### Why a Dedicated Validation Task Exists

Tasks 1–10 each delivered one slice of the Phase 1 surface area — Supabase Auth wiring,
the session slice, the auth listener, Apollo's JWT-aware auth link, the Aero Glass token
system, Storybook, the login primitives, the assembled login page, and finally the edge
proxy that gates `/desktop`. Every one of those tasks was validated in isolation. None of
them proves the seams hold under composition.

A login UI that renders pixel-perfect in Storybook may still dispatch the wrong action
shape when wired to the real reducer. A reducer that passes its unit tests may still
leave `selectJwt(state)` returning `null` after a real Admin sign-in because the
`onAuthStateChange` handler never fired. A proxy that compiles cleanly may still let an
unauthenticated request through to `/desktop` because the cookie name on disk and the
constant the proxy reads have silently diverged. Storybook may build but reveal that a
component leaked a `#0078d7` literal that should have been `var(--aero-accent)`.

This task is the **full-stack integration sweep** for Phase 1. It is not about building
anything new — it is about systematically verifying that every Phase 1 deliverable still
works **together**, end-to-end, in both Guest and Admin paths. Pass criteria for every
check below are exact and observable. Ambiguous checks are worthless checks.

### The Validation Order Matters

Checks are ordered by dependency depth — static analysis (typecheck, lint, format)
before runtime (build, dev server) before interaction (browser flows). A failure in
an early check invalidates every later check. Fix in order; do not skip ahead.

### What "Passing" Means

Each check specifies what command to run (or what to click), what string or behavior
must appear, and what failure indicates. ✅ means the check was personally observed —
not assumed from a previous task.

---

## 🛠️ Step-by-Step Validation

### Validation 1 — Deliverable Inventory

Confirm every Phase 1 deliverable exists at its expected path.

| #   | Path                                          | Purpose                              |
| --- | --------------------------------------------- | ------------------------------------ |
| 1   | `src/lib/auth.ts`                             | Task 2 — auth utility module         |
| 2   | `src/store/slices/sessionSlice.ts`            | Task 3 — session reducer + selectors |
| 3   | `src/hooks/useAuthListener.ts`                | Task 4 — Supabase → Redux bridge     |
| 4   | `src/lib/apollo-client.ts`                    | Task 5 — JWT-aware auth link         |
| 5   | `src/app/globals.css`                         | Task 6 — Aero Glass tokens           |
| 6   | `.storybook/` config + stories                | Task 7 — Storybook configured        |
| 7   | `src/components/login/AccountTile/`\*         | Task 8 — primitive + story           |
| 8   | `src/components/login/PasswordInput/*`        | Task 8 — primitive + story           |
| 9   | `src/components/login/SignInButton/*`         | Task 8 — primitive + story           |
| 10  | `src/app/login/page.tsx` + `Login.module.css` | Task 9 — assembled login page        |
| 11  | `src/proxy.ts` + `src/lib/supabase/proxy.ts`  | Task 10 — edge route protection      |

**Pass criteria:** Every path exists, every component directory contains `.tsx`,
`.module.css`, and `.stories.tsx`.

**Failure indicates:** A prior task left a partial deliverable.

### Validation 2 — TypeScript Compiles With Zero Errors

```powershell
npx tsc --noEmit
```

**Pass criteria:** Command exits 0, prints nothing.

**Failure indicates:** Type drift across the Apollo / Redux / Supabase boundary, or a
missing type that the build later masks.

### Validation 3 — ESLint Passes With Zero Warnings

```powershell
npm run lint
```

**Pass criteria:** Zero errors, zero warnings (`--max-warnings=0` is the project's gate).

**Failure indicates:** Style or correctness regressions introduced since the last pre-commit.

### Validation 4 — Prettier Formatting Clean

```powershell
npx prettier --check .
```

**Pass criteria:** "All matched files use Prettier code style!"

**Failure indicates:** A file was committed without formatting (pre-commit hook bypass).

### Validation 5 — Jest Test Suite Passes

```powershell
npm test
```

**Pass criteria:** All test suites pass, including `sessionSlice.test.ts`.

**Failure indicates:** A reducer contract or selector signature changed without test
updates.

### Validation 6 — Next.js Production Build Succeeds

```powershell
npm run build
```

**Pass criteria:** `✓ Compiled successfully`, no warnings about missing env vars, route
list includes `/login` and `/desktop`, proxy is reported.

**Failure indicates:** A runtime-only import sneaked into a server context (or vice
versa), or an env var the build relies on is missing.

### Validation 7 — Storybook Builds

```powershell
npm run build-storybook
```

**Pass criteria:** Build completes with zero errors. `storybook-static/` is populated.
The four stories (`AccountTile`, `PasswordInput`, `SignInButton`, `GlassSurface`) all
appear in the index.

**Failure indicates:** A component or story broke under Storybook's Next.js compatibility
shim — usually a missing `'use client'` or a server-only import in a story.

### Validation 8 — Design Token Coverage Audit

Grep every CSS module for hardcoded color, shadow, blur, gradient, and radius literals.

```powershell
Get-ChildItem -Recurse -Filter "*.module.css" -Path src |
  Select-String -Pattern '#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|blur\(\d|\d+px solid'
```

**Pass criteria:** Every match is justified — either inside a `var(--...)` fallback
position, or an opacity-only operation that does not constitute a design token. Any
raw color hex / rgba / hsla outside `globals.css` is a violation.

**Failure indicates:** A token leaked into a component stylesheet, undermining the
single-source-of-truth design system.

### Validation 9 — Apollo Auth Link Reads JWT From Redux (Code Review)

Open `src/lib/apollo-client.ts` and confirm:

- `SetContextLink` imported from `@apollo/client/link/context` (not deprecated `setContext`).
- The link callback reads from `store.getState()` and passes the result through
  `selectJwt` — not a direct `state.session.jwt` access.
- Anon-key fallback when `selectJwt` returns `null`.
- Headers include both `apikey` and `Authorization: Bearer ...`.

**Pass criteria:** All four conditions met.

**Failure indicates:** Drift from the architectural contract (selector usage, link
construction, header pair).

### Validation 10 — Proxy Gates `/desktop` (Code Review)

Open `src/proxy.ts` and `src/lib/supabase/proxy.ts` and confirm:

- `matcher` covers `/desktop/:path`\*.
- Admin detection routes through `supabase.auth.getClaims()` and checks `claims.email`
  against `NEXT_PUBLIC_ADMIN_EMAIL`.
- Guest detection reads the `GUEST_COOKIE_NAME` cookie.
- Unauthenticated requests redirect to `/login` with `from` preserved as a search param.

**Pass criteria:** All four conditions met.

**Failure indicates:** A drifted matcher or claim path silently lets unauthenticated
traffic through.

### Validation 11 — Dev Server Boots Without Console Errors

```powershell
npm run dev
```

Open `http://localhost:3000` in Chrome → DevTools → Console.

**Pass criteria:**

- Terminal prints `▲ Next.js` with no error stack traces.
- Page loads (redirects to `/login` is acceptable).
- Console shows zero red errors. No "could not find react-redux context" or "Apollo
  Client must be wrapped" messages.

**Failure indicates:** Provider mounting order is wrong in `layout.tsx`, or a client
component is missing `'use client'`.

### Validation 12 — Guest Flow End-to-End (Manual)

With dev server running, in a fresh incognito window:

1. Visit `http://localhost:3000/login`.
2. Click the **Guest** account tile.
3. Confirm redirect to `/desktop` (placeholder content is fine).
4. Reload the tab — `/desktop` should still render (session persists).
5. Close the tab, reopen, visit `/desktop` directly — should redirect to `/login`
   (Guest session is per-tab, not persistent).

**Pass criteria:** All five steps observed.

**Failure indicates:** `sessionStorage` not written, guest cookie missing, or the proxy
not recognizing the guest cookie.

### Validation 13 — Admin Flow End-to-End (Manual)

In a fresh incognito window:

1. Visit `/login`.
2. Click the **Admin** account tile.
3. Enter the admin password.
4. Confirm redirect to `/desktop`.
5. Reload the tab — `/desktop` should still render (Supabase JWT persists across reload).
6. Open DevTools → Network → trigger any GraphQL query → confirm `Authorization: Bearer <jwt>`
   in the request headers (the JWT, not the anon key).

**Pass criteria:** All six steps observed; the JWT visible in the Authorization header
is **not** the anon key.

**Failure indicates:** `useAuthListener` didn't fire, `setSession` didn't dispatch, or
Apollo's `authLink` read the stale state.

### Validation 14 — Unauthenticated `/desktop` Blocked

In a fresh incognito window with no prior login:

1. Visit `http://localhost:3000/desktop` directly.

**Pass criteria:** Browser redirects to `/login?from=%2Fdesktop` before `/desktop`
renders. View source on the resulting page — there should be no `/desktop` HTML in the
response history.

**Failure indicates:** The proxy `matcher` is wrong, or the proxy is permitting a
missing-session state.

---

## 📝 Validation Report

```
## Phase 1 — Validation Checklist

| #   | Check                                               | Status   |
| --- | --------------------------------------------------- | -------- |
| 1   | Deliverable inventory                               |   ✅    |
| 2   | `tsc --noEmit` zero errors                          |   ✅    |
| 3   | `npm run lint` zero warnings                        |   ⚠️     |
| 4   | `prettier --check .` clean                          |   ❌    |
| 5   | `npm test` all suites pass                          |   ✅    |
| 6   | `npm run build` succeeds                            |   ✅    |
| 7   | `npm run build-storybook` succeeds                  |   ✅    |
| 8   | Design token coverage audit                         |   ⚠️     |
| 9   | Apollo auth link code review                        |   ✅    |
| 10  | Proxy gating code review                            |   ✅    |
| 11  | Dev server boots, no console errors                 |   ⏳    |
| 12  | Guest flow end-to-end                               |   ⏳    |
| 13  | Admin flow end-to-end + JWT in Network              |   ⏳    |
| 14  | Unauthenticated `/desktop` redirects                |   ⏳    |

✅ = passed     ⚠️ = passed with caveat     ❌ = failed     ⏳ = pending manual verification

Validated by: Cade
Validated on: 2026-05-14
```

---

## 🔍 Findings

### F1 — ESLint config is missing `storybook-static/` ignore (Check 3 caveat)

Running `npm run lint` at the repo root surfaces 19,115 errors and 9,330 warnings —
**all from minified files inside `storybook-static/`**. Scoping the run to `src` only
(`npx eslint src`) produces zero errors and zero warnings.

Root cause: `eslint.config.mjs:48` ignores `.next/`, `out/`, `build/`, and
`next-env.d.ts` but not `storybook-static/`. The Storybook build artifact is
gitignored so this hasn't surfaced in CI, but the local lint script is unusable.

Fix (out of scope for this validation): add `'storybook-static/**'` to
`globalIgnores`.

Source code itself is lint-clean.

### F2 — Prettier reports CRLF line endings on three Phase 1 source files (Check 4)

`prettier --check .` fails on:

- `src/lib/auth.ts`
- `src/lib/guestCookie.ts`
- `src/lib/supabase/proxy.ts`

Root cause: `.prettierrc` does not set `endOfLine`, so Prettier defaults to `lf`.
There is no `.gitattributes` enforcing line endings. On Windows, the working copy
carries CRLF endings that the pre-commit hook does not normalize.

The file content is otherwise identical to Prettier's expected output — the only
difference is `\r\n` vs `\n`.

Fix (out of scope for this validation): add `.gitattributes` with `* text=auto eol=lf`
OR set `"endOfLine": "auto"` in `.prettierrc`. Either is one line.

The remaining 12 files flagged by Prettier are unrelated to Phase 1 (markdown docs,
settings JSON, mcp-servers).

### F3 — One design-token literal leaked into AccountTile (Check 8)

`src/components/login/AccountTile/AccountTile.module.css:12`:

```css
text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
```

The `rgba(0, 0, 0, 0.8)` is a hardcoded color value. CLAUDE.md is explicit: "No
hardcoded values in component stylesheets — all values reference custom properties."

Fix (out of scope for this validation): define a `--text-shadow-on-image` token in
`globals.css` and reference it here. Every other CSS module is clean — the only
other `rgba`-like construct found was the `linear-gradient` in `SignInButton` whose
stops both use `var(--color-aero-*)`, which is fine.

---

## 🕹️ Manual Validation (Pending User)

Checks 11–14 require an interactive browser session and cannot be executed
automatically. Run them in order in a Chromium-based browser with DevTools open:

1. **Check 11** — `npm run dev`, open `localhost:3000`, observe zero console errors.
2. **Check 12** — Guest flow: click Guest tile, confirm `/desktop` renders, reload
   (still renders), close tab + reopen + visit `/desktop` directly (redirects).
3. **Check 13** — Admin flow: click Admin tile, enter password, confirm `/desktop`
   renders, reload (still renders), inspect Network on any GraphQL request and
   confirm `Authorization: Bearer <jwt>` is **not** the anon key.
4. **Check 14** — In a fresh incognito window with no prior sign-in, visit
   `/desktop` and confirm it redirects to `/login?from=%2Fdesktop` before render.

Mark each in the checklist above as `✅` once observed. Once all four are ✅,
move this file from `phase_1/in-progress/` to `phase_1/complete/` and flip the
Task 11 row in `phase_overview.md` to ✅ Complete.

---
