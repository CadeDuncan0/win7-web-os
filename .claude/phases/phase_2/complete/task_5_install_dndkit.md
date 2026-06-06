<!-- Created: 2026-06-06 01:59:04 -->
<!-- Completed: 2026-06-06 -->

# 🎯 Task: Install @dnd-kit for Icon Drag

---

## 🧠 Rationale

Desktop icons must be **draggable** and **clickable**. Those two gestures start the same way — a
`pointerdown` — and the runtime must decide within milliseconds which one the visitor intended.
`@dnd-kit` solves this with **sensor activation constraints**: a configurable pixel distance the
pointer must travel before the library promotes the interaction from "click" to "drag." Below the
threshold, `pointerup` fires normally and the icon's `onClick` / double-click semantics remain
intact — including the `:active` CSS pseudo-class that powers the selection halo.

**Decision 1 — core + utilities, nothing else.** Three `@dnd-kit` entry points exist:

| Package              | Ships                                                          | Needed here?                                    |
| -------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| `@dnd-kit/core`      | `DndContext`, `useDraggable`, `useDroppable`, sensors, overlay | **Yes** — the drag runtime                      |
| `@dnd-kit/utilities` | `CSS.Translate.toString`, `CSS.Transform.toString`             | **Yes** — performant transform application      |
| `@dnd-kit/sortable`  | `SortableContext`, `useSortable`, array-move helpers           | **No** — icons are _positioned_, not _sorted_   |
| `@dnd-kit/modifiers` | `restrictToWindowEdges`, `createSnapModifier`                  | **No** — grid snap is custom cell math (Task 8) |

Installing `sortable` would import collision strategies and accessibility announcements designed
for ordered lists — wrong abstraction for a free-positioned icon grid. Grid-cell snapping is
derived math (px → column/row on drop), not a modifier that runs every frame.

**Decision 2 — two sensors, both required.** `PointerSensor` handles mouse and touch.
`KeyboardSensor` handles keyboard drag (Arrow keys to move, Space/Enter to pick up / drop,
Escape to cancel) — required for accessibility. Both are configured via `useSensor` /
`useSensors` hooks from `@dnd-kit/core`.

**Decision 3 — activation distance, not delay.** Two mutually exclusive constraints exist:

- `distance: N` — pointer must travel N px before drag starts. **Chosen.** Immediate response
  once the threshold is crossed; `:active` and click fire normally below it.
- `delay: N, tolerance: M` — hold N ms, allow M px wobble. Rejected — adds latency that makes
  drag feel sluggish on desktop; designed for touch long-press, not a mouse-driven desktop grid.

**Hard constraint — windows must NEVER import from `@dnd-kit`.** `CLAUDE.md` mandates raw
`pointermove` for window dragging. `@dnd-kit` is optimized for sortable lists with snap targets
and accessibility heuristics that fight pixel-perfect free-form repositioning. Two distinct
dragging problems, two distinct solutions — the import boundary makes the separation enforceable.

---

## 🛠️ Implementation Outline

> Imports are omitted in these blocks — deduce them (the committed files must include them per the
> `import/order` rule). Each TODO is one 5–10 min unit.

### Step 1 — Install & version-check

```bash
npm i @dnd-kit/core @dnd-kit/utilities
# TODO: [Action Required: confirm the install is sane] - 5 min
#   1. Verify both packages appear in `dependencies` (NOT devDependencies — they ship to the
#      browser, they are runtime code). @dnd-kit/sortable and @dnd-kit/modifiers must NOT be
#      present.
#   2. `npx tsc --noEmit` still clean (no type conflicts from the new packages).
#   3. `npm test` still green (no Jest global collisions).
```

### Step 2 — Sensor configuration hook: `src/hooks/useDesktopSensors.ts`

```ts
// A reusable hook that returns the sensor array for the desktop icon grid.
// Consumed by the <Desktop> component (Task 6) when it wraps icons in <DndContext>.
// This hook is the SINGLE place sensor tuning lives — every @dnd-kit consumer
// reads the same activation constraint so click / drag semantics are globally
// consistent.

// TODO: [Action Required: configure sensors with activation distance] - 10 min
//   1. Define ACTIVATION_DISTANCE_PX as a named constant. Start with 5 — this is
//      the pixel threshold the pointer must travel before @dnd-kit promotes the
//      interaction to a drag. Below it, pointerup fires normally, onClick works,
//      and :active CSS applies. Tune later if icons feel too sticky or too eager.
//
//   2. Call useSensor(PointerSensor, { activationConstraint: { distance: ACTIVATION_DISTANCE_PX } }).
//      PointerSensor is hardware-agnostic (mouse, touch, pen). Do NOT use MouseSensor +
//      TouchSensor separately unless a concrete divergence requires it.
//
//   3. Call useSensor(KeyboardSensor). No coordinateGetter override yet — default
//      behavior (25px per arrow press) is sufficient until Task 8 wires the grid.
//      Task 8 will supply a custom coordinateGetter that snaps to grid cells.
//
//   4. Combine via useSensors(pointerSensor, keyboardSensor) and return the result.
//
//   5. Export the hook as a named export: `export function useDesktopSensors()`.
```

