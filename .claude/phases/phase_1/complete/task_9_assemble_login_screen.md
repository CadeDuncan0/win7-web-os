<!-- Created: 2026-05-02 01:01:17 | Completed: 2026-05-06 -->

### 🎯 Task 9: Assemble Login Screen Page

---

#### 🧠 Rationale

Task 8 produced three dumb primitives. Task 9 is the **first time in this codebase that a page-level component owns coordinated state across primitives, talks to async modules, and dispatches into Redux on its own behalf.** Get the choreography right and Task 10's middleware drops in cleanly; get it wrong and you will refactor twice.

There are **two distinct sign-in paths** with different dispatch ownership. This is the single most important fact in this task — every other decision flows from it:

| Step                  | Guest                                      | Admin                                                                                         |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Trigger               | Click `AccountTile`                        | Click tile → type password → submit                                                           |
| Network               | None                                       | `signInAsAdmin(pw)` → Supabase                                                                |
| Who dispatches Redux? | **The page** — `dispatch(setSession())`    | **`useAuthListener`** — fires on Supabase's `SIGNED_IN` event                                 |
| Side-effect storage   | `sessionStorage` (via `beginGuestSession`) | `localStorage` (Supabase SDK)                                                                 |
| Routing trigger       | After page dispatches                      | After `signInAsAdmin` returns `ok: true` (the listener has already dispatched by that moment) |

Why does the page dispatch for Guest but not Admin? Because Supabase has no awareness of Guest sessions — `onAuthStateChange` will never fire for `beginGuestSession`. The listener only sees Supabase events. So Guest is the page's responsibility end-to-end; Admin is the listener's responsibility, and the page only owns the **UI orchestration around** the call.

State machine for the page:

```
                    ┌─────────────┐
                    │   IDLE      │  selected = null
                    └──────┬──────┘
              click Guest  │  click Admin
                  ┌────────┴────────┐
                  ▼                 ▼
         ┌─────────────┐    ┌─────────────────┐
         │  ROUTING    │    │  PASSWORD_OPEN  │  selected = 'admin'
         │  (guest)    │    │  password = ""  │  input auto-focused
         └─────────────┘    └────────┬────────┘
                                     │ submit
                                     ▼
                            ┌─────────────────┐
                            │   SUBMITTING    │  form disabled
                            └────────┬────────┘
                          ok=true    │    ok=false
                            ┌────────┴────────┐
                            ▼                 ▼
                       ROUTING(admin)   PASSWORD_OPEN
                                        + error set
                                        + password cleared
                                        + input refocused
```

Lifting state to the page is non-negotiable. If the AccountTile owned `selected`, both tiles could be `selected: true` simultaneously, and the password row would have no signal that knows _which_ tile to mount under. This is the same logic Task 8's Rationale used for the primitives — applied one level up.

**On animation strategy:** Framer Motion exists for one transition that CSS cannot express cleanly — the **password row mount/unmount on Admin selection**. `AnimatePresence` is the only ergonomic way to animate an element _out_ before React removes it from the DOM. Tile hover/selection visuals are already in CSS (Task 8) — do not re-animate them with Framer Motion. Use the right tool for each transition; don't duplicate them.

---

#### 🛠️ Implementation Outline

##### Step 0 — Install Framer Motion

`framer-motion` (now also published as `motion`) is in the project's stack reference but not yet a dependency.

```bash
npm install framer-motion
```

```
// TODO: [Decision required by Junior] - Pick framer-motion vs motion. The newer
// `motion` package is the same library renamed; the React import surface is
// identical (`motion/react`). framer-motion is what the CLAUDE.md stack
// reference names by canonical title. Pick one, justify in Q1 of Challenge
// & Review, and use that import path consistently across the codebase.
```

---

##### Step 1 — Route Layout

Three routes are touched in this task:

