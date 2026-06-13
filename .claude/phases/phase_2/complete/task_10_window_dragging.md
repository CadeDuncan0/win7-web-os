<!-- Created: 2026-06-12 02:25:51 -->
<!-- Completed: 2026-06-12 -->

# Task 10: Window Dragging via Raw `pointermove` + Boundary Clamping

---

## Rationale

Task 9 gave windows identity and chrome. Task 10 makes them _movable_ — the defining
interaction of a window manager. Per `CLAUDE.md`, window dragging uses **raw Pointer Events**,
never `@dnd-kit` (the ESLint `no-restricted-imports` rule will reject the import). Icons snap
to a grid; windows need sub-pixel-smooth, viewport-clamped, free-form repositioning — a
different problem class.

The architecture splits into three layers, each independently testable:

```
┌──────────────────────────────────────────────────────────────┐
│ WindowWrapper (Task 9, modified)                             │
│   render position = Redux position + transient drag offset   │
│   delegates title-bar pointerdown → useWindowDrag            │
├──────────────────────────────────────────────────────────────┤
│ useWindowDrag (new hook)                                     │
│   pointerdown  → capture pointer, record start coordinates   │
│   pointermove  → clamp candidate, update LOCAL offset state  │
│   pointerup    → dispatch moveWindow ONCE, reset offset      │
├──────────────────────────────────────────────────────────────┤
│ clampWindowPosition (new pure function)                      │
│   (candidate, size, viewport) → clamped {x, y}               │
└──────────────────────────────────────────────────────────────┘
```

| Decision                                                    | Why                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transient offset in component state, Redux write on release | `pointermove` fires at 60–120 Hz. Dispatching `moveWindow` per frame floods the store and re-renders every subscriber. Local state re-renders only the dragging window; Redux gets ONE commit.        |
| `setPointerCapture` on the wrapper                          | Capture routes every subsequent `pointermove`/`pointerup` to the captured element even when the cursor outruns the window or leaves the viewport — no `document`-level listeners, no leak risk.       |
| Clamping is a pure function in `src/lib/`                   | Same pattern as `gridMath.ts`: geometry math lives outside React where Vitest covers every edge without rendering anything.                                                                           |
| Delegation from the wrapper, not a new `<Window>` prop      | The 7.css `<Window>` primitive stays presentation-only (Task 9, Decision 1). The wrapper already owns `onPointerDown` for focus; it checks `closest('.title-bar')` to decide whether a drag begins.   |
| Drag ignores maximized windows and control buttons          | Windows 7 semantics: a maximized window cannot be dragged (`moveWindow` already no-ops in the slice — the component skips starting the drag at all), and pressing Minimize/Close must never drag.     |
| Clamp keeps the ENTIRE window inside the viewport           | Task spec: "the window can never leave the viewport (title bar must remain reachable)". The clamp viewport excludes the taskbar reserve — the same convention `toggleMaximize` established in Task 9. |

The `focusWindow` dispatch from Task 9 and the drag handler share the same `pointerdown` —
focus promotion happens first, then drag bookkeeping. One event, two orthogonal concerns.

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work. NO `@dnd-kit` anywhere in these files (ESLint enforces this).

### Step 0 — Pure clamp math: `src/lib/windowMath.ts`

```ts
// TODO: [Action Required: implement clampWindowPosition] - 10 min
//
//   Pure geometry, no React, no Redux. Mirrors the gridMath.ts pattern.
//
//   export interface Position { x: number; y: number }
//   export interface Size { width: number; height: number }
//
//   export function clampWindowPosition(
//     candidate: Position,
//     size: Size,
//     viewport: Size       // ← already excludes the taskbar reserve (caller's job)
//   ): Position
//
//   Rules:
//     1. maxX = viewport.width  - size.width
//        maxY = viewport.height - size.height
//     2. x = clamped into [0, maxX]; y = clamped into [0, maxY]
//     3. DEGENERATE CASE: when the window is BIGGER than the viewport,
//        maxX/maxY go negative. Math.max(0, ...) must win LAST so the
//        window pins to the top-left and the title bar stays reachable:
//          x = Math.max(0, Math.min(candidate.x, maxX))
//        Work through why the order of min/max matters here — flipping
//        them breaks the oversized case.
//
//   Keep TASKBAR_RESERVE out of this module — the caller subtracts it.
//   This function must not read window.innerWidth (pure = testable).
```

