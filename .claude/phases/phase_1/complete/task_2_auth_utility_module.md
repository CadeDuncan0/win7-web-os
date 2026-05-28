<!-- task 2 - Create Auth Utility Module began: 2026-04-16 | completed: 2026-04-17 -->

# 🎯 Task 2: Create Auth Utility Module

---

## 🧠 Engineering Context & Rationale

### Why This Module Exists As Its Own File

Authentication touches every layer of the stack — Apollo's auth link, Redux's session slice,
Next.js middleware, and every UI component that branches on role. Without a single owning module,
each layer develops its own `supabase.auth.*` call site, each with its own ad-hoc error handling,
its own return shape, and its own subtle bugs about what "signed out" actually means.
`src/lib/auth.ts` is the **one place in the codebase that talks to the Supabase Auth API
directly**. Every other file calls this module.

This is an explicit application of the **Dependency Inversion Principle** at the module boundary:
the rest of the app depends on _our_ stable interface, not Supabase's. If we ever swap Supabase
for Auth0, Clerk, or a custom Postgres-backed auth system, only this file changes — every caller
is insulated.

### Two Session Origins, One Interface

The product has two fundamentally different session mechanisms, and understanding their divergence
is the most important concept in this task:

| Dimension         | Guest                                    | Admin                                                           |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Authentication    | None — client-side role assertion        | Supabase email + password                                       |
| JWT               | None — the anon key covers GraphQL reads | Issued by Supabase, forwarded in `Authorization`                |
| Persistence scope | `sessionStorage` — tab-scoped            | `localStorage` — Supabase SDK managed, survives browser restart |
| Lifetime          | Until tab close                          | Until explicit `signOut()` or JWT expiry                        |
| RLS perspective   | Anonymous role (`anon`)                  | Authenticated role with `app_metadata.role = 'admin'`           |
| Revocation        | Close tab                                | `supabase.auth.signOut()` + token invalidation                  |

Despite this divergence, callers (the login page, the auth listener hook, the route guard) must
not care. From the outside, a session is a session: it has a role, it has a start time, and it
either exists or it does not. The module's job is to hide the divergence behind a unified
`AppSession` type.

### Discriminated Unions Instead of Thrown Errors

You will see `AuthResult<T>` as the return type of every sign-in/sign-out function. This is a
**discriminated union**:

```ts
type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string }
```

A caller cannot read `.data` without first narrowing on `.ok`. TypeScript enforces the branch at
compile time — there is no runtime check that can be forgotten. Compare to the alternative:

```ts
// ANTIPATTERN — exception-based
const session = await signInAsAdmin(password) // might throw
// you will forget to try/catch at least once
```

Throwing is the default in most JavaScript code, and it is the default for a reason: brevity.
But auth failures are **expected control flow**, not exceptional conditions. Wrong password, rate
limiting, network failure — none of these are "exceptions," they are possible outcomes. Modeling
them as data (not exceptions) forces the caller to handle them; modeling them as exceptions lets
them propagate silently into unhandled promise rejections.

This is the same pattern Rust encodes in `Result<T, E>`, Swift in `Result<Success, Failure>`, and
Go in `(result, error)` return tuples. In TypeScript, discriminated unions are the idiomatic
equivalent.

### Why `NEXT_PUBLIC_ADMIN_EMAIL` Is an Environment Variable

The admin email is public information. It is the email address of the portfolio's owner. There
is no security value in hiding it — the entire portfolio is _about_ that person. But making it
an env var instead of a hardcoded string has two concrete benefits:

1. **The source code can be forked, cloned, deployed** by anyone (e.g., another developer using
   this project as a template) without editing a hardcoded string. Configuration is declarative.
2. **The email can be changed without a code change.** Rotate the admin account's email in
   Supabase → update `NEXT_PUBLIC_ADMIN_EMAIL` in Vercel → redeploy. No PR required.

The **password**, by contrast, is never in an env var, never in code, never in a commit. It lives
only in Supabase's bcrypt hash and in your password manager. The user types it into the login form.

