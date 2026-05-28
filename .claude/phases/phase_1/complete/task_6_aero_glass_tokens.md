<!-- task 6 - Establish Aero Glass Design Token System began: 2026-04-25 | completed: 2026-04-26 -->

### 🎯 Task 6: Establish Aero Glass Design Token System

---

#### 🧠 Engineering Context & Rationale

##### The Pivot — From Auth Plumbing To Design Foundation

Tasks 1–5 wired the **invisible** half of Phase 1: Supabase Auth, the session slice, the auth listener, the Apollo authLink. None of it has a single rendered pixel. Task 6 begins the **visible** half. Before a single login screen primitive (`AccountTile`, `PasswordInput`, `SignInButton`) is built in Storybook, the _vocabulary_ those primitives reference must exist — every blur radius, glass gradient, shadow stack, color, and typography step they will consume.

Get this layer wrong, and every component built after it is a candidate for rework. Get it right, and the rest of Phase 1 becomes near-mechanical assembly.

##### Why CSS Custom Properties Are The Token Layer (Not Tailwind, Not Sass Variables, Not JS Constants)

| Mechanism                    | Lives in        | Runtime mutable?  | Theme-switchable? | Verdict for Aero Glass                                                                                                            |
| ---------------------------- | --------------- | ----------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind utility classes     | Build-time JIT  | No                | Cumbersome        | ❌ Fragments token semantics across class soup; obscures intent; rejected in `AGENTS.md`                                          |
| Sass `$variables`            | Compile-time    | No                | No                | ❌ Frozen at build; no DOM cascade; can't be inspected in DevTools                                                                |
| JS theme objects (CSS-in-JS) | Runtime JS      | Yes               | Yes               | ❌ Adds runtime cost and SSR ceremony; tokens become coupled to component bundle                                                  |
| **CSS Custom Properties**    | **DOM cascade** | **Yes (instant)** | **Trivially**     | ✅ Cascading, themeable, inspectable, zero runtime cost — and the only mechanism `backdrop-filter` actually composes with cleanly |

Custom properties cascade. Define them once on `:root` in `globals.css` and every CSS Module file in the tree can consume them. When (later) you support light-mode hover states or an admin-only chrome variant, you re-declare a few properties on a parent selector — the entire subtree re-themes with no JS, no rebuild.

##### The Token Hierarchy — Primitives, Semantic, Component

A production-grade token system has **three layers**, not one. Conflating them is the most common rookie mistake — it produces a flat list of 200 variables with no internal logic.

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1 — PRIMITIVE TOKENS  (raw values, no semantics)      │
│                                                             │
│   --color-aero-500: #3a8dde;                                │
│   --space-2: 8px;                                           │
│   --radius-md: 4px;                                         │
│   --shadow-soft: 0 8px 24px rgba(0,0,0,0.25);               │
└────────────────────┬────────────────────────────────────────┘
                     │   referenced by
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2 — SEMANTIC TOKENS  (intent, not value)              │
│                                                             │
│   --surface-glass-tint:  var(--color-glass-tint-light);     │
│   --surface-glass-blur:  var(--blur-md);                    │
│   --shadow-window:       var(--shadow-close),               │
│                          var(--shadow-soft),                │
│                          var(--shadow-ambient);             │
│   --focus-ring-color:    var(--color-aero-500);             │
└────────────────────┬────────────────────────────────────────┘
                     │   consumed by
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3 — COMPONENT STYLES  (CSS Modules)                   │
│                                                             │
│   .windowChrome {                                           │
│     background: var(--surface-glass-tint);                  │
│     backdrop-filter: blur(var(--surface-glass-blur));       │
│     box-shadow: var(--shadow-window);                       │
│   }                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Why this matters in interviews and in practice:**

- **Primitives** are the _palette_. They change rarely. They have no opinion about where they're used.
- **Semantics** are the _contract_. `--surface-glass-tint` is a promise: "this is the color of frosted Aero glass." If the primitive behind it changes from `--color-glass-tint-light` to `--color-glass-tint-strong`, every glass surface in the product re-skins for free.
- **Component styles** never reference primitives directly. A component asking for `--color-aero-500` is reaching past the contract and grabbing a raw value — that's the same anti-pattern as a React component reaching into a child's internal state.

> **Rule of thumb you will defend:** if a CSS Module file contains a `--color-*`, `--space-*`, `--radius-*`, `--blur-*`, or `--shadow-close|soft|ambient|glow-*` reference, it has skipped the semantic layer. Redirect it.

