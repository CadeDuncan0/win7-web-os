<!-- Created: 2026-05-10 20:08:47 | Completed: 2026-05-13 -->

### 🎯 Task 10: Add Route Protection (Next.js Proxy)

---

#### 🧠 Rationale

The phase plan describes this task as "Next.js middleware" reading "Supabase session cookie"
at "the edge." Each phrase is wrong for the installed stack. Reading docs against
`package.json` (Next 16.2.4, `@supabase/supabase-js` 2.101.1, no `@supabase/ssr`) surfaces
three corrections that must land before any code is written.

##### Correction 1 — `middleware.ts` is deprecated; the file is `proxy.ts`

Source: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`,
section "Migration to Proxy" (lines 733-764).

```diff
- // middleware.ts
- export function middleware(request) { ... }
+ // proxy.ts (src/proxy.ts for this project — same level as src/app)
+ export function proxy(request) { ... }
```

Codemod exists: `npx @next/codemod@canary middleware-to-proxy .` — but nothing to migrate
here since we're writing fresh. Use the new convention from line 1.

##### Correction 2 — Proxy runs on Node.js, NOT the edge

`proxy.md:219`:

> "The `edge` runtime is **NOT** supported in `proxy`. The `proxy` runtime is `nodejs`, and
> it cannot be configured."

Setting a `runtime` export in proxy.ts throws. The phase plan's "edge-level" language is
factually wrong for Next.js 16. The _behavior_ — "block before render" — is achievable; the
runtime claim is not. Add a `[Note]:` in the file you create at Step 0 acknowledging this.

##### Correction 3 — There is no server-readable session cookie yet

This is the load-bearing one. The phase plan tells the proxy to "read the Supabase session
cookie." With **only** `@supabase/supabase-js` (no `@supabase/ssr`), no such cookie exists.

```
                   ┌──────────────────────────────────────────────────┐
   Browser side    │  @supabase/supabase-js  → localStorage           │ ← server cannot read
                   │  beginGuestSession()    → sessionStorage         │ ← server cannot read
                   └──────────────────────────────────────────────────┘
                                ✗  no cookie crosses to server
                   ┌──────────────────────────────────────────────────┐
   Server (proxy)  │  request.cookies.get(...)  → nothing useful      │
                   └──────────────────────────────────────────────────┘
```

Verified: `node_modules/@supabase/auth-js/dist/main/lib/constants.js:15` defines
`STORAGE_KEY = 'supabase.auth.token'` and the default storage is `globalThis.localStorage`
(see `GoTrueClient.js` constructor defaults). The browser client never writes a cookie unless
you route it through `@supabase/ssr`.

##### The fix: install `@supabase/ssr` and split the client

`@supabase/ssr` is Supabase's official Next.js helper. Latest stable: **v0.10.3** (verified
on `github.com/supabase/ssr/releases`, dated 2026-05-07 — 3 days ago). The package writes
the auth session into HTTP cookies the server can read, and provides a `createServerClient`
factory the proxy uses.

```
┌────────────────────────────┐         ┌──────────────────────────────┐
│  createBrowserClient(...)  │         │  createServerClient(..., {   │
│  • used in src/lib/auth.ts │  same   │     cookies: { getAll,       │
│  • writes auth cookie via  │  auth   │              setAll }        │
│    document.cookie         │  cookie │  })                          │
│  • drop-in for current     │ ◀─────▶ │  • used in src/proxy.ts      │
│    `supabase` export       │         │  • reads cookie from request │
└────────────────────────────┘         │  • writes refreshed cookie   │
                                       │    onto response             │
                                       └──────────────────────────────┘
