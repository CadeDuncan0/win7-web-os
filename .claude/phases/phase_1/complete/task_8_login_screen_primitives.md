<!-- Created: 2026-04-28 00:15:32 | Completed: 2026-04-28 -->

### 🎯 Task 8: Build Login Screen Primitives

---

#### 🧠 Rationale

Three primitives, one selection pipeline:

```
[AccountTile selected] → [PasswordInput accepts value] → [SignInButton submits]
```

Each component is **presentational**: props in, JSX out, **zero internal state for the data itself**. State lives in the parent — Task 9 will assemble these in `/login` with a single source of truth. This split is non-obvious but load-bearing: if AccountTile owned its own `selected` boolean, two tiles could both believe they're selected, and the password slot would have no signal telling it which tile to mount under. Lift state up; keep primitives dumb.

State-variant coverage matrix — each cell with a ✓ is a story you must write:

| Component     | default | focus / selected | error | disabled |
| ------------- | ------- | ---------------- | ----- | -------- |
| AccountTile   | ✓       | ✓ (selected)     | —     | ✓        |
| PasswordInput | ✓       | ✓                | ✓     | ✓        |
| SignInButton  | ✓       | ✓                | —     | ✓        |

`error` and `selected` only appear where they have semantic meaning. Don't force-fit a variant onto a component that doesn't have that state — every story you publish is a public commitment that the variant exists and renders correctly.

---

#### 🛠️ Implementation Outline

##### Step 0 — Folder Layout

Per Task 7's title convention (`<Feature>/<Component>` for user-facing components):

```
src/components/login/
  AccountTile/
    AccountTile.tsx
    AccountTile.module.css
    AccountTile.stories.tsx
  PasswordInput/
    PasswordInput.tsx
    PasswordInput.module.css
    PasswordInput.stories.tsx
  SignInButton/
    SignInButton.tsx
    SignInButton.module.css
    SignInButton.stories.tsx
```

Folder: `login/` lowercase (matches existing `foundations/`, `window/`, `providers/`).
Story title: `Login/<Component>` PascalCase prefix — display string only, not a file path.

---

##### Step 1 — AccountTile

A clickable avatar square. Selection state is owned by the parent and pushed in via prop.

```tsx
// AccountTile.tsx — TODO: [Research Required: prop interface]
// Props (named interface, NOT inlined):
//   - label:     string                  (account name shown beneath the avatar)
//   - glyph:     string                  (single emoji / character used as avatar placeholder)
//   - selected:  boolean                 (parent-controlled; drives highlight)
//   - disabled?: boolean                 (true while sign-in request is in flight)
//   - onSelect:  () => void              (fires on click OR Enter/Space keypress)
//
// IMPORTANT — render as <button>, NOT <div>. A user MUST be able to Tab to a tile
// and press Enter/Space to select it. <button> gives you both for free; rolling
// a custom keyboard handler on a div is reinventing what semantic HTML already
// does correctly (and is one of the most common a11y violations in the wild).
//
// ARIA: aria-pressed={selected} so screen readers announce selection state on
// focus/change. Do NOT use aria-selected — that's for listbox/option roles only.

export function AccountTile({ /* TODO */ }) {
  // TODO: compose className from styles.tile + (selected && styles.selected) +
  //       (disabled && styles.disabled). Manual concatenation — do NOT install clsx.
  return (
    /* TODO: <button> with aria-pressed, onClick={onSelect}, disabled={disabled},
       containing a <span> for glyph and a <span> for label */
  )
}
```

```css
/* AccountTile.module.css — TODO: tokens only, no literal hex/rgba/px-magic */

.tile {
  /* width: 120px, height: 140px (avatar block + label row)
     padding: var(--space-3)
     border: 1px solid transparent          ← becomes accent on .selected
     border-radius: var(--radius-md)
     background: transparent                ← tile sits on the wallpaper directly
     transition: 120ms ease (transform + box-shadow + border-color)
     cursor: pointer
     font: var(--text-body)
     color: var(--color-neutral-0)
     text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8)   ← legibility on wallpaper
     display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
   */
}

.tile:hover:not(:disabled) {
  /* subtle lift: translateY(-1px); border-color: var(--color-glass-border-inner) */
}

.selected {
  /* border-color: var(--color-aero-500)
     box-shadow: var(--shadow-glow-aero)
     transform: scale(1.02)
   */
}

.disabled {
  /* opacity: 0.5; cursor: not-allowed; transform: none even on hover */
}

.glyph {
  /* font-size: 64px; line-height: 1; display: block */
}

.label {
  /* font: var(--text-body) — already inherited; keep here only if overriding weight */
}
```

