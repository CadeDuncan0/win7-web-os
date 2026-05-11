<!-- task 3 - Implement Session Slice Logic began: 2026-04-17 | completed: 2026-04-19 -->

# 🎯 Task 3: Implement Session Slice Logic

---

## 🧠 Engineering Context & Rationale

### What Redux Owns That `auth.ts` Cannot

Task 2 built the module that _talks to Supabase_. Task 3 builds the module that _broadcasts auth state to every React component and every Apollo request_. These are different jobs, and conflating them is the most common Redux anti-pattern a Junior writes on their first production codebase.

- `auth.ts` is **imperative and async** — you _call_ it to perform an action (sign in, sign out, rehydrate). Each call is a one-shot.
- `sessionSlice` is **declarative and synchronous** — it _holds_ the current auth state as a reactive value. Every consumer subscribes; any change re-renders the subscribers.

If a component needs to render differently based on the Admin/Guest role, it does not call `getCurrentSession()` — that would be an async call on every render, a cache-miss disaster. It reads `selectRole(state)` from Redux, which is a synchronous, memoized selector over an in-memory value.

The auth listener hook (Task 4) is the bridge: it calls the imperative module once, receives the result, and dispatches it into the declarative slice. From that point forward, the slice is the source of truth for the running app.

### The Three-State `authStatus` — Why Boolean Is Wrong

A first-instinct model is `isAuthenticated: boolean`. This is wrong, and the bug it causes is subtle enough to ship and only show up in production screenshots of your own site.

Consider the boot sequence:

```
t=0ms   Page loads. Redux store hydrates with initialState.
t=50ms  useAuthListener mounts, begins async getCurrentSession().
t=90ms  Supabase returns session. Dispatch setSession().
```

Between `t=0` and `t=90`, your boolean says `false` — "unauthenticated." So your login-screen guard redirects the user to `/login` for 90ms before noticing they were signed in all along. This is the **flash-of-unauthenticated-content (FOUC-auth)** bug.

The fix is a **three-state machine**:

| Status            | Meaning                                           | UI should render                |
| ----------------- | ------------------------------------------------- | ------------------------------- |
| `unknown`         | Boot in progress — we have not yet asked Supabase | Loading indicator, no redirects |
| `authenticated`   | Session confirmed — role is Guest or Admin        | The app                         |
| `unauthenticated` | Confirmed no session                              | Login screen                    |

`unknown` is the initial value. The reducer transitions it to `authenticated` or `unauthenticated` once the listener resolves. Route guards must treat `unknown` as a hold-state, not as unauthenticated.

This is the same pattern React Query encodes as `idle | loading | success | error`, and that XState encodes explicitly as state-machine nodes. Booleans are a premature compression of a multi-state reality.

### State Shape: Normalize The Union, Don't Mirror It

You might reason: "We already have `AppSession` as a discriminated union. Just store `AppSession | null` in Redux." That _works_, but it's suboptimal for a specific reason: Redux selectors become chains of narrowings.

```ts
// With AppSession | null stored directly
const role = useAppSelector((state) => state.session.session?.role)
const jwt = useAppSelector((state) => state.session.session?.jwt ?? null)
const isAdmin = useAppSelector((state) => state.session.session?.role === 'admin')
```

Every consumer re-derives the same narrowing. Every re-narrowing is a potential source of inconsistency ("did I remember to check `role === 'admin'` vs truthiness of `jwt`?").

The production-ready shape flattens the discriminated union into named fields and exposes **pre-narrowed selectors** so consumers never touch the raw state:

```ts
interface SessionState {
  role: 'guest' | 'admin' | null // null when authStatus !== 'authenticated'
  authStatus: 'unknown' | 'authenticated' | 'unauthenticated'
  jwt: string | null // null for Guest sessions AND unauthenticated
  startedAt: number | null // null when unauthenticated
}
```

Every field is explicitly nullable. Every field has a single meaning. The **selectors are the public API**; the state shape is a private implementation detail.

### Selectors Are The Encapsulation Boundary

Components never read `state.session.*` directly. They import named selectors:

```ts
import { selectRole, selectAuthStatus, selectJwt } from '@/store/slices/sessionSlice'
```

Why this matters:

1. **Refactor safety.** Rename the state shape, keep selector signatures stable → zero consumer churn. Without selectors, every `state.session.role` callsite is a breaking change.
2. **Memoization boundary.** If derived state gets expensive (e.g., `selectIsAdmin = (s) => s.session.role === 'admin'`), wrap in `createSelector` from Reselect in one place — every consumer benefits automatically.
3. **Testability.** Slice tests assert against selectors; they don't assert against state keys. This lets the internal shape evolve without test churn.

