<!-- task 4 - Build Auth State Listener Hook began: 2026-04-19 completed: 2026-04-21 -->

# 🎯 Task 4: Build Auth State Listener Hook

---

## 🧠 Engineering Context & Rationale

### Three Disconnected Modules — The Hook Is The Bridge

After Task 3, the session architecture has three distinct pieces with no wiring between them:

| Module                  | Role                                                         | Nature                   |
| ----------------------- | ------------------------------------------------------------ | ------------------------ |
| `auth.ts` (Task 2)      | Imperative Supabase API — signIn, signOut, getCurrentSession | Async, one-shot calls    |
| `sessionSlice` (Task 3) | Declarative Redux state — role, jwt, authStatus              | Synchronous, reactive    |
| `supabase.auth` client  | Event emitter for auth lifecycle events                      | Asynchronous, push-based |

Think of them as three rooms with no doors. The user signs in — Supabase knows, but Redux does not. Supabase auto-refreshes the JWT — the old token lingers in Redux, and Apollo's authLink injects it on every GraphQL request until a manual refresh.

**The hook is the door.** It subscribes to Supabase's event stream and translates each event into the correct Redux dispatch. From the moment it mounts, the declarative slice matches reality.

### The Observer Pattern — Why `onAuthStateChange` Is The Right Primitive

A naive implementation polls `getCurrentSession()` on an interval. Both failure modes are real:

1. **Latency window.** Between polls, state is stale. If the user signs out at t=0 and the poll interval is 5s, Apollo's authLink injects a revoked-looking-valid JWT for up to 5s. In an admin-only view, this is a visible data leak.
2. **Cost.** Every poll is a network round-trip, even when nothing changed.

`supabase.auth.onAuthStateChange(callback)` is an event subscription — it fires **only when auth changes**, push-driven, zero polling. The callback signature is `(event, session) => void`. Events relevant to Phase 1:

| Event                                | Trigger                                           | Reaction                       |
| ------------------------------------ | ------------------------------------------------- | ------------------------------ |
| `INITIAL_SESSION`                    | Fires once, immediately on subscription           | Rehydrate from persisted state |
| `SIGNED_IN`                          | `signInWithPassword` succeeds                     | `setSession(...)` with admin   |
| `SIGNED_OUT`                         | `signOut()` completes — **also fires cross-tab**  | `clearSession()`               |
| `TOKEN_REFRESHED`                    | JWT auto-refresh (Supabase handles transparently) | `setSession(...)` with new JWT |
| `USER_UPDATED` / `PASSWORD_RECOVERY` | Metadata / recovery events                        | Ignore in Phase 1              |

### The Subscription Lifecycle — Cleanup Is Not Optional

`onAuthStateChange` returns a handle. The shape:

```ts
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(callback)
// subscription.unsubscribe() — the cleanup method
```

Without calling `unsubscribe()` on unmount:

- **React 18 StrictMode** double-mounts in development → two subscriptions → every dispatch duplicates
- **Next.js fast-refresh** remounts on file save → listener count climbs monotonically through a dev session
- **Route transitions** that unmount and remount the provider tree leak listeners in production — memory grows, dispatches multiply

The idiomatic pattern — same shape as `addEventListener` / `removeEventListener`:

```
useEffect(() => {
  const handle = subscribe(...)
  return () => handle.unsubscribe()
}, [deps])
```

Treat subscriptions as resources: **open → use → close.**

### Two-Path Rehydration — Admin via Supabase, Guest via sessionStorage

On app boot a visitor may have:

- An **admin session** — Supabase's own storage persisted the JWT. `INITIAL_SESSION` fires with a non-null session.
- A **guest session** — Task 2's `beginGuestSession` wrote a marker into `sessionStorage`. Supabase has no knowledge of this.
- **Neither** — first-time visitor.

`INITIAL_SESSION` only surfaces case 1. Case 2 requires a separate read from `sessionStorage`. Task 2's [`getCurrentSession`](src/lib/auth.ts) already handles both paths — the hook consumes it for the `INITIAL_SESSION` branch when `session` is null.

```
App mounts
   │
   ├── Redux initialState: authStatus = 'unknown'
   │
   ├── AuthListener mounts → useAuthListener subscribes
   │       │
   │       ├── INITIAL_SESSION fires (once)
   │       │       ├── session exists + email matches admin → dispatch setSession(admin)
   │       │       ├── session exists + email mismatch     → signOut, stay 'unauthenticated'
   │       │       └── session is null                     → getCurrentSession()
   │       │                                                   ├── guest marker found → setSession(guest)
   │       │                                                   └── nothing found     → clearSession()
   │       │
   │       └── Future events dispatch in real time
   │
   └── Components render against authStatus — no flash, no polling
```

