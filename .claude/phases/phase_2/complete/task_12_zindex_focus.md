<!-- Created: 2026-06-12 15:59:06 -->
<!-- Completed: 2026-06-12 -->

# Task 12: Z-Index Stacking + Focus Promotion

---

## Rationale

Task 12 is a **verification and integration task**, not a greenfield build. The three pillars
of z-index stacking and focus promotion are already implemented across earlier tasks:

```
┌──────────────────────────────────────────────────────────────────┐
│ Slice layer (Task 1)                                            │
│  zCounter: monotonic counter, never resets                      │
│  focusWindow: assigns zIndex = ++zCounter, un-minimizes         │
│  openWindow: new window lands on top via zCounter bump          │
│  selectTopWindowId: highest zIndex among non-minimized windows  │
│  selectVisibleWindows: filters out minimized                    │
├──────────────────────────────────────────────────────────────────┤
│ Component layer (Tasks 9/10/11)                                 │
│  handlePointerDown: dispatches focusWindow BEFORE drag          │
│  isActive = windowData.id === topWindowId                       │
│  Window primitive: active prop → .window.active CSS class       │
│  7.css: styles .window vs .window.active differently            │
├──────────────────────────────────────────────────────────────────┤
│ Task 12 (this task) — what's missing                            │
│  ① Multi-window RTL integration tests that render MULTIPLE      │
│    WindowWrappers simultaneously and verify the full circuit:   │
│    click → focusWindow → zIndex bump → active chrome switch     │
│  ② Storybook story rendering multiple interactive windows       │
│    to visually verify stacking behavior                         │
└──────────────────────────────────────────────────────────────────┘
```

The existing test suite has a gap: Task 9 tests render **one** WindowWrapper at a time with
multi-window Redux _state_ to verify `active=true` / `active=false`. But the actual interactive
scenario — click one window and watch the _other_ window's chrome switch from active to
inactive — requires rendering multiple WindowWrappers in the same test. Task 10 has a single
multi-window test (`still promotes z-index on title-bar pointerdown`) that checks the Redux
store value, but never asserts the visual consequence on both windows' DOM nodes.

| Decision                                           | Why                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No new component code needed                       | `handlePointerDown` already dispatches `focusWindow` on any pointerdown within the wrapper. `isActive` already derives from `selectTopWindowId`. The active/inactive chrome is handled by 7.css via the `.active` class on the Window primitive. The pipeline is complete. |
| Multi-window integration tests are the deliverable | The stacking circuit crosses multiple components and a selector — the only way to prove it works is to render multiple WindowWrappers and assert on both simultaneously. This is a classic integration test pattern.                                                       |
| Storybook multi-window story fills a visual gap    | The existing stories show single windows. A stacking story lets a human click between windows and confirm the title-bar chrome switches correctly — the visual verification that unit tests cannot provide.                                                                |
| Body-click focus promotion needs explicit coverage | Task 9's `focusWindow on pointerdown` test fires on the wrapper itself. An explicit test that pointerdown on a _child element inside the window body_ still promotes focus proves the event bubbles correctly.                                                             |

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 0 — Multi-window integration tests: `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`

