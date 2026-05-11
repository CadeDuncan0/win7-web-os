<!-- task 5 - Wire Dynamic JWT into Apollo Auth Link began: 2026-04-21 | completed: 2026-04-25 -->

### 🎯 Task 5: Wire Dynamic JWT into Apollo Auth Link

---

#### 🧠 Engineering Context & Rationale

##### What Phase 0 Scaffolded — And What It Misses

Phase 0 stood up [`src/lib/apollo-client.ts`](src/lib/apollo-client.ts) with a functional `SetContextLink` + `HttpLink` chain. Every GraphQL request today sends:

```
apikey:         <NEXT_PUBLIC_SUPABASE_ANON_KEY>
Authorization:  Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY>
```

That header is **constant**. It does not know about the Admin JWT. Every request — guest session, admin session, no session — sends the same anon key. Supabase's RLS policies evaluate the request as the `anon` role, and the Admin view is invisible even when an Admin is signed in.

Task 5's job: make the `Authorization` header **track the current auth state**. Admin signed in → admin JWT. Otherwise → anon key. The moment `sessionSlice` flips to `'authenticated'`, Apollo's very next request must carry the new credential.

##### The Link Chain — Apollo's Middleware Model

Apollo's transport is built as a **composable link chain**. Each link is a function that receives an operation and returns an operation (or a response). Chains are composed left-to-right; the last link (`HttpLink`) terminates the chain by issuing the network request.

```
                     GraphQL operation dispatched
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────┐
│ Apollo Client                                              │
│                                                            │
│   ┌──────────────────────────────────────────────────┐     │
│   │  SetContextLink (authLink)                       │     │
│   │    Callback fires PER REQUEST                    │     │
│   │                                                  │     │
│   │    1. store.getState()                           │     │
│   │    2. selectJwt(state)                           │     │
│   │    3. return { headers: { apikey, Auth } }       │     │
│   └──────────────────────────────────────────────────┘     │
│                                 │                          │
│                                 ▼                          │
│   ┌──────────────────────────────────────────────────┐     │
│   │  HttpLink                                        │     │
│   │    POST to NEXT_PUBLIC_GRAPHQL_URL                │     │
│   │    with merged headers                           │     │
│   └──────────────────────────────────────────────────┘     │
│                                 │                          │
└─────────────────────────────────┼──────────────────────────┘
                                  ▼
                       Supabase GraphQL endpoint
```

The power of this model: the authLink is a **function, not a long-lived observer**. To add new behavior (e.g. request logging, error retries) you insert another link, you do not modify the ones that exist.

##### "Subscribes to Redux" Is A Metaphor, Not A Mechanism

A common explanation says the authLink "subscribes to the Redux store." This is useful shorthand, but mechanically **false** — and the distinction matters.

| Subscription (what the link is NOT)                                 | Per-Request Read (what the link IS)                    |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| Calls `store.subscribe(callback)` once at startup                   | Runs its callback on every new Apollo operation        |
| Maintains a cached copy of relevant state                           | Holds no state — reads fresh on each request           |
| Callback fires on every Redux dispatch (including unrelated slices) | Fires only when a GraphQL query is actually dispatched |
| Must handle unsubscription on teardown                              | Nothing to unsubscribe — it's a plain function         |

The freshness guarantee you want — "the next request after sign-in uses the new JWT" — comes **for free** from the per-request read model. `dispatch(setSession(...))` is synchronous. By the time any subsequent GraphQL request triggers the authLink callback, `store.getState()` already reflects the new JWT. No subscription machinery required.

> **Contrast with Task 4's `useAuthListener`:** that hook _does_ use a true observer pattern (`supabase.auth.onAuthStateChange`) because auth events arrive asynchronously from outside React's control. Apollo's authLink does not, because it only needs state when _we_ trigger a request.

> **And contrast with Task 10's Next.js middleware** (coming later): middleware runs at the **edge**, in the HTTP request lifecycle, before React renders. Apollo's authLink runs in the **browser**, at GraphQL operation time, after React has rendered. Same word, different position in the stack — do not conflate them.

##### Reactive Freshness Without Subscriptions — Timeline