```
src/app/
  page.tsx           ← currently a smoke surface — replace with redirect('/login')
  login/
    page.tsx         ← NEW. The Windows 7 login screen.
    Login.module.css ← NEW. Page-composition layout only (no token-level styling — those live in primitives' modules).
  desktop/
    page.tsx         ← NEW. Placeholder destination ("Welcome, {role}"). Task 10 protects it.
```

```tsx
// src/app/page.tsx — TODO: [Action required by Junior]
// Replace the existing smoke test with a server-component redirect.
// Use `redirect('/login')` from 'next/navigation'. NO 'use client' here —
// this is a Server Component, and `redirect()` issues an HTTP 307 at the
// edge before any HTML ships. That is faster and more deterministic than a
// client-side router.replace() in a useEffect.
```

```tsx
// src/app/desktop/page.tsx — TODO: minimal placeholder
// 'use client' so we can read Redux. Render `<h1>Welcome, {role}</h1>`
// using selectRole. This page exists ONLY so Task 9's routing has a target.
// Task 10 will protect it; Phase 2 replaces it with the real desktop.
```

---

##### Step 2 — The Login Page Component

```tsx
// src/app/login/page.tsx — TODO: full composition
// 'use client' — this page reads Redux (authStatus), calls useRouter,
// dispatches actions, and orchestrates async sign-in.
//
// Local state (page owns ALL of it; primitives stay dumb):
//   - selected:   'guest' | 'admin' | null     (which tile is active)
//   - password:   string                       (controlled value)
//   - error:      string | undefined           (sign-in failure message)
//   - submitting: boolean                      (request in flight)
//
// Refs:
//   - passwordRef: Ref<HTMLInputElement>       (imperative focus on Admin select)
//
// Hooks read:
//   - useRouter()                              (programmatic /desktop navigation)
//   - useAppDispatch()                         (Guest dispatch)
//   - useAppSelector(selectAuthStatus)         (already-authed redirect — see below)
//
// IMPORTANT — already-authed redirect:
//   If a visitor lands on /login while authStatus === 'authenticated', bounce
//   them to /desktop. Implement as:
//     useEffect(() => {
//       if (authStatus === 'authenticated') router.replace('/desktop')
//     }, [authStatus, router])
//   Use REPLACE not PUSH — /login should not be in the history stack for an
//   already-authed visitor (back-button would loop).

export default function LoginPage() {
  // TODO: declare state (useState ×3) and ref (useRef<HTMLInputElement | null>)
  // TODO: declare router, dispatch, authStatus selectors
  // TODO: implement the already-authed redirect effect described above

  const handleSelectGuest = () => {
    // TODO: [Action required by Junior]
    // 1. Call beginGuestSession() from '@/lib/auth'
    // 2. If !result.ok → setError(result.error); return
    // 3. dispatch(setSession(result.data))
    // 4. router.push('/desktop')
    //
    // NOTE: Do NOT also call router.replace here. Guest sign-in IS a navigation
    // event the user took deliberately; it belongs in history.
  }

  const handleSelectAdmin = () => {
    // TODO: [Action required by Junior]
    // 1. setSelected('admin')
    // 2. setError(undefined)   (clear stale error from a previous attempt)
    // 3. setPassword('')
    // - Do NOT focus the input here. The passwordRef is null until the input
    //   actually mounts (see Step 3 — AnimatePresence). Focus inside an effect
    //   keyed on `selected === 'admin'`.
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    // TODO: [Action required by Junior]
    // - e.preventDefault()
    // - if !password → return  (guards empty submit; SignInButton will be
    //                            disabled too — defense in depth)
    // - setSubmitting(true)
    // - const result = await signInAsAdmin(password)
    // - if !result.ok:
    //     setError(result.error)
    //     setPassword('')
    //     setSubmitting(false)
    //     passwordRef.current?.focus()
    //     return
    // - DO NOT dispatch setSession here. The AuthListener's SIGNED_IN handler
    //   has already done that by the time signInWithPassword resolves.
    // - router.push('/desktop')
    //
    // QUESTION FOR Q3: Why is it correct that this handler does NOT call
    // setSubmitting(false) on the success path? What state transitions for the
    // user's perception while routing is in flight?
  }

  // TODO: focus effect
  // useEffect(() => {
  //   if (selected === 'admin') passwordRef.current?.focus()
  // }, [selected])

  return (
    /* TODO:
       <main className={styles.screen}>
         <div className={styles.tileRow}>
           <AccountTile label="Guest" glyph="👤" selected={selected === 'guest'}
                        disabled={submitting} onSelect={handleSelectGuest} />
           <AccountTile label="Admin" glyph="🔒" selected={selected === 'admin'}
                        disabled={submitting} onSelect={handleSelectAdmin} />
         </div>

         <AnimatePresence>
           {selected === 'admin' && (
             <motion.form
               key="admin-form"
               className={styles.passwordRow}
               onSubmit={handleSubmit}
               initial={{ opacity: 0, y: -8 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -8 }}
               transition={{ duration: 0.15, ease: 'easeOut' }}
             >
               <label htmlFor="admin-password" className={styles.visuallyHidden}>
                 Password
               </label>
               <PasswordInput
                 ref={passwordRef}
                 value={password}
                 onChange={setPassword}
                 error={error}
                 disabled={submitting}
                 placeholder="Password"
               />
               <SignInButton
                 onClick={() => {}}                 // form submit handles it
                 disabled={submitting || !password} // empty pw can't submit
               />
             </motion.form>
           )}
         </AnimatePresence>
       </main>
    */
  )
}
```