```

##### Correction 4 — Use `getClaims()`, not `getUser()` or `getSession()`

This is a **post-training-era change**. The Supabase server-side docs (verified at
`supabase.com/docs/guides/auth/server-side/creating-a-client`, May 2026) now make the
canonical server-side auth check `supabase.auth.getClaims()`. The docs explicitly warn:

> "Never trust `supabase.auth.getSession()` inside server code."

| Method         | Validates JWT signature? | Use in proxy.ts? |
| -------------- | ------------------------ | ---------------- |
| `getSession()` | ❌ No — local read only  | **NEVER**        |
| `getUser()`    | ✅ Yes — network call    | OK, but legacy   |
| `getClaims()`  | ✅ Yes — local verify    | ✅ **Canonical** |

`getClaims()` verifies the JWT signature against the public key locally — no extra round
trip — and returns the decoded claims. This is faster than `getUser()` (which makes a
network call to the Supabase auth server) and is now the documented pattern for proxy/SSR.

##### Decision tree the proxy implements

```
incoming request to /desktop/*
        │
        ├── valid claims for an authenticated user?
        │     ├── yes  → NextResponse.next()       // render /desktop
        │     └── no   → redirect to /login?from=<original_path>
```

The `?from=` param is for a future redirect-back flow. Phase 1 does not consume it; emit it
anyway so Phase 2 has the data.

---

#### 🛠️ Implementation Outline

##### Step 0 — Create the task file and record version pins

You will own a working notes file alongside this tutorial. Open a `[Decision]:` block at the
top recording the **installed** versions you observed in `package.json`:

```
[Decision]:
- next: 16.2.4
- react: 19.2.4
- @supabase/supabase-js: ^2.101.1
- @supabase/ssr (to install): latest stable ≥ 0.10.3
[Note]: Phase plan says "middleware/edge/session cookie." Verified facts:
  proxy.ts/Node runtime/no cookie exists until @supabase/ssr is installed.
```

If you cannot copy these versions from a real `package.json` read, stop and read it.

##### Step 1 — Install `@supabase/ssr`

```bash
# TODO: [Research Required: latest @supabase/ssr version on npm registry]
#   - Run `npm view @supabase/ssr version` to confirm current latest.
#   - Install: `npm install @supabase/ssr`.
#   - Do NOT pin a specific version — let npm resolve the latest stable.
#   - Verify in package.json: dependencies should now include @supabase/ssr.
```

##### Step 2 — Split `src/lib/supabase.ts` into browser + server factories

The current file has a single `createClient(...)` export. After this step it has two
exports: `supabase` (browser client) and `createServerSupabaseClient` (server factory). The
goal: every existing import of `supabase` keeps working with no signature change.

```ts
// src/lib/supabase.ts

// Browser client — drop-in replacement for the existing `supabase` export.
// All .auth.* methods are identical; the only difference is that this version
// reads and writes the auth cookie via document.cookie instead of localStorage.
export const supabase = /* TODO: [Research Required: createBrowserClient signature]
   Source: supabase.com/docs/guides/auth/server-side/creating-a-client
   - createBrowserClient(url, anonKey) takes no cookie adapter.
   - Returns a SupabaseClient with the same .auth.* surface as before.
   - All existing callers (auth.ts, useAuthListener.ts) need zero changes. */

// Server client factory — used inside proxy.ts. Takes the request's cookie
// store, returns a SupabaseClient that:
//   - reads the auth cookie from the incoming request
//   - writes any refreshed cookie onto a response the proxy returns
export function createServerSupabaseClient(/* TODO: cookies adapter */) {
  // TODO: [Research Required: createServerClient cookies adapter shape, v0.10.3]
  //   - Shape is { cookies: { getAll, setAll } }.
  //   - getAll(): returns ALL cookies as { name, value }[] from the request.
  //   - setAll(cookiesToSet): writes each cookie onto a NextResponse you control.
  //   - The older { get, set, remove } shape is REMOVED in v0.10.x — do not use it.
  //   - Reference: supabase.com/docs/guides/auth/server-side/creating-a-client
}
```

> **`[Note]:` to record after this step:** Why two clients? Browser must persist the
> session client-side; server must read/refresh it per-request without sharing state.
> The cookie is the bridge — same data, two readers.

Verification: `npm run build` passes. `useAuthListener.ts` still subscribes successfully.
Admin sign-in still works in the browser. If any of these break, you wired the wrong
export shape — revisit before continuing.

##### Step 3 — Create `src/proxy.ts`

Lives at `src/proxy.ts` because this project uses `src/app/` (the docs explicitly say
"inside `src` if applicable, so that it is located at the same level as `pages` or `app`").

```ts
// src/proxy.ts
//
// Runtime: Node.js (proxy cannot use the edge runtime in Next.js 16).
// Do NOT export a `runtime` config — it throws.