### Step 1 — Clamp math unit tests: `src/lib/windowMath.test.ts`

```ts
// TODO: [Action Required: cover every clamp edge] - 10 min
//
//   describe('clampWindowPosition') — use a fixed viewport, e.g. 1024 × 728:
//
//     it('passes an in-bounds position through unchanged')
//     it('clamps x to 0 when dragged past the left edge')        ← candidate x < 0
//     it('clamps x to viewport.width - size.width on the right')
//     it('clamps y to 0 at the top')
//     it('clamps y to viewport.height - size.height at the bottom')
//     it('pins to top-left when the window exceeds the viewport') ← 2000×2000 window
//
//   No store, no render — plain function-in, value-out assertions.
```

### Step 2 — Drag hook: `src/hooks/useWindowDrag.ts`

```ts
// TODO: [Action Required: implement the pointer-capture drag hook] - 25 min
//
//   Signature (narrow on purpose — the hook does not read Redux itself,
//   WindowWrapper passes what it already selected):
//
//     interface UseWindowDragArgs {
//       windowId: string
//       position: Position        // committed Redux position
//       size: Size
//       isMaximized: boolean
//     }
//
//     export function useWindowDrag({ ... }: UseWindowDragArgs): {
//       dragOffset: Position                    // {0,0} when idle
//       isDragging: boolean
//       handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
//       handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
//       handlePointerUp:   (e: React.PointerEvent<HTMLDivElement>) => void
//     }
//
//   State (useState) — offset: Position. Refs (useRef) — drag bookkeeping
//   that must NOT trigger renders: { pointerId, startClientX, startClientY }
//   or null when idle.
//
//   1. handlePointerDown:
//      - if (isMaximized) return                       ← maximized windows don't drag
//      - if (!(e.target as Element).closest('.title-bar')) return
//      - if ((e.target as Element).closest('.title-bar-controls')) return
//        ↑ delegation: drag starts ONLY from the title bar, never from the
//          Minimize/Maximize/Close buttons. The 7.css class names are the
//          contract here — same global classes the Task 9 tests query.
//      - e.currentTarget.setPointerCapture?.(e.pointerId)
//        ↑ OPTIONAL-CALL the capture APIs. jsdom does not implement
//          setPointerCapture — without the ?. the RTL suite throws.
//      - record { pointerId: e.pointerId, startClientX: e.clientX,
//                 startClientY: e.clientY } in the ref
//
//   2. handlePointerMove:
//      - if no active drag, or e.pointerId !== ref.pointerId, return
//      - rawOffset = { x: e.clientX - startClientX, y: e.clientY - startClientY }
//      - candidate = position + rawOffset
//      - viewport = {
//          width:  window.innerWidth,
//          height: window.innerHeight - TASKBAR_RESERVE,   ← from '@/lib/gridMath'
//        }
//        Read it EVERY move (cheap) so a mid-drag browser resize still clamps
//        correctly — same "read at use time" rationale as handleToggleMaximize.
//      - clamped = clampWindowPosition(candidate, size, viewport)
//      - setOffset({ x: clamped.x - position.x, y: clamped.y - position.y })
//        ↑ store the CLAMPED offset, not the raw one. The render math is then
//          always `position + offset = legal position` — the window never
//          paints out of bounds, not even for one frame.
//
//   3. handlePointerUp:
//      - if no active drag or wrong pointerId, return
//      - e.currentTarget.releasePointerCapture?.(e.pointerId)
//      - dispatch(moveWindow({ id: windowId,
//                              x: position.x + offset.x,
//                              y: position.y + offset.y }))
//      - reset ref to null and offset to {0,0}
//        ↑ Redux now owns the final position; the transient layer zeroes out.
//          Net visual change on commit: none — the same coordinates move from
//          one source (offset) to the other (store).
//
//   The hook MAY use useAppDispatch (typed wrapper — never raw useDispatch).
```