### Client-Side Only — And Why That Matters

This module reads `sessionStorage`, which does not exist on the server. Importing it into a Server
Component would throw at build time. This is a deliberate constraint: auth state in this project
is fundamentally a browser concept. The Next.js middleware (Task 10) reads Supabase's session
cookie, not this module — the server has its own, parallel way to know about Admin sessions, and
is not expected to know about Guest sessions at all (Guest is purely a browser construct).

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Add the Admin Email Environment Variable

Open `.env.local` and add:

```
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@example.com
```

Use the same email you registered as the admin user in Task 1. Mirror this variable in:

- **Vercel dashboard** → Settings → Environment Variables (Production, Preview, Development)
- **GitHub repository Secrets and Variables → Actions → Variables** (since it is non-sensitive, a
  Variable is appropriate; it will still be needed for `next build` in CI)

Then update `.github/workflows/ci.yml` — add the variable to the `env:` block of the build step so
the client bundle can reference it during CI builds. Mirror the same addition in any workflow that
runs `npm run build`.

### Step 2 — Create the Auth Module File

```bash
touch src/lib/auth.ts
```

### Step 3 — Paste the Scaffold Below Into `src/lib/auth.ts`

Complete every `TODO` in-line before moving to the Challenge & Review. The scaffold is
intentionally partial — the shape is provided, the logic is yours.

```ts
import type { AuthError } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────
// These types are the module's public contract. Every caller (useAuthListener,
// the login page, the middleware) imports from here.

export type AppRole = 'guest' | 'admin'

export interface AppSession {
  role: AppRole
  // JWT is non-null only for Admin sessions. Guest sessions have no JWT —
  // their GraphQL requests travel on the Supabase anon key alone.
  jwt: string | null
  // Epoch ms — start time of the current session. Used downstream for
  // session-duration analytics and for deciding whether a stored Guest
  // marker is still fresh on rehydration.
  startedAt: number
}

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ─── Constants ──────────────────────────────────────────────────────────────

// sessionStorage key for the Guest session marker. Namespaced to prevent
// collisions with other sessionStorage consumers (browser extensions,
// embedded widgets).
const GUEST_SESSION_KEY = 'portfolio.guestSession'

// ─── Guest Session ──────────────────────────────────────────────────────────

export function beginGuestSession(): AuthResult<AppSession> {
  // TODO: [Action required by Junior] - Build the AppSession object for a Guest.
  throw new Error('not implemented')
}

// ─── Admin Sign-In ──────────────────────────────────────────────────────────

export async function signInAsAdmin(password: string): Promise<AuthResult<AppSession>> {
  const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!email) {
    return { ok: false, error: 'Admin email not configured' }
  }

  // TODO: [Action required by Junior] - Call supabase.auth.signInWithPassword
  throw new Error('not implemented')
}

// ─── Sign-Out ───────────────────────────────────────────────────────────────

export async function signOut(): Promise<AuthResult<null>> {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(GUEST_SESSION_KEY)
  }

  // TODO: [Action required by Junior] - Call supabase.auth.signOut()
  throw new Error('not implemented')
}

// ─── Session Rehydration ────────────────────────────────────────────────────

export async function getCurrentSession(): Promise<AppSession | null> {
  // TODO: [Action required by Junior] - Implement the precedence logic
  // TODO: [DOCS INVESTIGATION] - Research getSession() vs getUser()
  throw new Error('not implemented')
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractMessage(error: AuthError | Error): string {
  // TODO: [RESEARCH REQUIRED] - Supabase AuthError structure
  return error.message
}
```

### Step 4 — Verify the Module Type-Checks

```bash
npx tsc --noEmit
```

### Step 5 — Smoke-Test In a Client Component

Temporarily add to `src/app/page.tsx` (must have `'use client'` directive — without it the
smoke test runs in a Node/server context where `localStorage` and `sessionStorage` do not exist,
causing the output to appear in the terminal rather than the browser console):