> **TODO:** `[Action required by Junior]` — The `<label htmlFor="admin-password">` references an `id` the PasswordInput primitive does not currently accept as a prop. Two options:
>
> 1. Extend `PasswordInputProps` with `id?: string` and forward it to the underlying `<input>`. Cheapest fix, keeps the primitive composable.
> 2. Wrap the `<input>` and label as a single block inside `PasswordInput` itself.
>
> Option 1 is correct — the primitive should accept association IDs as props so callers control the label-input relationship. **Do this before wiring the form.** State the choice and the rejected alternative in Q4.

> **TODO:** `[Action required by Junior]` — `SignInButton` currently renders `type="button"` (Task 8). Inside a `<form>`, the `<form onSubmit>` will fire on Enter regardless, but a `<button>` inside a form **defaults to** `type="submit"` if no type is set. Decide:
>
> - Add a `type?: 'button' | 'submit'` prop to `SignInButton` and pass `'submit'` here, OR
> - Render a separate `<button type="submit" hidden>` for the Enter-key path and keep `SignInButton` purely click-driven.
>
> First option is cleaner. Justify in Q4.

---

##### Step 3 — Page-Level Styles

`Login.module.css` styles **only the page composition** — it must not redefine token-level visuals that already live in primitives. Layout, spacing, the wallpaper.

```css
/* src/app/login/Login.module.css */

.screen {
  /* min-height: 100vh
     display: flex; flex-direction: column; align-items: center; justify-content: center;
     gap: var(--space-6)
     padding: var(--space-7)
     background: <wallpaper>           ← see TODO below
   */
}

.tileRow {
  /* display: flex; gap: var(--space-7); */
}

.passwordRow {
  /* display: flex; align-items: flex-start; gap: var(--space-2);
     width: min(320px, 100%);
   */
}

.visuallyHidden {
  /* The standard sr-only pattern. Hides text visually while keeping it for
     screen readers. The label exists in the DOM so the input is properly
     associated; it's just not painted.
     position: absolute; width: 1px; height: 1px; padding: 0;
     margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;
     border: 0;
   */
}
```