```tsx
// AccountTile.stories.tsx — three stories: Default, Selected, Disabled.
// (No separate Focus story — for this component, focus IS selected.)
//
// TODO: Meta with title 'Login/AccountTile', component import, parameters:
//       layout: 'centered' so the tile sits in the canvas center.
//
// TODO: Story args:
//   Default:  { label: 'Guest', glyph: '👤', selected: false, disabled: false, onSelect: () => {} }
//   Selected: { ...Default.args, selected: true }
//   Disabled: { ...Default.args, disabled: true }
//
// TODO: Optionally add an `argTypes` action for `onSelect` so the Storybook
//       Actions panel logs clicks during interactive testing.
```

---

##### Step 2 — PasswordInput

A controlled text input with focus and error visual states. Parent owns the value.

```tsx
// PasswordInput.tsx — TODO: [Research Required: React 19 ref-as-prop convention]
// In React 19, `ref` is a regular function-component prop. Do NOT wrap with
// `forwardRef` — it is deprecated. Type it as `Ref<HTMLInputElement>`. Task 9's
// composition will pass a ref so the page can imperatively focus the input the
// moment the Admin tile is selected.
//
// Props (named interface):
//   - value:        string
//   - onChange:     (next: string) => void   ← NOT (e: ChangeEvent<...>) => void.
//                                             Caller shouldn't have to know about
//                                             event objects to update a string.
//   - error?:       string                   ← presence => error state; text shown beneath
//   - disabled?:    boolean
//   - placeholder?: string
//   - ref?:         Ref<HTMLInputElement>    (React 19 — regular prop)
//
// ARIA:
//   - aria-invalid={Boolean(error)}
//   - aria-describedby pointing at the error-message element id when error is present
//   - The input MUST have an associated <label> in Task 9's composition; for the
//     story, use aria-label="Password" so a11y audits pass in isolation.

export function PasswordInput({ /* TODO */ }) {
  // TODO: derive className: styles.input + (error && styles.error)
  // TODO: derive a stable error-message id (e.g. 'pw-error') for aria-describedby
  return (
    /* TODO:
       <div className={styles.wrapper}>
         <input
           type="password"
           value={value}
           onChange={(e) => onChange(e.target.value)}
           ...
         />
         {error && <span id={...} className={styles.errorText}>{error}</span>}
       </div>
    */
  )
}
```

```css
/* PasswordInput.module.css */

.wrapper {
  /* display: flex; flex-direction: column; gap: var(--space-1); width: 100% */
}

.input {
  /* padding: var(--space-2) var(--space-3)
     border: 1px solid var(--color-neutral-300)
     border-radius: var(--radius-sm)
     background: var(--color-neutral-0)
     color: var(--color-neutral-900)
     font: var(--text-body)
     outline: none
     transition: border-color 120ms ease, box-shadow 120ms ease
   */
}

.input:focus {
  /* border-color: var(--focus-ring-color)
     box-shadow: 0 0 0 var(--focus-ring-width) rgba(0, 120, 215, 0.25)
     ↑ TODO: that rgba is a literal — extract a primitive
       --color-aero-focus-glow: rgba(0, 120, 215, 0.25)
       and reference it here instead. Or, derive it semantically as
       --focus-ring-glow built on the existing --focus-ring-color.
       Decide which is the cleaner extension and document in Q2.
   */
}

.input:disabled {
  /* background: var(--color-neutral-100); cursor: not-allowed; color: var(--color-neutral-500) */
}

.error {
  /* border-color: var(--color-feedback-error)   ← does not exist yet — add it */
}

.errorText {
  /* font: var(--text-body); color: var(--color-feedback-error); margin-left: var(--space-1) */
}
```

> **TODO:** `[Action required by Junior]` — There is no red token in the system yet. Adding one is a **token-system extension**, not a hardcode workaround. Open `globals.css` and:
>
> 1. Add a primitive scale: `--color-danger-500: #c1272d` (and `-300`, `-700` if you want full coverage now — or just `-500` for now and extend on demand).
> 2. Add a semantic alias: `--color-feedback-error: var(--color-danger-500)`.
> 3. Reference **only** the semantic in this CSS Module.
>
> If you find yourself tempted to write `#c1272d` directly in this file, stop — that is exactly the anti-pattern Task 6 was designed to prevent. The extension itself is the deliverable, not just the input styling.

```tsx
// PasswordInput.stories.tsx — four stories: Default, Focused, Error, Disabled.
//
// TODO: Default — empty value, placeholder 'Password'
// TODO: Focused — same args + a `play` function that programmatically focuses
//       the input on mount. Note: <input type="password"> does NOT have role
//       'textbox' (passwords have no implicit role at all). Use
//       canvas.getByLabelText('Password').focus() — which is why aria-label
//       on the input matters even before the Login page wraps it in a <label>.
// TODO: Error — value 'wrongpw', error: 'Incorrect password'
// TODO: Disabled — empty value, disabled: true
//
// TODO: Provide an `onChange` action via argTypes so typing logs in the Actions panel.
```