This is the **Repository Pattern** applied to Redux: the slice is a repository of auth facts; selectors are its query methods.

### The Apollo Link Reads From Redux — Not From `auth.ts`

Previewing Task 5 so you understand why Task 3's contract matters: Apollo's `SetContextLink` subscribes to the Redux store, and on every GraphQL request it reads `selectJwt(state)` to inject the `Authorization` header.

This is why `jwt` must be a top-level, stable, nullable field — the Apollo link cannot tolerate a shape like `session?.jwt` that shifts depending on narrowing. Every request it issues must be able to synchronously read the current JWT (or determine its absence) in a single property access.

If Task 3's shape is wrong, Task 5 breaks. If Task 3's selectors are inconsistent, every consumer in Phase 1 carries a subtle bug.

### Immer Makes Mutation Safe — But Only Inside Reducers

Redux Toolkit reducers use Immer under the hood. That means this compiles and is correct:

```ts
setSession(state, action) {
  state.role = action.payload.role   // looks like mutation, isn't
  state.jwt = action.payload.jwt
}
```

What you _cannot_ do is mutate Redux state **outside** a reducer. Immer's "draft" is only active during the reducer's execution. A selector that tries to push into an array on read is a bug that will ship to production and only surface under load.

Rule: **inside reducers, write mutation-style. Outside reducers, treat state as immutable.**

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Audit The Existing Phase 0 Scaffold

[src/store/slices/sessionSlice.ts](src/store/slices/sessionSlice.ts) currently contains:

```ts
interface SessionState {
  role: 'guest' | 'admin'
  authStatus: 'authenticated' | 'unauthenticated'
  jwt: string
}

const initialState: SessionState = {
  role: 'guest',
  authStatus: 'unauthenticated',
  jwt: '',
}
```

Every design decision in this scaffold is **wrong** for Phase 1. Before writing any code, identify each flaw. Your task document should note all of them — this is a test of whether you've internalized the Engineering Context above.

> **TODO:** `[Action required by Junior]` — List at least **four** specific defects in the Phase 0 shape, each with its product consequence. Drop them into the `[Audit]:` block below. Do not write the replacement shape yet.

```
[Audit]:
- Defect 1: No usage of reducers
- Defect 2: Sessions should not be directly editable: `session.jwt = {value}`, force callers to use pre-defined export functions and values.
- Defect 3: SessionState needs to include null values on each property, this is important since by default all values should be null
- Defect 4: initialSession should use a helper: `setSession` instead of a default configured object.
```

### Step 2 — Replace The Slice With The Production Shape

Rewrite [src/store/slices/sessionSlice.ts](src/store/slices/sessionSlice.ts) from scratch. The scaffold below provides the skeleton; every reducer body and every selector is a TODO.

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { AppSession } from '@/lib/auth'
import type { RootState } from '@/store'

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated'

// Note: this interface is EXPORTED for test files only. Application code
// must go through the selectors below — never read state.session.* directly.
export interface SessionState {
  role: 'guest' | 'admin' | null
  authStatus: AuthStatus
  jwt: string | null
  startedAt: number | null
}

// ─── Initial State ──────────────────────────────────────────────────────────
// authStatus starts as 'unknown' — the listener hook (Task 4) will transition
// it to 'authenticated' or 'unauthenticated' once getCurrentSession resolves.
// Every other field is null until a session is known.

const initialState: SessionState = {
  role: null,
  authStatus: 'unknown',
  jwt: null,
  startedAt: null,
}

// ─── Slice ──────────────────────────────────────────────────────────────────

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // TODO: [Action required by Junior] - Implement setSession
    // - Accepts a PayloadAction<AppSession>
    // - Copies every field from the payload into state
    // - Sets authStatus to 'authenticated'
    // - Remember: Immer lets you write as if mutating. Do NOT return a new object.
    setSession(state, action: PayloadAction<AppSession>) {
      state.authStatus = 'authenticated'
      state.jwt = action.payload.jwt
      state.role = action.payload.role
      state.startedAt = action.payload.startedAt
    },

    // TODO: [Action required by Junior] - Implement clearSession
    // - Takes no payload
    // - Resets role, jwt, startedAt to null
    // - Sets authStatus to 'unauthenticated' (NOT 'unknown' — we now know there is no session)
    // - Why this distinction matters: 'unknown' is a boot-time state. Once we've
    //   observed "no session," the correct terminal state is 'unauthenticated'.
    clearSession(state) {
      state.authStatus = 'unauthenticated'
      state.jwt = null
      state.role = null
      state.startedAt = null
    },
  },
})