export async function proxy(request /* NextRequest */) {
  // Start with a pass-through response. The Supabase server client may write
  // refreshed cookies onto this object via setAll; we hand it back at the end.
  const response = /* TODO: NextResponse.next() */ null

  const supabase =
    createServerSupabaseClient(/* TODO: cookies adapter wired to
     request.cookies (getAll) and response.cookies (setAll) — adapter shape from Step 2 */)

  // TODO: [Research Required: supabase.auth.getClaims() return shape, v0.10.3+]
  //   - Returns { data: { claims }, error } where claims includes the user id and email.
  //   - Validates the JWT signature against the project's public key LOCALLY (no network).
  //   - DOCS WARNING: Never use getSession() server-side — it does not validate.
  //   - getUser() works but is legacy / slower; getClaims() is canonical as of 2026.
  const { data, error } = await supabase.auth.getClaims()

  const isAdmin = !error && data?.claims?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  if (isAdmin) {
    return response // authenticated — pass through
  }

  // Unauthenticated: redirect to /login with original path preserved.
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  // TODO: return NextResponse.redirect(loginUrl)
}

// Matcher: target ONLY /desktop/*. Do not regex-broaden.
// Per docs (proxy.md:73), narrow matchers are statically analyzed at build time
// and cheaper than in-function bail-outs.
export const config = {
  matcher: ['/desktop/:path*'],
}
```

> **What this protects and what it does NOT:**
>
> - **Protects:** Admin navigation to `/desktop/*` from unauthenticated browsers.
> - **Does NOT protect:** Guest sessions. Guest auth lives in `sessionStorage` and writes
>   no cookie. The proxy will _redirect Guests to /login_, which is broken UX for Phase 1's
>   goal of "Guest reaches /desktop." This is the architectural gap you must close in
>   Step 4 before declaring Task 10 done.

##### Step 4 — Decide the Guest path (read before writing code)

The Admin path is solved by `@supabase/ssr` writing the auth cookie automatically. Guest has
no Supabase auth event — it's a pure client-side role assertion in `auth.ts`. Three options.
**You must pick one** and record it as `[Decision]:` in your notes.

| Option                                               | Mechanism                                                                                                                                          | Cost                                                                                                                                                                          | Verdict                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **4A. Hand-rolled Guest role cookie**                | `beginGuestSession()` writes `document.cookie = 'portfolio.guest=1; Path=/; SameSite=Lax'`. Proxy checks `request.cookies.get('portfolio.guest')`. | Tiny. One util in `src/lib/guestCookie.ts`. Cookie is client-writable — fine, because "Guest" is a role, not an identity, and there's no protected data behind it in Phase 1. | ✅ **Recommended.** Smallest change, correct semantics for Phase 1.              |
| **4B. Mint an anonymous Supabase session for Guest** | Replace `beginGuestSession()` with `supabase.auth.signInAnonymously()`. Both roles flow through `@supabase/ssr`'s cookie.                          | Re-architects Guest. Anonymous users count against Supabase MAU quota. Touches `auth.ts`, `useAuthListener.ts`, and Apollo authLink.                                          | ❌ Out of scope for Task 10. Reasonable for a Phase 3 rework if RLS needs a uid. |
| **4C. Drop Guest from route protection entirely**    | Proxy only protects Admin-only routes in Phase 3. Guest can reach `/desktop` because `/desktop` is initially public.                               | Defers the problem. But Phase 1's stated goal is "block /desktop from unauthenticated access" — this option does not deliver that.                                            | ❌ Fails the Phase 1 goal as written.                                            |

**Pick 4A.** If you pick differently, write `[Deep Dive]:` explaining why before continuing.

For 4A, the cookie util:

```ts
// src/lib/guestCookie.ts
const COOKIE_NAME = 'portfolio.guest'

export function writeGuestCookie(): void {
  // TODO: [Research Required: document.cookie attribute set]
  //   - Path=/, SameSite=Lax, Max-Age in seconds.
  //   - HttpOnly is impossible from JS — do not pretend otherwise.
  //   - In production also include Secure; in dev (http://localhost) Secure breaks the cookie.
}

export function clearGuestCookie(): void {
  // TODO: write with Max-Age=0 to delete.
}

export const GUEST_COOKIE_NAME = COOKIE_NAME
```

Then wire it:

- `beginGuestSession()` in `src/lib/auth.ts` calls `writeGuestCookie()` after the
  `sessionStorage` write.
- `signOut()` calls `clearGuestCookie()`.
- Proxy reads it:

```ts
// inside proxy(request), after computing isAdmin:
const isGuest = request.cookies.get(GUEST_COOKIE_NAME)?.value === '1'
if (isAdmin || isGuest) {
  return response
}
```

##### Step 5 — Manual verification matrix

The proxy is invisible when it works. You verify it by trying to break it. Open an
incognito window (clean cookies + storage), run `npm run dev`, and walk every row.

| #   | Action                                              | Expected                                       | Failure means                                |
| --- | --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| 1   | Visit `/desktop` with no session                    | 307 redirect → `/login?from=%2Fdesktop`        | Proxy not firing or matcher wrong            |
| 2   | Visit `/login` with no session                      | 200, login page renders                        | Matcher leaking into /login                  |
| 3   | Visit `/`                                           | Whatever root renders; proxy does NOT fire     | Matcher too broad                            |
| 4   | Sign in as Guest, then `/desktop`                   | 200, page renders                              | Guest cookie not being written or read       |
| 5   | Sign in as Admin, then `/desktop`                   | 200, page renders                              | Supabase auth cookie missing or invalid      |
| 6   | DevTools → Application → Cookies on `/desktop` load | `sb-...` (Supabase) AND/OR `portfolio.guest=1` | Wrong cookie name, wrong domain, missing     |
| 7   | Sign out from authenticated state, hit `/desktop`   | Redirect to `/login`                           | Sign-out not clearing both cookies           |
| 8   | Hand-edit `sb-...` to garbage, hit `/desktop`       | Redirect to `/login` (NOT a 500)               | `getClaims()` failing-closed correctly       |
| 9   | Network tab on `/desktop` request                   | `Cookie:` header carries session marker        | Browser not sending cookie (path/domain bug) |

Do not advance to `Task Completed` until every row passes. Row 8 is the security row — if a
forged cookie lets a user past the proxy, the auth check is broken regardless of how it
looks for valid sessions.

---

#### 🛡️ Summary

- **`middleware.ts` → `proxy.ts`** in Next.js 16. Function name is `proxy`. Runtime is Node.js
  and not configurable. The phase plan's "edge" wording is wrong for this stack.
- **`@supabase/ssr` ≥ 0.10.3** is the prerequisite. It writes the Supabase session to an
  HTTP cookie the proxy can read. `@supabase/supabase-js` alone uses localStorage and is
  server-invisible.
- **Cookie adapter shape:** `{ cookies: { getAll, setAll } }`. The old `{ get, set, remove }`
  shape is gone in v0.10. If a tutorial elsewhere shows it, that tutorial is stale.
- **Server auth check: `getClaims()`.** `getSession()` does not validate signatures and the
  docs explicitly warn against it server-side. `getUser()` still works but `getClaims()` is
  the post-2026 canonical choice — local signature verification, no network call.
- **Two clients, one cookie:** `createBrowserClient` for `src/lib/supabase.ts`,
  `createServerClient` factory for `proxy.ts`. Same auth cookie, different readers.
- **Guest needs a separate cookie.** `@supabase/ssr` only covers Supabase-managed sessions.
  Guest is client-side-only, so write a non-HttpOnly `portfolio.guest=1` cookie the proxy
  reads alongside the Supabase claims check. Acceptable because Phase 1 has no protected
  data behind `/desktop`.
- **Matcher narrow: `['/desktop/:path*']`.** Extend by adding entries, never by regex.
- **No automated tests for proxy in Phase 1.** Step 5's matrix IS the contract. Cypress
  arrives in Phase 2.

**FAANG interview pressure points:** "Why `getClaims` over `getUser`?" (local signature
verify, no network round trip); "Why is the proxy on Node.js?" (Next 16 removed edge runtime
support for proxy — not a choice); "Why a separate cookie for Guest?" (`@supabase/ssr` only
manages Supabase-issued sessions; Guest is a client-side role assertion with no JWT, so it
needs its own server-visible signal); "Why `matcher` and not an `if` inside the function?"
(matcher is statically analyzable at build, cheaper, and prevents auth logic from running on
static assets).