---

##### Step 3 — SignInButton

A small submit button. Disabled when there's no password to submit OR submission is in flight.

```tsx
// SignInButton.tsx — TODO: prop interface
// Props (named interface):
//   - onClick:    () => void
//   - disabled?:  boolean
//   - ariaLabel?: string                ← default 'Sign in'; overridable for i18n later
//
// type attribute: render as <button type="button"> for now. Task 9's Login form
// will set type="submit" so the form fires on Enter — but until the <form>
// exists, "submit" inside Storybook would attempt to submit nothing and warn.
// Default to "button"; let Task 9 override via prop OR by re-rendering with
// the form context — your choice. Pick one and justify in Q3.
//
// ARIA:
//   - aria-label={ariaLabel ?? 'Sign in'}  (the glyph alone is not accessible)

export function SignInButton({ /* TODO */ }) {
  return (
    /* TODO: <button type="button" onClick disabled aria-label> with a
       right-arrow glyph child (→ or an inline SVG — emoji is acceptable
       for Phase 1; SVG is a Phase 4 polish concern) */
  )
}
```

```css
/* SignInButton.module.css */

.button {
  /* width: 36px, height: 36px
     border-radius: var(--radius-sm)
     border: 1px solid var(--color-aero-500)
     background: linear-gradient(to bottom, var(--color-aero-300), var(--color-aero-500))
     color: var(--color-neutral-0)
     font: var(--text-body)
     cursor: pointer
     transition: 120ms ease
     display: inline-flex; align-items: center; justify-content: center;
   */
}

.button:hover:not(:disabled) {
  /* swap top stop to var(--color-aero-100) for a brighter gradient
     box-shadow: var(--shadow-glow-aero)
   */
}

.button:focus-visible {
  /* outline: var(--focus-ring-width) solid var(--focus-ring-color)
     outline-offset: 2px
   */
}

.button:disabled {
  /* background: var(--color-neutral-300)
     border-color: var(--color-neutral-500)
     color: var(--color-neutral-500)
     cursor: not-allowed
   */
}
```

```tsx
// SignInButton.stories.tsx — three stories: Default, Focused, Disabled.
//
// TODO: Default — { onClick: () => {} }
// TODO: Focused — same + play function that calls .focus() on the button via
//       canvas.getByRole('button', { name: 'Sign in' })
// TODO: Disabled — { onClick: () => {}, disabled: true }
//
// TODO: parameters.layout: 'centered' — this button is tiny; centering it
//       makes the focus-visible outline clearly inspectable.
```

---

##### Step 4 — Verify In Storybook

```bash
npm run storybook
```

Expected sidebar (10 stories total):

```
Foundations/
  GlassSurface/
    Default
Login/
  AccountTile/
    Default
    Selected
    Disabled
  PasswordInput/
    Default
    Focused
    Error
    Disabled
  SignInButton/
    Default
    Focused
    Disabled
```

Open every story. Visually confirm: every state is **distinguishable** from every other state of the same component. If `Default` and `Focused` look identical for SignInButton, the focus styling is not actually wired (most likely culprit: `:focus` instead of `:focus-visible`, which only highlights for keyboard focus, not mouse — verify by Tab-cycling).

Then build:

```bash
npm run build-storybook
```

Must succeed before requesting Task 9.

---

### Gating

You may not request **Task 9 (Assemble Login Screen Page)** until:

1. Every `// TODO:` block in all three component `.tsx`, `.module.css`, and `.stories.tsx` files is resolved.
2. `globals.css` is extended with a `--color-danger-*` primitive scale and a `--color-feedback-error` semantic alias — referenced (never literal) in PasswordInput's error styles.
3. The focus-glow rgba in PasswordInput is replaced by a token (primitive OR semantic).
4. `npm run storybook` shows all 10 stories in the sidebar with **visually distinct** rendering per state variant.
5. `npm run build-storybook` succeeds without errors.
6. **No `forwardRef` usage anywhere** — PasswordInput accepts `ref` as a regular prop per the React 19 convention.

Task 9 will compose these primitives in `/login`: two AccountTiles (Guest, Admin), a password slot that mounts under the selected Admin tile, a SignInButton that submits the form on Enter or click, error state on bad Admin password, and a routed redirect to `/desktop` on success. The composition is straightforward **only if** every primitive in this task has a clean, prop-driven, dumb API. Get the API right here and Task 9 becomes wiring; get it wrong here and Task 9 becomes a refactor.