export const { setSession, clearSession } = sessionSlice.actions
export default sessionSlice.reducer

// ─── Selectors ──────────────────────────────────────────────────────────────
// These are the public read API. Every component and every Apollo link reads
// through these — never through state.session.* directly.

// TODO: [Action required by Junior] - Implement selectRole
// - Returns state.session.role (type: 'guest' | 'admin' | null)
export const selectRole = (state: RootState): 'guest' | 'admin' | null => {
  return state.session.role
}

// TODO: [Action required by Junior] - Implement selectAuthStatus
export const selectAuthStatus = (state: RootState): AuthStatus => {
  return state.session.authStatus
}

// TODO: [Action required by Junior] - Implement selectJwt
// - Returns state.session.jwt (type: string | null)
// - This is the selector Apollo's authLink will call on every GraphQL request.
//   It MUST be a plain field access — no computation, no narrowing.
export const selectJwt = (state: RootState): string | null => {
  return state.session.jwt
}

// TODO: [RESEARCH REQUIRED] - Implement selectIsAdmin as a DERIVED selector.
// Read the Reselect docs (https://github.com/reduxjs/reselect) and decide:
// should this be a plain function, or should it use createSelector? The correct
// answer depends on whether the derivation is expensive AND whether consumers
// re-run on unrelated state changes. Justify your choice in the Challenge below.

// [Answer]: It's more performant here to use this as a plain function. This skips the step required by redux to complete it's argument comparison. With only a single comparison happening here, it's not expensive enough to deem using createSelector.
export const selectIsAdmin = (state: RootState): boolean => {
  return state.session.role === 'admin'
}
```

### Step 3 — Re-export Action Creators From A Barrel (Optional But Recommended)

If Phase 0 established a store barrel file (`src/store/index.ts`), the raw pattern today is:

```ts
import { setSession } from '@/store/slices/sessionSlice'
```

That's acceptable. A stricter convention at FAANG scale is to re-export action creators from the store's public surface so the slice file is an implementation detail:

```ts
// src/store/actions.ts
export { setSession, clearSession } from './slices/sessionSlice'
```

> **TODO:** `[Decision required by Junior]` — Decide: barrel, or direct import from slice? Either is defensible. State your choice and the tradeoff you accepted in the Challenge below.
> [Answer]: Use direct import. The cost of knowing where each function lives `(number of consumers) × (rate of slice reorganization)`
> is so low: 1 \* 3 = 3, that it simply makes more sense to use direct import where the cognitive cost is near 0.

### Step 4 — Verify Type-Check

From the project root:

```bash
npx tsc --noEmit
```

Expected: zero errors. If you see errors involving `RootState`, your selector imports are wrong. If you see errors on `AppSession`, your `auth.ts` export shape drifted from what Task 2 agreed to — go fix `auth.ts` first, then come back.

### Step 5 — Write A Minimal Unit Test

Create `src/store/slices/sessionSlice.test.ts`. This is the first real test file in the codebase; treat it as a template for every subsequent slice.

```ts
import type { AppSession } from '@/lib/auth'
import type { RootState } from '@/store'

import reducer, {
  setSession,
  clearSession,
  selectRole,
  selectAuthStatus,
  selectJwt,
  selectIsAdmin,
  type SessionState,
} from './sessionSlice'

const INITIAL: SessionState = {
  role: null,
  authStatus: 'unknown',
  jwt: null,
  startedAt: null,
}

// Helper to wrap a SessionState into something the selectors can consume.
// We only need the .session slice — the rest of RootState is irrelevant here.
const rootFrom = (session: SessionState): RootState => ({ session }) as unknown as RootState