```
t=0ms    User clicks "Sign in as Admin"
t=10ms   signInAsAdmin() → supabase.auth.signInWithPassword
t=200ms  Supabase returns JWT
t=201ms  onAuthStateChange fires 'SIGNED_IN'
t=202ms  useAuthListener → dispatch(setSession({ jwt: 'eyJhbGci...' }))
t=203ms  sessionSlice updated synchronously → state.session.jwt = 'eyJhbGci...'
         │
         │   (No Apollo activity yet. Redux is current. Apollo is waiting.)
         │
t=500ms  Component subscribed to <Query> re-renders
t=501ms  New GraphQL operation dispatched
         │
         ├── SetContextLink callback fires
         ├── store.getState() reads the current state (post-dispatch)
         ├── selectJwt() returns 'eyJhbGci...'
         └── Authorization: Bearer eyJhbGci...
         │
t=502ms  Request POSTs to Supabase with the Admin JWT
t=600ms  Supabase returns admin-visible rows (RLS sees 'admin' role)
```

Nothing here "subscribes" to anything. Redux is updated; Apollo is dormant; a render triggers a new operation; the authLink reads state at that precise moment; the header is correct.

##### The Auth Header Pattern — Why Both `apikey` AND `Authorization`

Supabase's edge gateway requires **two distinct headers** on every request:

| Header                          | Consumer                        | Purpose                                                                        |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `apikey`                        | Supabase API gateway (Kong)     | Validates the request is from a known project; always the anon key client-side |
| `Authorization: Bearer <token>` | Postgres / RLS policy evaluator | Identifies the acting user; controls which rows RLS exposes                    |

The `apikey` never changes. It's the anon key, always, everywhere. The `Authorization` header is what swaps between anon and admin JWT. A correct request always has both — dropping either causes Supabase to reject with a 401.

##### Why Redux Is The JWT Source Of Truth

You might reason: "Supabase stores the session in localStorage. The authLink could read it directly with `supabase.auth.getSession()`." This is technically possible and architecturally wrong:

- `supabase.auth.getSession()` is **async** (returns a Promise). The authLink callback would need to be async too, which complicates every downstream link.
- Two sources of truth — Supabase's client AND Redux — drift. A bug where one updates and the other doesn't is nearly impossible to debug.
- The Admin email gate in `useAuthListener` already validated the JWT before dispatching. Redux contains the _validated_ JWT; Supabase contains the _raw_ JWT. They are not the same thing.

**Redux is the validated, reactive, single source of auth truth.** The authLink reads exclusively from it.

---

#### 🛠️ Step-by-Step Implementation & Code

##### Step 1 — Audit The Existing Scaffold

Current state of [`src/lib/apollo-client.ts`](src/lib/apollo-client.ts):

```ts
const authLink = new SetContextLink((prevContext, _) => {
  return {
    headers: {
      ...prevContext.headers,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  }
})
```

Two observations before you touch anything:

1. The `...prevContext.headers` spread is already correct. It preserves any headers an upstream link might set. Never remove this — always extend, never replace.
2. The `Authorization` value is hardcoded to the anon key. That is the single line to make dynamic.

> **TODO:** `[Action required by Junior]` — Before writing code, list the three imports you need to add to this file. Two come from `@/store` concerns, one is an existing export from `sessionSlice`. Answer in Challenge Q1.

##### Step 2 — Wire Redux Into The Callback

Rewrite the authLink. Every reducer body, every conditional is a TODO:

```ts
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'

// TODO: [Action required by Junior] - Add imports
// - store from '@/store'               — needed to call .getState()
// - selectJwt from the session slice   — needed to read the JWT from state

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
})

const authLink = new SetContextLink((prevContext, _) => {
  // TODO: [Action required by Junior] - Read the current JWT from Redux
  // - Get the root state synchronously: store.getState()
  // - Pull the JWT via the selector: selectJwt(state)
  // - The selector returns string | null. Name the binding `jwt`.

  // TODO: [Action required by Junior] - Build the Authorization value
  // - If jwt is non-null: `Bearer ${jwt}`
  // - If jwt is null (unauthenticated or guest): fall back to the anon key
  // - Reason: Supabase rejects requests with a missing or malformed Bearer.
  //   A well-formed Bearer anon key is the documented "public identity" value.

  return {
    headers: {
      ...prevContext.headers,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // TODO: [Action required by Junior] - Replace the hardcoded value with
      // the dynamic Authorization you built above.
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  }
})

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
  },
})

export default apolloClient
```