### The Admin Email Gate — Defense In Depth

Task 2's `getCurrentSession` validates `session.user.email === NEXT_PUBLIC_ADMIN_EMAIL`. The hook must enforce the same gate on `SIGNED_IN`. Why?

`signInWithPassword` authenticates **any user** in Supabase's `auth.users` table — it verifies "credentials are valid," not "this is the admin." If a second user row exists (accidentally or via a forgotten test account), Supabase issues them a valid JWT. Without the gate, the app grants them admin privileges.

The gate:

```
if (session && session.user.email !== ADMIN_EMAIL) {
  await supabase.auth.signOut()   // immediately revoke
  return                           // do not dispatch setSession
}
```

This is **client-side defense only.** A determined attacker can patch the bundled JS. Real enforcement happens at the database layer via Phase 3's RLS policies. But the gate:

1. Prevents accidental privilege grants from misconfiguration
2. Makes errors loud — a foreign sign-in immediately self-signs-out
3. Forms the outer layer of the defense-in-depth stack (client gate → middleware → RLS)

### The Mount Point — Hook + Thin Component Wrapper

Two patterns are on the table:

| Pattern                                        | Subscriptions                             | Problem                            |
| ---------------------------------------------- | ----------------------------------------- | ---------------------------------- |
| Inline hook in every component that needs auth | N components = N subscriptions            | Memory leak, duplicate dispatches  |
| Single `<AuthListener />` mounted once         | Exactly one subscription for the app tree | None — this is the correct pattern |

We take the second. A dedicated component `AuthListener` calls `useAuthListener()` internally and renders `null` — it exists purely for its side effects. Mounted as a sibling inside the Redux provider so `useAppDispatch()` resolves.

Why split a hook and a component wrapper instead of inlining the `useEffect` directly in `ReduxProviderWrapper`? **Separation of concerns.** `ReduxProviderWrapper`'s job is to provide the store. A subscription lifecycle is a different responsibility. Conflating them means every future listener (`useWindowFocusListener`, `usePresenceChannel`, etc.) accretes into the same file.

---

## 🛠️ Step-by-Step Implementation & Code

### Step 1 — Scaffold The Hook File

Create a new `hooks/` directory — the first custom hook in the codebase establishes the convention for Phase 2's window manager hooks.

```bash
mkdir -p src/hooks
```

Create [src/hooks/useAuthListener.ts](src/hooks/useAuthListener.ts) with the skeleton below. Every event handler is a TODO.

```ts
import { useEffect } from 'react'

import { getCurrentSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useAppDispatch } from '@/store/hooks'
import { setSession, clearSession } from '@/store/slices/sessionSlice'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export function useAuthListener(): void {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // onAuthStateChange returns { data: { subscription } }. Destructure it
    // so the cleanup function below can close the subscription.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ── SIGNED_OUT ───────────────────────────────────────────────────
      // TODO: [Action required by Junior]
      // - If event === 'SIGNED_OUT' → dispatch clearSession()
      // - Then return. Do not fall through to the admin-session branch.
      // - Why: SIGNED_OUT also fires cross-tab via Supabase's BroadcastChannel;
      //   this is how a sign-out in tab A propagates to tab B.
      // ── SIGNED_IN / TOKEN_REFRESHED ──────────────────────────────────
      // TODO: [Action required by Junior]
      // - If event is 'SIGNED_IN' or 'TOKEN_REFRESHED' and session is non-null:
      //     1. Enforce the admin email gate:
      //        if (session.user.email !== ADMIN_EMAIL) { await signOut; return }
      //     2. Dispatch setSession with:
      //        { role: 'admin', jwt: session.access_token, startedAt: <ms> }
      // - `startedAt` math: see the TODO at the bottom of this step.
      // ── INITIAL_SESSION ──────────────────────────────────────────────
      // TODO: [Action required by Junior]
      // - If event === 'INITIAL_SESSION':
      //     - If session is non-null → treat identically to SIGNED_IN
      //       (admin email gate + setSession)
      //     - If session is null → call getCurrentSession() from @/lib/auth.
      //       This checks the sessionStorage guest marker. Dispatch accordingly:
      //         result is non-null  → setSession(result)
      //         result is null      → clearSession()
      // - Why the extra getCurrentSession call: INITIAL_SESSION only knows about
      //   Supabase-managed state; guest sessions live in sessionStorage.
      // ── Other events ─────────────────────────────────────────────────
      // USER_UPDATED, PASSWORD_RECOVERY, etc. — ignore in Phase 1.
    })

    return () => subscription.unsubscribe()
  }, [dispatch])
}
```