##### Why Aero Glass Specifically Demands This System

The Windows 7 Aero theme is not a color scheme — it is a **stack of layered visual effects**. A single window chrome surface composites _at minimum_:

```
╔═══════════════════════════════════════════════════════╗
║ 1. backdrop-filter: blur(...)        ← frosted base   ║
║ 2. linear-gradient(...) overlay      ← Aero tint      ║
║ 3. inset 1px highlight (top edge)    ← glass bevel    ║
║ 4. 1px outer border (semi-translucent)                ║
║ 5. drop shadow (multi-layer, soft)                    ║
║ 6. inner glow on focus                                ║
╚═══════════════════════════════════════════════════════╝
```

Six independently tunable surfaces on **one element**. Hardcode any of them inside a component stylesheet and you have signed up to hand-edit dozens of files when (not if) the design moves. Tokenize them and you have one place to tune the entire product's "glassiness."

##### The Typography Constraint — A Non-Obvious Trap

The project context dictates a specific hierarchy:

| Role      | Typeface | Size |
| --------- | -------- | ---- |
| Title     | Georgia  | 16pt |
| Heading 2 | Georgia  | 13pt |
| Body      | Arial    | 12pt |

Two warnings:

1. The original Windows 7 used **Segoe UI** for chrome and **Calibri** for body — the project intentionally diverges. Do not "correct" this. The constraint is the constraint.
2. CSS uses `pt` very rarely. Web typography is overwhelmingly `px` or `rem`. Pt is a print unit (`1pt = 1.333px` at 96dpi). The primitives below are defined in **rem** — accessibility wins (user font-size scaling continues to work) and the spec-pt → rem mapping is documented inline.

##### Tailwind Removal — The Quiet Required Cleanup