### Step 3 — Wire into the wrapper: `src/components/screens/desktop/WindowWrapper/WindowWrapper.tsx`

```tsx
// TODO: [Action Required: merge drag into WindowWrapper] - 15 min
//
//   1. Call the hook after the existing selectors (AFTER the !windowData
//      guard — hooks can't be conditional, so restructure: select first,
//      guard-return AFTER all hooks run. Lift the early return below the
//      hook call and pass safe fallbacks, OR split a child component.
//      Pick one and be ready to defend it — "rules of hooks vs guard
//      clauses" is a classic interview probe.)
//
//   2. The wrapper's existing onPointerDown still dispatches focusWindow
//      FIRST, then calls the hook's handlePointerDown:
//
//        function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
//          dispatch(focusWindow({ id: windowId }))
//          drag.handlePointerDown(e)
//        }
//
//   3. Spread the remaining handlers onto the same wrapper div:
//        onPointerMove={drag.handlePointerMove}
//        onPointerUp={drag.handlePointerUp}
//      Pointer capture makes the wrapper receive every move/up after
//      capture — no document listeners, no useEffect cleanup at all.
//
//   4. Render geometry becomes committed-plus-transient:
//        left: windowData.position.x + drag.dragOffset.x,
//        top:  windowData.position.y + drag.dragOffset.y,
//
//   5. Toggle a styles.dragging class on the wrapper while drag.isDragging
//      (consumed in Step 4).
```

### Step 4 — Drag styles: `src/components/screens/desktop/WindowWrapper/WindowWrapper.module.css`

```css
/* TODO: [Action Required: drag ergonomics styles] - 5 min
 *
 * .WindowWrapper :global(.title-bar)
 *   touch-action: none;
 *     ↑ REQUIRED for Pointer Events: without it, touch input triggers
 *       scrolling/panning instead of pointermove. Mouse-only testing
 *       will not catch this — the rule must be present.
 *   cursor: default;     ← Win7 uses the arrow cursor on title bars, not grab
 *
 * .dragging
 *   user-select: none;
 *     ↑ prevents text inside the window body from being selected while
 *       the pointer sweeps across it mid-drag.
 *
 * No new colors/shadows — nothing here needs a token, only behavior props.
 */
```

### Step 5 — RTL drag tests: `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`

```tsx
// TODO: [Action Required: extend the Task 9 suite with drag coverage] - 25 min
//
//   Reuse SINGLE_WINDOW_STATE (position 100,50 / size 400×300). jsdom's
//   viewport is window.innerWidth = 1024, window.innerHeight = 768 —
//   so the clamp viewport is 1024 × (768 - TASKBAR_RESERVE) = 1024 × 728.
//
//   Drive drags with fireEvent.pointerDown / pointerMove / pointerUp on
//   container.querySelector('.title-bar') for the down event and the
//   WRAPPER (data-testid) for move/up — capture is a no-op in jsdom, so
//   target the element your handlers actually live on. Every event needs
//   { clientX, clientY, pointerId: 1 }.
//
//   describe('WindowWrapper — dragging')
//
//     it('commits the moved position to Redux on pointerup')
//       - down on .title-bar at (150, 60) → move to (250, 160) → up
//       - store position should be { x: 200, y: 150 }  (delta +100,+100)
//
//     it('does not write to Redux during pointermove (transient phase)')
//       - down → move → assert store position is STILL { x: 100, y: 50 }
//       - the wrapper's inline left/top, however, already reflect the offset
//
//     it('clamps the committed position to the viewport')
//       - move by a huge delta, e.g. to clientX 5000 →
//         committed x === 1024 - 400 = 624; y === 728 - 300 = 428
//
//     it('clamps to 0 when dragged past the top-left')
//       - negative deltas → committed { x: 0, y: 0 }
//
//     it('does not drag when pointerdown starts on a control button')
//       - pointerDown on the Close button's coordinates via the
//         [aria-label="Close"] element → move → up
//       - store position unchanged
//
//     it('does not drag a maximized window')
//       - seed isMaximized: true → drag sequence → position unchanged
//
//     it('still promotes z-index on title-bar pointerdown')
//       - two-window state → drag win-1 → its zIndex bumps (focus + drag coexist)
```