> **TODO:** `[RESEARCH REQUIRED]` — `startedAt` math. Supabase returns `session.expires_at` in **Unix seconds** and `session.expires_in` in **seconds**. Your Redux `SessionState` stores `startedAt` in **milliseconds**. Derive the formula. Read [`getCurrentSession` in `src/lib/auth.ts`](src/lib/auth.ts) — Task 2 already solved this; mirror the derivation exactly for consistency. State your formula in Challenge Q5.

### Step 2 — Create The Component Wrapper

Create [src/components/providers/AuthListener.tsx](src/components/providers/AuthListener.tsx):

```tsx
'use client'

import { useAuthListener } from '@/hooks/useAuthListener'

export function AuthListener(): null {
  useAuthListener()
  return null
}
```

> **TODO:** `[Action required by Junior]` — Answer these two micro-questions in Challenge Q2:
>
> - Why the `'use client'` directive? What breaks without it?
> - Why `return null` instead of `return <></>`?

### Step 3 — Mount Inside The Redux Provider

Open your existing provider wrapper (established in Phase 0 — somewhere in [src/components/providers/](src/components/providers/)). The listener must render **inside** the `<Provider>` element so `useAppDispatch()` resolves against the correct store, but it is a sibling to `{children}`, not a wrapper:

```tsx
// Conceptual shape — adapt to your actual file
<Provider store={store}>
  <AuthListener />
  {children}
</Provider>
```

> **TODO:** `[Action required by Junior]`
>
> - Locate the file that mounts `<Provider store={store}>`.
> - Add `<AuthListener />` as a sibling to `{children}` inside that Provider.
> - Import from `@/components/providers/AuthListener`.

### Step 4 — Manual Smoke Test

Run the dev server:

```bash
npm run dev
```

Open the app with Redux DevTools attached. Walk through each scenario:

| Scenario                                 | Expected Redux dispatch sequence                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Fresh tab, no prior session              | `authStatus: 'unknown'` → within ~100ms → `clearSession` → `authStatus: 'unauthenticated'` |
| Fresh tab, prior admin session persisted | `authStatus: 'unknown'` → `setSession(admin)` → `authStatus: 'authenticated'`              |
| Sign in as admin (use `signInAsAdmin`)   | `SIGNED_IN` handler fires → `setSession(admin)`                                            |
| Sign out from tab A, observe tab B       | Tab B dispatches `clearSession` within ~1s — no reload needed                              |
| Wait for token refresh (~1 hour)         | `TOKEN_REFRESHED` handler → `setSession` with new `jwt`                                    |

If cross-tab sign-out in scenario 4 does not propagate, your subscription is not receiving broadcast events. Supabase's default broadcast channel must be enabled (it is by default — do **not** override the `multiTab: false` option anywhere).

### Step 5 — Strip Scratch Comments Before `SCAN TASK 4`

Any inline `// [Answer]:` or `// [Guess]:` notes you wrote while reasoning through the TODOs must be removed from [src/hooks/useAuthListener.ts](src/hooks/useAuthListener.ts) before the scan. Source files are compiled artifacts. Carry forward the Task 3 hygiene standard.

---

## 🛡️ Challenge & Review

Complete all TODOs and pass the smoke test before answering. Each question has a gating `[Answer]:` block.

**1.** The `useEffect` cleanup calls `subscription.unsubscribe()`. Explain **precisely** what breaks without the cleanup in each of these three scenarios: (a) React 18 StrictMode's intentional double-mount in development; (b) Next.js fast-refresh after saving the hook file; (c) a user navigating from `/login` to `/desktop` and back in running production code.

```
[Answer]: (a) The double-mount cycle becomes disrupted, leading to duplicated listeners. Each remount cycle grows the amount of listeners by 1 more. (b) Multiple events will fire N times (where N is amount of leaked subs), eventually causing page slowness and unresponsiveness. (c) "The count would grow additively per remount cycle (1 → 2 → 3 → ...) IF the component remounted — but because AuthListener is mounted at the provider root, in-app navigation does not remount it. The leak in this scenario is avoided by the architectural choice of mount location, not by the cleanup itself."
```

**2.** You split the logic into a hook (`useAuthListener`) AND a component wrapper (`<AuthListener />`). A teammate proposes: "Just call `useAuthListener()` directly inside `ReduxProviderWrapper` — one less file." State the architectural reason the split exists. Your answer must address: (a) single responsibility — what is each module's one job? (b) what concretely becomes harder if a second listener (`useWindowFocusListener`, `usePresenceChannel`) is later added under the teammate's proposal? Also answer the two micro-questions from Step 2's TODO: why `'use client'`, and why `return null` vs `return <></>`.

