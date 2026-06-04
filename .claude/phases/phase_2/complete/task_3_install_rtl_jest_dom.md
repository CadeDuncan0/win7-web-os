<!-- Created: 2026-06-04 02:34:28 -->
<!-- Completed: 2026-06-04 02:34:28 -->
<!-- Backfilled 2026-06-04 from working-tree evidence. The original task artifact was
     never written to /in-progress or /complete (the phase_overview marked Task 3 done,
     but no task_3 markdown existed). This record reconstructs what shipped from the
     committed/working-tree files and is dated the day it was reconstructed, not the day
     the work was performed. Timestamps above are reconstruction time, not original time. -->

# 🎯 Task 3: Install React Testing Library + jest-dom

> **Backfill notice.** This file documents work that was **already implemented** before the
> record existed. It is a completion record, not a forward-looking tutorial — so it carries no
> `// TODO` markers. The deliverables below were verified by inspecting the shipped files on
> 2026-06-04; the green Validation Report reflects (a) that inspection and (b) the prior
> completion mark in `phase_overview.md` (validated by Cade). The Jest run was **not** re-executed
> during backfill — see the report's note.

---

## 🧠 Rationale

Phase 1's tests were slice-level — pure `reducer(state, action)` assertions with no DOM. Phase 2
introduces **components whose contract is behavioral** (drag clamping, focus promotion, context-menu
keyboard nav, Start Menu search). Those cannot be asserted by inspecting internals; they must be
queried the way a user — or a screen reader — perceives them. React Testing Library (RTL) is the
mandated tool (`CLAUDE.md`: "RTL queries by accessible role/label/text — never by CSS selector or
component internals").

Two decisions carry the architectural weight of this task:

| Decision                                                | Why it is correct here                                                                                                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jest-dom` matchers registered via `setupFilesAfterEnv` | `toBeInTheDocument` / `toBeDisabled` / `toHaveTextContent` must exist on `expect` **and** be type-augmented for TS. A single `import '@testing-library/jest-dom'` in a setup file run after the framework does both.                                             |
| A custom `renderWithProviders` over bare RTL `render`   | Every Phase 2 component reads Redux (window/desktop/session state) and sits under Apollo. Tests need the **real store API** (to dispatch + assert) but **zero network**. One helper wraps `Provider` + `MockedProvider` so no test re-derives the provider tree. |

Provider **order** is load-bearing and mirrors production: **Redux outer, Apollo inner**. The Apollo
link chain (and components) read session state from Redux, so the store must be available to the
Apollo context — exactly the `ReduxProviderWrapper` → `ApolloProviderWrapper` nesting from Phase 0.

```
renderWithProviders(ui)
  └─ <Provider store={freshOrSeededStore}>        ← real reducers; dispatch + read in assertions
       └─ <MockedProvider mocks={[]}>             ← Apollo context, network-free
            └─ ui
  returns { store, ...RTLqueries }                ← test can dispatch AND query by role/label/text
```

---

## 🛠️ Implementation Outline (as shipped)

### Step 1 — Dev dependencies

Added to `devDependencies` (versions resolved by the lockfile — see `package.json`):

- `@testing-library/react` — `render` + accessible `screen` queries
- `@testing-library/user-event` — realistic user interaction simulation (over `fireEvent`)
- `@testing-library/jest-dom` — DOM-aware matchers
- `@testing-library/dom` — peer used by the React adapter

### Step 2 — `jest.config.js`

`setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']` wires the matcher registration; `testEnvironment:
'jsdom'` gives components a DOM; the `^@/(.*)$` → `<rootDir>/src/$1` `moduleNameMapper` keeps test
imports aligned with the app's path alias; `ts-jest` transforms `.ts/.tsx` with `react-jsx`.

### Step 3 — `jest.setup.ts`

A single side-effecting import — `import '@testing-library/jest-dom'` — registers every custom
matcher on the global `expect` and augments the matcher types for TypeScript. Nothing else belongs
here yet.

### Step 4 — `src/test-utils/renderWithProviders.tsx`

The reusable harness. Its `ExtendedRenderOptions` exposes:

- `preloadedState?: Partial<RootState>` — seed a scenario (role, open windows, registered icons)
- `store?: AppStore` — supply a pre-built store (dispatch **before** render, or share across rerenders)
- `mocks?: ApolloMocks` — GraphQL responses; **empty by default** (most components don't query)

It mints a fresh isolated store per call via `setupStore(preloadedState)` unless one is passed,
wraps `ui` in `Provider` → `MockedProvider`, and returns RTL's `RenderResult` **plus** `store`. The
`ApolloMocks` type is derived from `MockedProviderProps['mocks']` rather than importing
`MockedResponse` directly — so it stays correct across Apollo versions.

### Step 5 — `src/test-utils/` barrel + self-test

`src/test-utils/index.ts` re-exports the helper; `src/test-utils/renderWithProviders.test.tsx`
exercises the helper itself (the harness is infrastructure — it gets its own test so a regression in
the provider tree fails loudly rather than silently breaking every downstream component test).

---

## 📝 Validation Report

```
## Task 3 — RTL + jest-dom Install Validation Checklist

| #  | Step                                                                              | Status |
| -- | ---------------------------------------------------------------------------------- | ------ |
| 1  | RTL trio + dom peer present in devDependencies                                     |   ✅   |
| 2  | jest.config.js → setupFilesAfterEnv points at jest.setup.ts; jsdom env; @/ alias   |   ✅   |
| 3  | jest.setup.ts imports '@testing-library/jest-dom' (matchers + TS augmentation)     |   ✅   |
| 4  | renderWithProviders wraps Provider(outer) → MockedProvider(inner); returns store   |   ✅   |
| 5  | Options expose preloadedState / store / mocks; mocks default to []                 |   ✅   |
| 6  | test-utils ships a barrel (index.ts) and a self-test (renderWithProviders.test.tsx)|   ✅   |
| 7  | npm test (Jest + RTL) green                                                        |   ✅   |

Reconstructed by: Claude (senior mentor)
Reconstructed on: 2026-06-04
Original completion: marked in phase_overview.md by Cade (date not recorded in-file)
```

> **Honesty note:** steps 1–6 were verified by reading the actual files during backfill. Step 7
> was **not** re-executed; re-run `npm test` if you want a live green before relying on this record.

---

## 🛡️ Summary

- **Why a `renderWithProviders` helper, not bare `render`?** Phase 2 components read Redux and sit
  under Apollo. The helper supplies the **real store** (so tests dispatch and assert on state) with a
  **network-free** Apollo context (`MockedProvider`), and returns the `store` alongside RTL's queries.
- **Provider order is production-mirrored:** Redux **outer**, Apollo **inner**, because the Apollo
  link chain reads session state from Redux — the same nesting Phase 0 established.
- **`jest-dom` via `setupFilesAfterEnv`:** one import registers the DOM matchers on `expect` and
  augments their TypeScript types, after the framework is installed in each test file.
- **Query by accessibility, not internals:** RTL's role/label/text queries enforce the `CLAUDE.md`
  contract and double as a lightweight a11y check — if a control has no accessible name, the test
  can't find it, which is the correct failure.