```tsx
// TODO: [Action Required: add multi-window z-index stacking integration tests] - 25 min
//
//   Add a new describe block after the maximize/restore/minimize suite:
//
//   describe('WindowWrapper — z-index stacking + focus promotion')
//
//     Use the existing TWO_WINDOWS fixture (win-1 zIndex 1, win-2 zIndex 2).
//     For three-window tests, create a new THREE_WINDOWS fixture:
//
//       const THREE_WINDOWS: Partial<RootState> = {
//         window: {
//           byId: {
//             'win-1': { id: 'win-1', kind: 'welcome', title: 'Window A',
//                        position: { x: 50, y: 30 }, size: { width: 400, height: 300 },
//                        zIndex: 1, isMinimized: false, isMaximized: false,
//                        prevGeometry: null },
//             'win-2': { id: 'win-2', kind: 'welcome', title: 'Window B',
//                        position: { x: 150, y: 80 }, size: { width: 400, height: 300 },
//                        zIndex: 2, isMinimized: false, isMaximized: false,
//                        prevGeometry: null },
//             'win-3': { id: 'win-3', kind: 'welcome', title: 'Window C',
//                        position: { x: 250, y: 130 }, size: { width: 400, height: 300 },
//                        zIndex: 3, isMinimized: false, isMaximized: false,
//                        prevGeometry: null },
//           },
//           ids: ['win-1', 'win-2', 'win-3'],
//           zCounter: 3,
//           nextIdSeed: 3,
//         },
//       }
//
//     it('clicking a background window promotes it to the top z-index')
//       - Render win-1 and win-2 with TWO_WINDOWS
//       - Assert: win-2 wrapper has higher zIndex than win-1 (initial state)
//       - pointerDown on win-1's wrapper
//       - Assert: win-1 wrapper's style.zIndex is now HIGHER than win-2's
//       - Read both zIndex values from the wrapper's inline style to confirm
//
//     it('switches active chrome from the old top window to the newly focused one')
//       - Render win-1 and win-2 with TWO_WINDOWS
//       - Initially: win-2 should have .window.active, win-1 should NOT
//       - pointerDown on win-1's wrapper
//       - After: win-1 should have .window.active, win-2 should NOT
//       - Query the .window element INSIDE each wrapper's testid to check
//         the active class:
//           const win1Window = within(wrapper1).getByText('Back Window')
//             .closest('.window')
//           expect(win1Window!.classList.contains('active')).toBe(true)
//         OR use container.querySelectorAll('.window.active') and assert length === 1
//
//     it('body-click promotes focus (event bubbles from child to wrapper)')
//       - Render with children:
//           <WindowWrapper windowId="win-1"><p>Click me</p></WindowWrapper>
//           <WindowWrapper windowId="win-2" />
//         with TWO_WINDOWS state
//       - pointerDown on the <p>Click me</p> text element
//       - Assert: win-1's zIndex is now higher than win-2's
//       - This proves the onPointerDown on the wrapper captures bubbled events
//         from arbitrary child content
//
//     it('clicking the already-active window does not bump zCounter')
//       - Render win-1 alone with SINGLE_WINDOW
//       - Read store zCounter before
//       - pointerDown on win-1's wrapper
//       - Assert: store zCounter unchanged (the focusWindow reducer's
//         "already at top" short-circuit is exercised)
//
//     it('three windows: clicking the bottom window promotes it above both others')
//       - Render all three with THREE_WINDOWS
//       - pointerDown on win-1 wrapper
//       - Assert: win-1 zIndex > win-3 zIndex > win-2 zIndex
//       - Only win-1 should have .window.active
//
//     it('active window count is always exactly one after any focus change')
//       - Render all three with THREE_WINDOWS
//       - pointerDown on win-1, then pointerDown on win-2
//       - container.querySelectorAll('.window.active').length === 1
//       - The single-active invariant is the core visual contract of the
//         window manager — this test guards it across state transitions
```

### Step 1 — Storybook multi-window story: `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx`

```tsx
// TODO: [Action Required: add ZIndexStacking story with multiple windows] - 10 min
//
//   Story 7 — ZIndexStacking:
//     This story renders THREE WindowWrappers side by side so a human can
//     click between them and watch the stacking + active chrome switch.
//
//     The decorator already wraps the story in a Provider with a seeded store.
//     Pass a three-window state via __windowState — the same shape as the
//     THREE_WINDOWS test fixture but with window positions offset so all
//     three title bars are visible and clickable:
//
//       args: {
//         windowId: 'win-1',
//         // @ts-expect-error — __windowState is a story-only prop
//         __windowState: { ... three windows ... } satisfies WindowState,
//       }
//
//     BUT: the story only receives ONE windowId. To render three windows,
//     you need to either:
//
//     Option A (recommended): Use a custom render function instead of relying
//     on the component arg. Override the decorator for this specific story to
//     render all three WindowWrappers explicitly:
//
//       ZIndexStacking.decorators = [
//         () => {
//           const store = setupStore({ window: threeWindowState })
//           return (
//             <Provider store={store}>
//               <div style={{ position: 'relative', width: '100vw', height: '100vh',
//                             background: 'var(--desktop-backdrop) center / cover no-repeat' }}>
//                 <WindowWrapper windowId="win-1" />
//                 <WindowWrapper windowId="win-2" />
//                 <WindowWrapper windowId="win-3" />
//               </div>
//             </Provider>
//           )
//         },
//       ]
//
//     Position the windows at staggered offsets (e.g., 50/30, 150/80, 250/130)
//     so all three title bars are clickable. Set zIndex 1, 2, 3 respectively.
//
//     parameters.docs.description.story:
//       'Three overlapping windows. Click any window to bring it to the front.
//        Only the focused window should show active title-bar chrome (blue
//        gradient). The other two should show inactive chrome (grey). Verify:
//        click each window in turn and confirm exactly one active title bar.'
```