### Step 3 — ESLint import boundary: `eslint.config.mjs`

```js
// Enforce the hard constraint: @dnd-kit is for icons ONLY. Any import from
// @dnd-kit inside src/components/windows7/Window/ or a future ManagedWindow
// component is a bug — window dragging uses raw pointermove (Task 10).
//
// TODO: [Action Required: add a no-restricted-imports rule scoped to window files] - 5-10 min
//   1. Add a new config object to the defineConfig array, scoped to files matching
//      window components. Use a file pattern broad enough to catch both the existing
//      Window primitive and the future ManagedWindow:
//        files: ['src/components/**/Window/**/*.ts', 'src/components/**/Window/**/*.tsx',
//                'src/components/**/ManagedWindow/**/*.ts', 'src/components/**/ManagedWindow/**/*.tsx']
//
//   2. Set the rule:
//        'no-restricted-imports': ['error', {
//          patterns: [{
//            group: ['@dnd-kit/*'],
//            message: 'Window dragging uses raw pointermove — @dnd-kit is for icon drag only (see CLAUDE.md).'
//          }]
//        }]
//
//   3. Verify: `npx eslint --max-warnings=0` stays green (no existing violations).
```

### Step 4 — Verify type isolation

```bash
# TODO: [Action Required: confirm @dnd-kit types are available without collisions] - 5 min
#   1. `npx tsc --noEmit` — app compiles cleanly.
#   2. `npx tsc -p cypress/tsconfig.json --noEmit` — Cypress compilation unaffected.
#   3. `npm test` — Jest suite (49 tests) still green; no global or type collisions.
#   4. `npx eslint --max-warnings=0` — lint clean, including the new restricted-import rule.
```

---

## 📝 Validation Report

> New task — nothing is done yet. Each row is the bar **you** must clear and the command that proves
> it. Flip to ✅ only on a real pass; do not loosen a step to make it green.

```
## Task 5 — @dnd-kit Install Validation Checklist

| #  | Step                                                                              | Verified by                                               | Status |
| -- | --------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| 1  | @dnd-kit/core + @dnd-kit/utilities in dependencies (NOT devDependencies)          | cat package.json                                          | ⬜ Pending |
| 2  | @dnd-kit/sortable and @dnd-kit/modifiers NOT present                              | cat package.json; npm ls @dnd-kit/sortable                | ⬜ Pending |
| 3  | useDesktopSensors hook exports from src/hooks/useDesktopSensors.ts                | editor import resolution                                  | ⬜ Pending |
| 4  | PointerSensor configured with distance activation constraint                      | code review of useDesktopSensors                          | ⬜ Pending |
| 5  | KeyboardSensor present (no coordinateGetter override — that is Task 8)            | code review of useDesktopSensors                          | ⬜ Pending |
| 6  | ESLint no-restricted-imports blocks @dnd-kit in Window/** and ManagedWindow/**    | add a test import in Window.tsx, run eslint, see error    | ⬜ Pending |
| 7  | npx tsc --noEmit clean (no type collisions from new packages)                     | npx tsc --noEmit                                          | ⬜ Pending |
| 8  | npx tsc -p cypress/tsconfig.json --noEmit clean                                  | npx tsc -p cypress/tsconfig.json --noEmit                 | ⬜ Pending |
| 9  | npm test green (49 tests, no Jest regressions)                                    | npm test                                                  | ⬜ Pending |
| 10 | npx eslint --max-warnings=0 clean (including new restricted-import rule)          | npx eslint --max-warnings=0                               | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## 🛡️ Summary

- **Why core + utilities only?** `@dnd-kit/sortable` is for ordered lists — icons are positioned
  in a free-form grid. `@dnd-kit/modifiers` provides frame-by-frame snap modifiers — icon grid
  snap is computed once on drop via cell math (Task 8). Two unnecessary packages avoided.
- **Activation distance solves click-vs-drag.** `PointerSensor` with a pixel distance constraint
  lets clicks (including `:active` CSS and double-click-to-open) fire below the threshold while
  drags activate above it. No delay, no touch-press latency.
- **Two sensors, one a11y contract.** `PointerSensor` (mouse/touch/pen) and `KeyboardSensor`
  (Space to grab, arrows to move, Escape to cancel) — keyboard drag is an accessibility
  requirement, not an enhancement.
- **Import boundary enforced via ESLint.** `no-restricted-imports` on `@dnd-kit/*` scoped to
  `Window/**` and `ManagedWindow/**` makes the CLAUDE.md constraint ("window dragging uses raw
  pointermove") a CI-enforced gate, not a convention.
- **Sensor hook is the single tuning point.** `useDesktopSensors` encapsulates the activation
  distance and sensor list so every consumer inherits the same drag-vs-click threshold.