### Step 6 — Storybook story: `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx`

```tsx
// TODO: [Action Required: add a Draggable story] - 5 min
//
//   Story 5 — Draggable:
//     Reuse the Task 9 decorator (seeded store + position: relative parent).
//     args: { windowId: 'win-1' } with default makeWindowState().
//     No special args — the story exists so a human can grab the title bar
//     and FEEL the clamp at all four edges. Note in the story description
//     which edges to test and that the window must never escape the canvas.
```

---

## File Inventory

| File                                                                     | Type                          | New/Modified |
| ------------------------------------------------------------------------ | ----------------------------- | ------------ |
| `src/lib/windowMath.ts`                                                  | Pure clamp geometry           | New          |
| `src/lib/windowMath.test.ts`                                             | Clamp unit tests (6)          | New          |
| `src/hooks/useWindowDrag.ts`                                             | Pointer-capture drag hook     | New          |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.tsx`         | Drag wiring + transient style | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.module.css`  | touch-action / user-select    | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`    | +7 drag tests                 | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx` | +1 Draggable story            | Modified     |

---

## Validation Checklist

```
## Task 10 — Window Dragging Validation Checklist

| #  | Gate                                                                               | Verified by                  | Status     |
| -- | ----------------------------------------------------------------------------------- | ---------------------------- | ---------- |
| 1  | clampWindowPosition is pure (no window/Redux access) and handles oversized windows | code review + unit tests     | ⬜ Pending |
| 2  | windowMath.test.ts covers all four edges + passthrough + degenerate case           | npm test                     | ⬜ Pending |
| 3  | Drag starts ONLY from .title-bar, never from .title-bar-controls                   | RTL test                     | ⬜ Pending |
| 4  | Maximized windows do not drag                                                      | RTL test                     | ⬜ Pending |
| 5  | pointermove updates local offset only — zero Redux dispatches mid-drag             | RTL test                     | ⬜ Pending |
| 6  | pointerup commits exactly one moveWindow with the clamped position                 | RTL test                     | ⬜ Pending |
| 7  | setPointerCapture/releasePointerCapture called via optional chaining (jsdom-safe)  | code review                  | ⬜ Pending |
| 8  | Viewport read per-move and excludes TASKBAR_RESERVE (imported, not hardcoded)      | code review                  | ⬜ Pending |
| 9  | focusWindow still dispatches on the same pointerdown (Task 9 behavior intact)      | RTL test                     | ⬜ Pending |
| 10 | touch-action: none on the title bar; user-select: none while dragging              | code review                  | ⬜ Pending |
| 11 | No @dnd-kit imports in any Task 10 file                                            | npx eslint (rule enforces)   | ⬜ Pending |
| 12 | Draggable story added; manual edge sweep performed in Storybook                    | npm run storybook            | ⬜ Pending |
| 13 | npx eslint --max-warnings=0 clean                                                  | npx eslint                   | ⬜ Pending |
| 14 | npm test green (all existing + new tests)                                          | npm test                     | ⬜ Pending |
| 15 | npm run build clean                                                                | npm run build                | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **Transient-then-commit is the headline pattern.** `pointermove` mutates cheap local state at
  frame rate; Redux receives exactly one `moveWindow` on release. Interview probe: "why not
  dispatch per move?" — store floods, subscriber re-renders, and time-travel debugging noise
  for zero benefit.
- **Pointer capture replaces document listeners.** `setPointerCapture(pointerId)` routes all
  subsequent moves/ups to the wrapper even outside its bounds — no `useEffect` cleanup, no
  leaked listeners, and multi-pointer safety via the `pointerId` check.
- **Clamping is pure and lives in `src/lib/`.** Geometry separated from React means the edge
  cases (including a window larger than the viewport) are unit-tested without rendering.
  The min/max ordering pins oversized windows to the top-left so the title bar stays usable.
- **The clamped offset is what renders.** Clamping the offset (not just the commit) means the
  window never paints out of bounds, even transiently.
- **jsdom realities:** capture APIs don't exist (optional-call them) and the viewport is fixed
  at 1024×768 — the tests are written against those constants.
- `@dnd-kit` remains icon-only; ESLint mechanically enforces it.