describe('sessionSlice', () => {
  it('has the correct initial state', () => {
    // TODO: [Action required by Junior] - Assert reducer(undefined, {type:'@@INIT'}) equals INITIAL
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(INITIAL)
  })

  describe('setSession', () => {
    it('applies an admin session', () => {
      // TODO: [Action required by Junior]

      // Build an AppSession with role 'admin', jwt 'abc', startedAt 1000
      const testSession = {
        role: 'admin',
        jwt: 'abc',
        startedAt: 1000,
      } satisfies AppSession

      // Dispatch setSession
      const testState = reducer(undefined, setSession(testSession))

      // Assert all fields including authStatus === 'authenticated'
      expect(testState.authStatus).toEqual('authenticated')
      expect(testState.jwt).toEqual('abc')
      expect(testState.role).toEqual('admin')
      expect(testState.startedAt).toEqual(1000)
    })

    it('applies a guest session', () => {
      // TODO: [Action required by Junior]

      // Build an AppSession with role 'guest', jwt null, startedAt 1000
      const testSession = {
        role: 'guest',
        jwt: null,
        startedAt: 1000,
      } satisfies AppSession

      // Dispatch setSession
      const testState = reducer(undefined, setSession(testSession))

      // Assert authStatus === 'authenticated' and jwt === null
      expect(testState.authStatus).toEqual('authenticated')
      expect(testState.jwt).toEqual(null)
      expect(testState.role).toEqual('guest')
      expect(testState.startedAt).toEqual(1000)
    })
  })

  describe('clearSession', () => {
    it('resets role/jwt/startedAt and sets authStatus to unauthenticated (NOT unknown)', () => {
      // TODO: [Action required by Junior]

      // Start from a populated admin state,
      const testPayload = {
        role: 'admin',
        jwt: 'abc',
        startedAt: 1000,
      } satisfies AppSession

      const startState = reducer(undefined, setSession(testPayload))

      // Dispatch clearSession
      const testState = reducer(startState, clearSession())

      // verify: role === null, jwt === null, startedAt === null, authStatus === 'unauthenticated'
      expect(testState.authStatus).toEqual('unauthenticated')
      expect(testState.jwt).toEqual(null)
      expect(testState.role).toEqual(null)
      expect(testState.startedAt).toEqual(null)
    })
  })

  describe('selectors', () => {
    it('selectRole, selectAuthStatus, selectJwt return the correct field', () => {
      // TODO: [Action required by Junior]
      const testPayload = {
        role: 'admin',
        jwt: 'test',
        startedAt: 1234,
      } satisfies AppSession

      const testState = reducer(undefined, setSession(testPayload))

      const testRootState = rootFrom(testState)

      expect(selectAuthStatus(testRootState)).toEqual('authenticated')
      expect(selectJwt(testRootState)).toEqual('test')
      expect(selectRole(testRootState)).toEqual('admin')
    })

    it('selectIsAdmin returns true only when role is admin', () => {
      // TODO: [Action required by Junior]
      // Cover three cases:
      // role = 'admin'
      let testPayload: AppSession = {
        role: 'admin',
        jwt: 'test',
        startedAt: 1000,
      }
      let testState = reducer(undefined, setSession(testPayload))
      let testRootState = rootFrom(testState)

      expect(selectIsAdmin(testRootState)).toEqual(false)

      // role = 'guest'
      testPayload = {
        role: 'guest',
        jwt: null,
        startedAt: 1000,
      }

      testState = reducer(undefined, setSession(testPayload))
      testRootState = rootFrom(testState)

      expect(selectIsAdmin(testRootState)).toEqual(false)

      // role = null
      testState = reducer(testState, clearSession())
      testRootState = rootFrom(testState)

      expect(selectIsAdmin(testRootState)).toEqual(false)
    })
  })
})
```

Run:

```bash
npx jest src/store/slices/sessionSlice.test.ts
```

> Note on reducer-under-test style: we test `reducer(state, action)` directly — not against a live store. Reducers are pure functions; pure functions are trivially testable with input → output assertions. Do not reach for `configureStore()` in reducer tests — that is integration territory.

### Step 6 — Delete The Smoke Test Remnants From Task 2

[src/app/page.tsx](src/app/page.tsx) is currently a stub (`<h1>Portfolio Website - Windows 7</h1>`). Leave it. Task 9 will rewrite it. This step is explicit because Juniors commonly re-add a smoke test at each phase; resist.

### Step 7 — Confirm Redux DevTools See The New Shape

1. Run `npm run dev`.
2. Open the browser's Redux DevTools extension.
3. Inspect the `session` slice. You should see:
   ```json
   { "role": null, "authStatus": "unknown", "jwt": null, "startedAt": null }
   ```
4. In the "Dispatch" panel, fire a manual action:
   ```json
   {
     "type": "session/setSession",
     "payload": { "role": "admin", "jwt": "test-jwt", "startedAt": 1713312000000 }
   }
   ```
5. Confirm the state updates to `authStatus: 'authenticated'`, the payload fields copied in, no extra keys.
6. Fire `{ "type": "session/clearSession" }`. Confirm `authStatus: 'unauthenticated'` (not `'unknown'`), all other fields null.

If any of these behave differently, your reducer has a bug — fix it before the tests will pass.

---

## 🛡️ Challenge & Review

Complete every TODO, fill the `[Audit]:` block, and make the unit tests green before answering.

**1.** The Phase 0 scaffold modeled `authStatus` as `'authenticated' | 'unauthenticated'`. Task 3 widens it to include `'unknown'`. A teammate pushes back: "Can't we just default to `'unauthenticated'` until the listener dispatches? Three states is over-engineering." Write a precise technical argument for why `'unknown'` is load-bearing. Your answer must address: (a) the exact bug that occurs with only two states during app boot; (b) how route guards (Task 10) and the login screen (Task 9) must behave differently for `'unknown'` vs `'unauthenticated'`; (c) the general principle this is a specific instance of — state machines vs booleans.

```
[Answer]: (a) For 90ms on every page load, the state defaults as "unknown" until the listener resolves and determined the state of authentication. (b) Unknown is used to alert the frontend to freeze redirects until the state has been determined. This tells the login page to show a loading animation. "unauthenticated" breaks the freeze on redirects. This tells the login page to load the login screen. (c) Booleans only contain two values: true or false. State machines allow as many states as desired (probably unlikely to hit technical limitation), and in this case we don't want to lose 'unknown' since it will cause of the bug that will occur on every reload due to the page load delay.
```

**2.** The scaffold asks you to export selectors even for trivial field accesses (`selectRole`, `selectJwt`). A teammate argues: "For one-field selectors, just do `state.session.role` inline — one line, zero indirection." State two distinct technical reasons the selector-as-public-API pattern wins anyway, each with a concrete scenario. At least one of your reasons must describe a refactor that becomes trivial _only_ because selectors exist.

```
[Answer]: 1. Selectors trivialize any runtime errors that could occur from missing the change on a file that contains `state.session.role` when role gets renamed to 'userRole'. Change the implemenetation detail and all references automatically get effected. 2. "If a requirement adds conditional derivation — e.g., Guests active over 24h return 'returning-guest' — that logic lives in one selector body rather than being duplicated across every call-site."
```

**3.** The `selectIsAdmin` TODO asked whether to use a plain function or `createSelector` from Reselect. State your choice, and — more importantly — state **the general rule** that determined it. Your rule must reference (a) whether the derivation is expensive, and (b) whether the selector's inputs change independently of its outputs. A correct answer explains when Reselect _would_ be the right call, even if your choice here is plain function.

```
[Answer]: It's more performant here to use this as a plain function. This skips the step required by redux to complete it's argument comparison. With only a single comparison happening here, it's not expensive enough to deem using createSelector. "Reselect wins when derivation cost exceeds memoization overhead, OR when the output is a new reference that would cause spurious re-renders".
```

**4.** Redux Toolkit reducers use Immer. You wrote:

```ts
setSession(state, action) {
  state.role = action.payload.role
}
```

This looks like direct mutation but produces a new immutable state. Explain in your own words:
(a) how Immer achieves this mechanically — what is a "draft"?
(b) what happens if you try to mutate state in a selector or a React component instead of a reducer.
(c) an example of a legal Immer mutation that would be **illegal** if Immer weren't involved (e.g., `state.someArray.push(x)`).

```
[Answer]: (a) using `state` tells Immer to create a temporary draft which logs read & write requests from a proxy. The reducer can then use this draft to safely apply the changes. (b) Directly mutating a state doesn't return a new object for reference by React, making the state be ignored, and no rerender to occur. (c) Without Immer, direct mutation like `state.someArray.push(x)` doesn't return a new reference for react's change detection, whereas with Immer, `state.someArray.push(x)` produces a new object reference for react to identify.
```

**5.** `[DOCS INVESTIGATION]` — In Task 5, Apollo's `SetContextLink` will subscribe to the Redux store and read `selectJwt` on every GraphQL request. Read the Apollo Client docs for `SetContextLink` (or your Phase 0 implementation of `ApolloProvider`) and answer:

- How does Apollo "subscribe" to Redux — is it a direct `store.subscribe()` or is the link called fresh on each request?
- What breaks if `selectJwt` sometimes returns `'' ` (empty string) and sometimes `null` — why does **consistent nullability** matter for the auth header?

```
[Answer]: Apollo subscribes via a link called on each request, it redirects every request to authenticate against supabase headers. A `''` value would alter the authentication payload and Supabase would attempt to execute it's authorization request with a malformed bearer. Null represent a missing header and causes Apollo to fallback to the 'Guest' ANON_KEY which is correct for security-tightness. Falling back to an unauthorized status, making sure malicious requests can't appear.
```

---