> **TODO:** `[Decision required by Junior]` — The wallpaper. Two paths:
>
> **A.** Inline the radial-gradient stack from `src/app/page.tsx` (lines 47–51). Cheap; gets the screen on the air today. Carries hardcoded rgba/hex into a new file — direct violation of the design-token constraint.
>
> **B.** Promote the wallpaper to a semantic token in `globals.css`:
>
> ```css
> --color-wallpaper-bloom-warm: rgba(180, 220, 255, 0.7);
> --color-wallpaper-bloom-cool: rgba(94, 174, 253, 0.5);
> --surface-desktop-wallpaper:
>   radial-gradient(
>     ellipse 55% 40% at 30% 30%,
>     var(--color-wallpaper-bloom-warm) 0%,
>     transparent 60%
>   ),
>   radial-gradient(
>     ellipse 70% 50% at 75% 75%,
>     var(--color-wallpaper-bloom-cool) 0%,
>     transparent 65%
>   ),
>   radial-gradient(circle at 50% 50%, var(--color-aero-500) 0%, var(--color-aero-700) 90%);
> ```
>
> Then `.screen { background: var(--surface-desktop-wallpaper); }`. Same wallpaper is reused by `/desktop` in Phase 2 — token now or token later, but Phase 1's `[Anti-Pattern: hardcode colors]` says now. **Pick B.** Document why in Q5.

---

##### Step 4 — Wire Up The AuthStatus Redirect Race

There is a subtle ordering bug latent in this composition. Walk through it before writing the effect:

```
t=0ms    Visitor lands on /login (no session). authStatus === 'unauthenticated'.
t=10ms   Page mounts.
t=15ms   useEffect for authStatus runs — authStatus is 'unauthenticated' → no redirect.

Different scenario:
t=0ms    Already-authenticated admin lands on /login (typed URL, used a back-link).
t=10ms   Page mounts. authStatus === 'unknown' (listener hasn't observed yet).
t=15ms   useEffect runs — 'unknown' is NOT 'authenticated' → no redirect. Page paints
         the login UI for ~50ms while the listener resolves.
t=80ms   AuthListener's INITIAL_SESSION fires → setSession(admin) → 'authenticated'.
t=85ms   useEffect re-runs (authStatus changed in deps) → router.replace('/desktop').
```

The 50ms flash is the same FOUC-auth bug Task 3's three-state machine was built to prevent — and the fix is to honor `'unknown'` as a hold-state. While `authStatus === 'unknown'`, render nothing (or a neutral wallpaper-only screen). Once it resolves to either authenticated or unauthenticated, render the page or redirect.

```tsx
// TODO: [Action required by Junior] - early-return guard
// if (authStatus === 'unknown') return <div className={styles.screen} />
//   ↑ wallpaper-only. No tiles, no flash. The visitor sees the same blue
//   gradient that the resolved login screen uses, so there's visual
//   continuity once tiles fade in.
//
// Why an early return instead of conditional rendering inside the JSX?
// Two reasons:
//   1. Symmetry — the redirect-when-authenticated branch ALSO doesn't paint
//      the form. An early return puts both 'don't render the form' branches
//      next to each other.
//   2. AnimatePresence's mount math is simpler when the form never renders
//      during 'unknown'. Otherwise you risk an entrance animation firing
//      the moment authStatus resolves to 'unauthenticated'.
```

---

##### Step 5 — Manual Validation Pass

After every TODO is resolved, exercise these flows in a real browser. Redux DevTools open.