```
[Answer]: (a) "**Separation of concerns.** `ReduxProviderWrapper`'s job is to provide the store. A subscription lifecycle is a different responsibility. (b) Conflating them means every future listener (`useWindowFocusListener`, `usePresenceChannel`, etc.) accretes into the same file.". Having a component wrapper allows for reuse across *all* files, not restricting the devs to rely on the `ReduxProvierWrapper` for all listeners (what if you only want a specific listener on a single page?). (mq1) `use client` is required for client-side values and events to run. (mq2) `return null` because this is the correct design choice for listeners, which don't have any DOM-related elements to return. Effectively communicates that the file is for `side-effects-only`.
```

**3.** The hook validates `session.user.email === NEXT_PUBLIC_ADMIN_EMAIL` on `SIGNED_IN`. A teammate argues this is redundant: "Supabase already authenticated them." Write a precise technical rebuttal that addresses: (a) what `signInWithPassword` actually proves (and what it does NOT prove about identity); (b) the defense-in-depth principle, naming the two other layers of this defense (middleware in Task 10, and RLS in Phase 3); (c) why client-side enforcement is bypassable yet still worth having.

```
[Answer]:
(a)
"`signInWithPassword` authenticates **any user** in Supabase's `auth.users` table — it verifies "credentials are valid," not "this is the admin." If a second user row exists (accidentally or via a forgotten test account), Supabase issues them a valid JWT. Without the gate, the app grants them admin privileges.
"
(b)
"
This is **client-side defense only.**  Real enforcement happens at the database layer via Phase 3's RLS policies.
"
The gate:

1. Client gate (your hook): Runs in the browser, in JavaScript, after React mounts. Catches accidental misconfigurations and forces sign-out on email mismatch. Bypassable by patching the bundle.

2. Next.js middleware: Runs at the edge, in the request lifecycle, BEFORE React renders. Reads the Supabase session cookie. Redirects unauthenticated requests to /login. Without this, a logged-out user could load /desktop and see the full shell before any JS runs.

3. Row Level Security (RLS): Runs inside PostgreSQL, at query time. Filters every SELECT based on the JWT's role claim. Even if a malicious client crafts GraphQL queries bypassing the frontend entirely, RLS returns empty rows for visibility = 'admin' unless the JWT proves admin.


(c)
"
A determined attacker can patch the bundled JS. However, it's the first step in the gate which can catch and guard against simple attacker's advances.
"
```

**4.** `onAuthStateChange` fires `INITIAL_SESSION` exactly once, immediately on subscription, even when the user is not signed in (in which case `session = null`). Given this guarantee, explain: (a) why a separate explicit call to `getCurrentSession()` is **still required** in the `INITIAL_SESSION` branch when `session === null`; (b) why calling `getCurrentSession()` in the admin branch (when `session` is non-null) would be redundant. Your answer must reference the two distinct persistence layers involved.

```
[Answer]: (a) Supabase doesn't know about the guest session stored in sessionStorage (meaning it can't return a guest session response), so the listener needs to check that storage before determining that there is no existing session. (b) calling `getCurrentSession()` in the admin branch is unnecessary, because if we have received a non-null session object, that means Supabase returned and holds valid data for authentication (assuming this is INITIAL_SESSION, so the session follows the order: 1. supabase check, if nothing guest check, if nothing, unathenticated).
```

**5.** `[RESEARCH REQUIRED]` — Write the formula for `startedAt` in milliseconds given `session.expires_at` (Unix seconds) and `session.expires_in` (seconds). Cross-check against the derivation in [`getCurrentSession`](src/lib/auth.ts). Explain in one sentence what `startedAt` represents physically — what moment in time does it point to, and why is that the right anchor for session age calculations?

```
[Answer]: `startedAt: ((session.expires_at ?? Date.now() / 1000 - 3600) - session.expires_in) * 1000` expires_at is nullable, so the fallback is to take the current time converted to seconds, subtract an hour in seconds, and then subtract against expires_in, which is in seconds. Because this formula is in seconds, and we want startedAt in ms, we multiply the result by 1000. `startedAt` represents the session starting timestamp when a user logs in to either an Admin or Guest session.
```

---

### Gating

You may not `SCAN TASK 4` until:

1. Every in-file `// TODO:` block in [src/hooks/useAuthListener.ts](src/hooks/useAuthListener.ts) is resolved.
2. `<AuthListener />` is mounted inside the Redux provider.
3. The smoke test table in Step 4 passes every row — including cross-tab `SIGNED_OUT` propagation.
4. All five `[Answer]:` blocks are populated.

On completion, Task 4 produces the first fully reactive auth surface in the codebase. Task 5 (`apollo-client.ts` authLink) will plug into `selectJwt` with zero further coordination — that is only possible because this hook keeps the slice continuously synchronized with Supabase.