```tsx
'use client'

import { useEffect } from 'react'
import { beginGuestSession, getCurrentSession } from '@/lib/auth'

export default function Home() {
  useEffect(() => {
    const run = async () => {
      const result = beginGuestSession()
      console.warn('[debug] beginGuestSession:', result)
      const current = await getCurrentSession()
      console.warn('[debug] getCurrentSession:', current)
    }
    void run()
  }, [])

  return (
    <main>
      <h1>Auth smoke test</h1>
    </main>
  )
}
```

Confirm:

- `beginGuestSession` returns `{ ok: true, data: { role: 'guest', jwt: null, startedAt: <number> } }`
- DevTools → Application → Session Storage shows `portfolio.guestSession`
- Closing the tab clears the Guest session

**Remove smoke-test code before committing.**

### Step 6 — Test the Admin Path Manually

[Confirmed]: `'use client'` directive required — without it, `signInAsAdmin` executes in the
server/Node context. Output appears in the terminal (not browser console) and `localStorage` does
not populate because the Supabase browser SDK's storage adapter is unavailable server-side.
Adding `'use client'` to `page.tsx` resolved both issues; JWT confirmed in
DevTools → Application → Local Storage → `sb-<project-ref>-auth-token`.

**Never commit a password to source control.**

---

## 🛡️ Challenge & Review

**1.** Your `signInAsAdmin` returns `AuthResult<AppSession>` rather than throwing on failure.

```
[Answer]: (a) if a caller forgets to handle an error path, then bugs can slip through undetected
which could potentially bring down a production-ready build. It could lead to a scenario where
.ok returns true even though it was supposed to be false which causes data to populate as
undefined or a malformed object. (b) Forcing the return type to be of AuthResult<AppSession>
forces correctness by causing the caller to narrow on .ok before it can access .data.
(c) auth failures are not exceptions, they are possible outcomes and when treated as data forced
the caller to handle them, which helps avoid silent promise rejections.

[Re-Answer]: TypeScript will throw an undefined value error since session.data could be undefined
if ok=false (return session.error instead which is a string).
```

**2.** `beginGuestSession` writes to `sessionStorage`, not `localStorage`.

```
[Answer]: Guests in the context of this project are a `viewing-mode` NOT an identity. If they
were an identity, they would have a dedicated User row. In the tab scenario, a user who has
Guest permission on tabs 2 and 3 and sets up admin permissions on tab 1 will see local storage
update on tabs 2 and 3 to reflect the JWT that is now stored. Because of this, when they go to
refresh on either of those tabs, the local storage will persist but the session storage will
expire. This will cause those tabs to assume admin privileges.
```

**3.** `NEXT_PUBLIC_ADMIN_EMAIL` ends up inlined into the client JavaScript bundle.

```
[Answer]: (a) Attackers can easily find, publicly, email information for a given person. In the
case of this project it's even more obvious because my email will be displayed in my GitHub,
resume shown on site, and could be easily found elsewhere just knowing the author of the project
is me. (b) passwords live *only* in the encrypted hash of Supabase, and the user types the
password in manually to the page for serverside verification. Keyloggers would be the main
concern for password-discovery (or brute force attacks). The vital data that *cannot* be leaked
to the client is the JWT authorization token, which would not only let the attacker gain access
to admin privileges, but also gain access to Supabase.
```

**4.** Research `getSession()` vs `getUser()`.

```
[Answer]: `getSession()` retrieves the session value from the client while `getUser()` sends a
network request to validate and return the JWT (server retrieval). Use getUser() whenever you
need to check for user authorization on the server (safer, but slower). Use getSession() when
retrieving the value from the client and not needing to validate the value. In `getCurrentSession`
we are using `getSession()` which is okay because the admin JWT is stored in the client local
storage for use across reloads and browser resets. getSession() can be taken advantage of by
attackers who directly edit the local storage to feign admin privileges. For this reason,
getUser() or getClaims should be used to validate the JWT before assuming the value as truth.

[Note]: JWT cannot be retrieved by getUser(), but it can be *validated* by it. getUser uses a
network call to validate the JWT from the client against what is in the database.
```