| Flow                                                                                                         | Expected dispatch sequence                                                                              |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Fresh tab → land on `/`                                                                                      | HTTP 307 → `/login` (server-side, no flash). Then `clearSession` from listener.                         |
| Click Guest                                                                                                  | `setSession({role:'guest', jwt:null, ...})` → URL becomes `/desktop` → page renders Welcome.            |
| Reload `/desktop` after Guest sign-in                                                                        | Listener's INITIAL_SESSION→null branch reads sessionStorage marker → `setSession(guest)`.               |
| Close tab, reopen `/desktop`                                                                                 | Guest marker GONE → `clearSession`. (Task 10 will then redirect; today the page just shows blank role.) |
| Click Admin → wrong password → submit                                                                        | No `setSession`. Error message paints under input. Password field cleared and refocused.                |
| Click Admin → correct password → submit                                                                      | Listener fires `SIGNED_IN` → `setSession(admin)` → page navigates to `/desktop`.                        |
| Already-authed admin reloads `/login` directly                                                               | Wallpaper-only flash for ~80ms (the `'unknown'` hold) → `router.replace('/desktop')`.                   |
| Sign out from `/desktop` (use the button on `page.tsx` if you keep one for testing) → tab still at `/login`? | Listener fires `SIGNED_OUT` → `clearSession` → re-renders the login screen.                             |

If any row diverges, fix the page — do not mutate the listener or the slice. They're already correct.

---

##### Step 6 — Storybook Question

Should the login _page_ have a Storybook story?

```
// TODO: [Decision required by Junior]
// Page-level stories require mocking: useRouter, useAppSelector, useAppDispatch,
// AnimatePresence's portal, and a Redux Provider. Storybook addons exist for
// each but the wiring is non-trivial.
//
// CONVENTION FOR THIS CODEBASE: Storybook covers PRIMITIVES, not pages. The
// three primitives' stories from Task 8 already exercise every visual state
// the login page can express. Page-level rendering is integration territory —
// validated manually in Step 5 today, with Cypress in Phase 2.
//
// DO NOT create Login.stories.tsx. Justify the decision in Q6.
```

---

### Gating

You may not request **Task 10 (Route Protection Middleware)** until:

1. `/` redirects to `/login` server-side (no client `useEffect`).
2. `/login` renders the wallpaper-only hold screen during `authStatus === 'unknown'` — confirm visually by throttling network in DevTools.
3. Already-authed visitors hitting `/login` are bounced via `router.replace('/desktop')` (REPLACE, not PUSH — verify by inspecting `history.length`).
4. The Guest path dispatches `setSession` from the page; the Admin path does NOT — the AuthListener owns the Admin dispatch.
5. `framer-motion` (or `motion`) is in `dependencies` (not `devDependencies`) of `package.json`.
6. The wallpaper lives behind `--surface-desktop-wallpaper` in `globals.css`. No literal hex/rgba in `Login.module.css`.
7. `PasswordInput` accepts an `id` prop and the page passes `id="admin-password"`. The `<label htmlFor="admin-password">` is in the DOM (visually hidden) and screen readers announce "Password" on focus.
8. The `SignInButton` `type` decision is made — either it accepts a `type` prop or a hidden submit button covers Enter. Justify either way in Q4.
9. All eight rows of Step 5's manual validation table pass.

---

#### 🛡️ Summary

The page is the **first orchestration layer** in this codebase — it owns multi-primitive state that no single primitive can own correctly. Two facts dominate every interview question this task can produce:

- **Two dispatch owners.** Guest sign-in dispatches from the page itself (Supabase has no awareness of Guest). Admin sign-in dispatches from `useAuthListener`'s `SIGNED_IN` handler. The page never duplicates the Admin dispatch — duplication would race the listener and produce double-renders.
- **`authStatus === 'unknown'` is a hold-state, not a redirect-state.** During `'unknown'` the page renders a wallpaper-only shell so the form never paints during the boot window. This is the same FOUC-auth principle that motivated Task 3's three-state machine — Phase 1's first concrete payoff for that decision.

Other defensible decisions: server-side `redirect('/')` over a client useEffect (no flash); `router.replace` (not `push`) for already-authed bounces (clean history); `AnimatePresence` only on the password row (CSS handles tile selection); wallpaper promoted to a semantic token (no hardcoded colors); page-level Storybook deliberately skipped (primitives carry the visual contract; pages are integration tested).

Get the page right and Task 10 is twenty lines of middleware. Get the dispatch ownership wrong and you will fight phantom re-renders for a week.