`globals.css` previously began with `@import 'tailwindcss';` — a Phase 0 scaffold artifact. The project explicitly rejects Tailwind. The Step 1 demolition strips that import. Leaving it in does not just waste a network/build payload; it ships a CSS reset that conflicts with the Aero design (Tailwind's preflight strips default margins, button styling, and list semantics, which then has to be partially reinstated for the login form).

---

#### 🛠️ Implementation Outline & Code

[`src/app/globals.css`](src/app/globals.css) has been pre-populated with the **complete primitive layer** and a **scaffolded semantic layer**. The primitive values are committed — Aero blue scale, neutrals, glass translucents, spacing grid, radii, blurs, type sizes, type families, and shadow layers are all final. **Your job is the semantic wiring.**

For each `/*TODO*/` marker in the SEMANTIC LAYER section, choose the correct primitive and substitute it into the `var(...)` reference. The primitives are right there, above each TODO, in the same file. There are no wrong primitives to choose from — each semantic token has _one_ primitive that obviously fits if you understand what the semantic token represents.

##### Step 1 — Read The Primitive Layer Top To Bottom

Before editing anything, scroll the PRIMITIVE LAYER top to bottom. Note in particular:

- Two glass tints exist: `--color-glass-tint-light` and `--color-glass-tint-strong`. One is for the default window chrome; the other is for emphasized surfaces (taskbar, modal). The semantic layer only needs one.
- Three blur strengths exist (`--blur-sm`, `--blur-md`, `--blur-lg`). Window chrome lands in the middle — the small blur is for badges/chips, the large blur is for full-screen modal scrims (Phase 2).
- Two glass borders exist: `--color-glass-border-inner` (the bright inset highlight at the top of the bevel) and `--color-glass-border-outer` (the dark hairline at the very edge). The semantic layer's `--surface-glass-border` and `--surface-glass-highlight` map to **distinct** primitives — make sure you don't double up.
- Four shadow primitives exist (`close`, `soft`, `ambient`, `glow-aero`). The unfocused window stacks the **first three**. The focused variant adds the fourth.

##### Step 2 — Wire The `--surface-*` Tokens

Each of these is a single-primitive substitution.

```css
/* ─── SEMANTIC: Surfaces (the Aero glass chrome) ───────────────── */
--surface-glass-tint: var(/*insert variable here*/)
  /*TODO: Review primitive tokens and determine which should be used in this semantic token*/;
--surface-glass-blur: var(/*insert variable here*/)
  /*TODO: Review primitive tokens and determine which should be used in this semantic token*/;
--surface-glass-border: var(/*insert variable here*/)
  /*TODO: Review primitive tokens and determine which should be used in this semantic token*/;
--surface-glass-highlight: var(/*insert variable here*/)
  /*TODO: Review primitive tokens and determine which should be used in this semantic token*/;
```

> Hint: `--surface-glass-blur` is the only `--surface-*` token that does **not** reference a `--color-*` primitive. Look in the blur primitive group instead. You'll consume it later as `blur(var(--surface-glass-blur))` inside `backdrop-filter`.

##### Step 3 — Compose The Multi-Layer Shadow Tokens

This step is **not** a single substitution — `--shadow-window` is a _stack_ of primitives. CSS `box-shadow` accepts a comma-separated list, and each entry composites independently. The order matters: the first shadow renders closest to the element, the last is the most diffuse.

```css
/* ─── SEMANTIC: Shadows (multi-layer composition) ──────────────── */
--shadow-window: /*TODO: stack the three shadow primitives, comma-separated*/;
--shadow-window-focused: /*TODO: same three-shadow stack + aero glow primitive*/;
```

> **Pattern reference (NOT the answer):**
> `--some-stack: var(--shadow-X), var(--shadow-Y), var(--shadow-Z);`
> Choose which three primitives belong in `--shadow-window`, then add the glow as the fourth entry in `--shadow-window-focused`.

##### Step 4 — Wire The Type Shorthands

Each `--text-*` token is a CSS `font` shorthand: `<size>/<line-height> <family>`. The size and line-height are pre-filled. **You pick the family** based on the typography spec:

| Role      | Spec family |
| --------- | ----------- |
| Title     | Georgia     |
| Heading 2 | Georgia     |
| Body      | Arial       |

```css
--text-title: var(--font-size-300) / 1.25 var(/*insert family primitive*/)
  /*TODO: which family does the spec assign to Title?*/;
--text-heading: var(--font-size-200) / 1.3 var(/*insert family primitive*/)
  /*TODO: which family does the spec assign to Heading 2?*/;
--text-body: var(--font-size-100) / 1.45 var(/*insert family primitive*/)
  /*TODO: which family does the spec assign to Body?*/;
```

> Two family primitives exist: `--font-family-serif` and `--font-family-sans`. Match each role to one.

##### Step 5 — Wire The Focus Ring Color

```css
--focus-ring-color: var(/*insert variable here*/)
  /*TODO: Review primitive tokens and determine which should be used in this semantic token*/;
```

> Hint: focus rings on Aero are **the** Aero blue — the canonical brand color. Look at the Aero blue scale and pick the rung that reads as the unmistakable "Windows 7 blue" mid-tone, not pale, not nearly-black.

##### Step 6 — Verify The Token System End-To-End

Once every TODO is resolved, run the dev server:

```bash
npm run dev
```

Open the existing [`src/app/page.tsx`](src/app/page.tsx). Add a **temporary** smoke-test div that consumes **only semantic tokens** (no primitives):

```tsx
// TEMPORARY — delete after verification
<div
  style={{
    background: 'var(--surface-glass-tint)',
    backdropFilter: 'blur(var(--surface-glass-blur))',
    border: '1px solid var(--surface-glass-border)',
    boxShadow: 'var(--shadow-window)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-4)',
    font: 'var(--text-title)',
    color: 'var(--color-neutral-900)',
  }}
>
  Aero token smoke test
</div>
```

In DevTools → Elements → **Computed** pane on the div, every property must resolve to a real value. If any show as the literal string `var(--something)` or as `unset`, your semantic wiring is wrong — fix the source in `globals.css`, not the consumer.

> **TODO:** `[Action required by Junior]` — After visual confirmation, **delete the smoke-test div**. Token verification belongs in this task; portfolio markup does not.

##### Step 7 — Confirm Tailwind Is Gone

Run from the project root:

```bash
grep -rE "(tailwind|@apply|className=\"[^\"]*\\b(text-|bg-|p-|m-|flex|grid|w-|h-)[a-z0-9-]+)" src/
```

Any hit is a Tailwind residue. Resolve it before declaring the task done.

---

#### 🛡️ Challenge & Review

Resolve every `/*TODO*/` in `globals.css` and complete the smoke test before answering.

**1.** Defend the three-layer token hierarchy in one paragraph. Specifically: a teammate proposes "let's just have components reference `--color-aero-500` directly — the semantic layer is overengineering for a portfolio." State (a) the concrete cost they will pay six months from now when the design evolves (e.g., the brand color shifts from a brighter to a deeper blue), and (b) the architectural principle (with its name) that the semantic layer encodes.

```
[Answer]: (a) They pay the cost of decoupling, where designs that evolve to require more nuanced colors or appearance then require new primitives, but with the semantic layer, only the tokens that use those new designs require change. (b) Semantics are a contract, representing what role the token plays, not the value that exists. If the value changes, then all locations using that contract also change. This is the Depedency Inversion Principle.
```

**2.** The glass-tint primitives are defined as `rgba(...)` with explicit alpha — not hex. Explain in terms of how `backdrop-filter` actually layers _why_ a hex value would produce a visibly wrong result. Be precise about what "the backdrop" is and what alpha is doing in the composite.

```
[Answer]: `backdrop-filter: blur()` operates on "the backdrop" — the already-rendered content in the stacking context *behind* the element, at the position the element occupies, before the element's own `background` is composited on top. The browser blurs that backing layer, then uses it as the bottom-most input in the element's composite.

If `background` is a hex value — e.g. `#0078d7` — that property paints the element 100% opaque. The blurred backdrop still exists as a layer underneath, but an opaque paint covers it entirely. Compositing result: you see solid `#0078d7`; `backdrop-filter` ran but is invisible behind the paint.

If `background` is `rgba(255, 255, 255, 0.15)`, the paint layer is only 15% opaque. The blurred backdrop shows through at 85% intensity, with a faint white tint over it. That bleed-through of the blurred content is the frosted glass effect. Alpha isn't just "transparency" in the abstract — it controls precisely how much of the blurred backdrop passes through the paint layer to reach the viewer. Remove alpha, and `backdrop-filter` has no visible effect regardless of its blur value.
```

**3.** The `--text-*` tokens use the CSS `font:` shorthand to bundle size, line-height, and family into one token. A teammate proposes splitting each role into paired tokens (`--text-title-size` + `--text-title-family` + `--text-title-line-height`). Name a concrete component scenario where the shorthand approach is _worse_ than paired tokens, and a different scenario where the shorthand is _better_. Then state which trade-off matters more for this project and why.

```
[Answer]: **Shorthand is worse — concrete scenario:** An `AccountTile` in its selected state needs title-sized Georgia text but a tighter line-height (`1.0`) than `--text-title` provides (`1.25`). If a developer sets `font: var(--text-title)` and then adds `line-height: 1.0` on the same selector, the override works. But the risk appears in the cascade: if any parent or pseudo-class later re-applies `font: var(--text-title)`, the `font:` shorthand resets ALL unspecified font sub-properties — including `line-height` — back to the token's value. The override silently disappears. Paired tokens (`--text-title-size`, `--text-title-family`, `--text-title-line-height`) let each sub-property be overridden independently with no cascade risk.

**Shorthand is better — concrete scenario:** `SignInButton` applies `--text-body` exactly as specified — Arial, 12pt, 1.45 line-height — with no overrides anywhere in its stylesheet. One token, three properties set atomically, zero drift risk. Every consistently-spec'd component benefits: fewer lines, fewer opportunities to forget one of the three sub-properties.

**For this project:** Shorthand wins. The Phase 1 login screen primitives (`AccountTile`, `PasswordInput`, `SignInButton`) are all designed to spec with no per-component type overrides in the current design system. The cascade-reset failure mode only bites when a component needs to diverge from the spec on one dimension — which doesn't exist in the Phase 1 component set. If Phase 2 or 3 introduces a component requiring a line-height variant, paired tokens can be added at that point without touching any existing consumer of the shorthand.
```

---

### Gating

You may not request **Task 7 (Configure Storybook)** until:

1. Every `/*TODO*/` block in [`src/app/globals.css`](src/app/globals.css) is resolved with the correct primitive substitution.
2. The Tailwind grep in Step 7 returns zero results.
3. The Step 6 smoke-test div has been visually verified, then **removed** from [`src/app/page.tsx`](src/app/page.tsx).
4. All three `[Answer]:` blocks are populated.

Task 6 is the foundation for every visible artifact in Phase 1. The login screen primitives (Task 8) and the assembled login page (Task 9) will not introduce a single new color, blur, shadow, or radius — they will compose what you wire here. Token discipline now is component velocity later.