---

## File Inventory

| File                                                                     | Type                                                              | New/Modified |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------ |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`    | +6 multi-window z-index integration tests + THREE_WINDOWS fixture | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx` | +1 ZIndexStacking story (multi-window)                            | Modified     |

---

## Validation Checklist

```
## Task 12 — Z-Index Stacking + Focus Promotion Validation Checklist

| #  | Gate                                                                             | Verified by       | Status     |
| -- | -------------------------------------------------------------------------------- | ----------------- | ---------- |
| 1  | focusWindow reducer bumps zCounter and assigns zIndex (slice-level)              | windowSlice tests | ⬜ Pending |
| 2  | focusWindow skips bump when window is already top (no-op optimization)           | windowSlice tests | ⬜ Pending |
| 3  | focusWindow un-minimizes a minimized window                                     | windowSlice tests | ⬜ Pending |
| 4  | selectTopWindowId returns highest-zIndex non-minimized window                   | windowSlice tests | ⬜ Pending |
| 5  | pointerdown on wrapper dispatches focusWindow (any position in the window)      | RTL test          | ⬜ Pending |
| 6  | Clicking a background window promotes its zIndex above all others               | RTL test          | ⬜ Pending |
| 7  | Active chrome (.window.active) switches from old top to newly focused window    | RTL test          | ⬜ Pending |
| 8  | Body-click promotes focus (event bubbles from child content to wrapper)          | RTL test          | ⬜ Pending |
| 9  | Clicking the already-active window does not bump zCounter                       | RTL test          | ⬜ Pending |
| 10 | Three-window stacking: bottom window promoted above both others                 | RTL test          | ⬜ Pending |
| 11 | Active window count is always exactly 1 after any focus change                  | RTL test          | ⬜ Pending |
| 12 | ZIndexStacking Storybook story renders three interactive windows                | npm run storybook | ⬜ Pending |
| 13 | All existing Task 9/10/11 tests still pass (no regressions)                     | npm test          | ⬜ Pending |
| 14 | npx eslint --max-warnings=0 clean                                               | npx eslint        | ⬜ Pending |
| 15 | npm run build clean                                                             | npm run build     | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **Task 12 is an integration-verification task.** The slice reducers (`focusWindow`, monotonic
  `zCounter`), the component wiring (`handlePointerDown` dispatches `focusWindow` before drag),
  the active derivation (`isActive = id === topWindowId`), and the active chrome (7.css
  `.window.active`) were all built in Tasks 1, 9, 10, and 11. Task 12 proves the full circuit
  works across multiple simultaneously-rendered windows.
- **The key integration test renders multiple WindowWrappers.** Earlier tests render one window
  with multi-window _state_. Task 12 renders two or three windows and asserts that clicking one
  changes the _other_'s visual state — the defining interaction of a window manager.
- **The single-active invariant is the contract.** After any focus change, exactly one window
  should have `.window.active`. This is the visual guarantee the end user relies on; the
  integration test guards it.
- **Interview probe:** "Why is DOM render order stable (insertion order) while visual stacking
  uses zIndex?" — React's keyed reconciliation avoids unnecessary DOM moves when the order array
  stays stable. Sibling order in the DOM has no effect on visual stacking because each window
  has an explicit `style.zIndex`. Sorting by z-order on every focus would cause React to
  reparent DOM nodes, destroying focus and form state.