> **Reinforcement from Task 4's REVIEW log:** `store.getState()` is a **read** operation. It does not require wrapping in `dispatch()` — `dispatch` is only for **writes** (actions). The two halves of Redux's public API:
>
> | Action               | API                                        |
> | -------------------- | ------------------------------------------ |
> | Write (change state) | `store.dispatch(actionCreator(payload))`   |
> | Read (inspect state) | `store.getState()` — then apply a selector |
>
> The authLink is a pure reader. It never dispatches.

##### Step 3 — Verify In DevTools

Run the dev server:

```bash
npm run dev
```

Open the app. Open DevTools → Network tab. Filter for requests to your Supabase GraphQL endpoint (`Fetch/XHR`).

| Scenario                                               | Expected `Authorization` header      |
| ------------------------------------------------------ | ------------------------------------ |
| Unauthenticated session (authStatus=`unauthenticated`) | `Bearer <anon_key>`                  |
| Guest session (role=`guest`, jwt=`null`)               | `Bearer <anon_key>`                  |
| Admin session (role=`admin`, jwt=`<token>`)            | `Bearer eyJhbGci...` (the admin JWT) |

To actually see a GraphQL request fire, you can temporarily drop a dummy `useQuery` into a client component. Any query, any field — the only thing you're verifying is that headers are correct. Remove the temporary code after testing.

> **TODO:** `[Action required by Junior]` — Capture three screenshots (or console dumps) showing the Authorization header in each of the three states. Paste nothing here; reference in Challenge Q3 that you've confirmed the swap.

---

#### 🛡️ Challenge & Review

Complete all TODOs and confirm the three-state verification before answering.

**1.** The task description and many Apollo tutorials casually say the authLink "subscribes to the Redux store." Mechanically, it does not call `store.subscribe()`. Answer in two parts:

- **(a)** What does the authLink actually do to stay in sync with Redux? Describe the per-request read model in one sentence.
- **(b)** If a well-meaning engineer _did_ rewrite the authLink to call `store.subscribe()` and cache the JWT in a closure variable, what specific class of bug would they introduce? Name the failure mode.

```
[Answer]: (a) It uses its callback function on every request to get the current state and creates the header response each time. (b) Because the callback could run before the dispatch (a synchronous function), the Apollo query could fire using a stale cachedJWT. In the per request model, the state is read at the exact instant of a fired query, resulting in a value that can never be stale.
```

**2.** `src/app/layout.tsx` (or your root layout file) nests providers as `<ReduxProviderWrapper>` wrapping `<ApolloProviderWrapper>`. A teammate proposes reversing the nesting — Apollo outside, Redux inside — arguing "order doesn't matter for Providers." Explain precisely what breaks at runtime, referencing the exact line of code in your authLink that requires the current ordering.

```
[Answer]: Because the Provider is stored in the Redux wrapper, and `useAuthListener.ts` is what calls the dispatch, nothing would break in this specific scenario. However, order matters is an architectural best practice, and should be taken into consideration.
```

**3.** `selectJwt` returns `null` for unauthenticated and guest sessions. You fall back to the anon key in the `Authorization` header. A teammate suggests: "Just send an empty string — `Bearer ` — when there's no JWT. Supabase will understand." Write a precise rebuttal addressing:

- What Supabase does with `Authorization: Bearer ` (empty token) vs `Authorization: Bearer <anon_key>`
- Why the anon key is the documented public identity, not a placeholder
- Why this directly connects to Phase 3's RLS policy design (hint: the anon key's JWT claim encodes a role of `anon` — what does RLS do with that vs. no role at all?)

```
[Answer]: [Verification]: useQuery states all checked and are working properly. (a) Supabase with an empty token will reject with a 401 error, and with the anon key, it validates the user and returns the role-filtered data. (b) The anon key allows access to the database even in unathenticated and guest sessions. (c) RLS is able to use the `anon` role encoded in a non-admin session to filter requests to only guest-valid data, with no role supabase wouldn't know what data to default to.
```

---

### Gating

You may not `SCAN TASK 5` until:

1. Every in-file `// TODO:` block in [`src/lib/apollo-client.ts`](src/lib/apollo-client.ts) is resolved.
2. The three-state Authorization header verification in Step 3 has been confirmed manually in DevTools.
3. All three `[Answer]:` blocks are populated.

On completion, Task 5 finishes the backend-facing auth wiring for Phase 1. The runtime spine — Supabase events → `useAuthListener` → Redux → Apollo — is now fully reactive. The remaining Phase 1 work pivots to the UI: Aero Glass design tokens (Task 6), Storybook (Task 7), the login screen itself (Tasks 8–9), and edge-level route protection (Task 10).
