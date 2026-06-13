<!-- Created: 2026-06-12 16:07:23 -->
<!-- Completed: 2026-06-12 -->

# Task 13: Framer Motion Window Open / Close / Minimize Transitions

---

## Rationale

Tasks 9–12 built a fully functional window manager — windows open, close, minimize, maximize,
drag, and stack. But every state change is instantaneous: windows pop into existence and vanish
without ceremony. Windows 7's Aero animations are a defining product characteristic. Task 13
wraps the window lifecycle in Framer Motion transitions that match the targets set in `CLAUDE.md`:

```
┌────────────────────────────────────────────────────────────────────┐
│ Transition         │ Visual                      │ Duration / Ease │
├────────────────────┼─────────────────────────────┼─────────────────┤
│ Open (mount)       │ scale 0.95 → 1.0 + fade in  │ 120ms / easeOut │
│ Close (unmount)    │ scale 1.0 → 0.95 + fade out  │ 100ms / easeOut │
│ Minimize (unmount) │ scale → 0 + fade out          │ 100ms / easeOut │
└────────────────────────────────────────────────────────────────────┘
```

The architecture has two layers:

1. **`AnimatePresence` wraps the window list** — wherever windows are rendered as a list
   (Task 16's WindowManager will iterate `selectVisibleWindows`), `AnimatePresence` must
   wrap the loop so Framer Motion can animate exit transitions before React unmounts the node.
   For now, `WindowWrapper` itself becomes motion-aware so it works in both Storybook isolation
   and the future compositor.

2. **`motion.div` replaces the static wrapper `<div>`** — the same positioned wrapper div
   that holds inline styles (left/top/width/height/zIndex) becomes a `motion.div` with
   `initial`, `animate`, and `exit` props. The wrapper is the correct animation target
   because it already owns the geometry — animating a child would fight the absolute
   positioning.

| Decision                                                  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Animate the wrapper div, not the inner `<Window>`         | The wrapper owns `position: absolute` + inline geometry. Animating a nested element would require re-deriving its size relative to the parent. One `motion.div` at the shell level keeps animation and layout in one place.                                                                                                                                                                                                                       |
| Minimize animates scale-to-zero, not translate-to-taskbar | The task spec calls for "translate + scale toward the taskbar button's coordinates resolved via `getBoundingClientRect` on a button ref." The taskbar doesn't exist yet (Task 14). Task 13 implements a **scale-to-zero + fade** as the interim minimize exit. Task 14 exposes taskbar button refs, and the minimize animation can be upgraded to use `getBoundingClientRect` target coordinates at that time. This avoids a circular dependency. |
| `key={windowId}` on each `motion.div`                     | `AnimatePresence` identifies entering/exiting children by `key`. The stable `windowId` is the correct key — it outlives React reconciliation.                                                                                                                                                                                                                                                                                                     |
| Transition durations match CLAUDE.md spec                 | Open: 120ms. Close: 100ms. These are fast enough to feel responsive but slow enough to register visually. Windows 7's Aero animations are snappy, not theatrical.                                                                                                                                                                                                                                                                                 |
| Open vs close vs minimize need distinct `exit` variants   | Close and minimize share the `exit` event (both unmount the window), but they should look different. A `custom` prop on the `motion.div` driven by a local ref can distinguish the two exit modes. When `minimizeWindow` is dispatched, the component sets a ref to `'minimize'` before unmounting; the `exit` variant reads it.                                                                                                                  |

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 0 — Convert wrapper to motion.div: `src/components/screens/desktop/WindowWrapper/WindowWrapper.tsx`

```tsx
// TODO: [Action Required: wrap WindowWrapper's root div in motion.div with lifecycle animations] - 20 min
//
//   1. Import { motion } from 'framer-motion'
//      (AnimatePresence is NOT imported here — it will wrap the window LIST
//      in the parent compositor, Task 16. For Storybook stories, we wrap
//      each story in AnimatePresence via the decorator.)
//
//   2. Track the exit mode so minimize and close have distinct animations.
//      Add a ref at the top of the component (next to the drag hook):
//
//        const exitModeRef = useRef<'close' | 'minimize'>('close')
//
//      Update handleClose and handleMinimize to set it before dispatching:
//
//        function handleClose() {
//          exitModeRef.current = 'close'
//          dispatch(closeWindow({ id: windowId }))
//        }
//
//        function handleMinimize() {
//          exitModeRef.current = 'minimize'
//          dispatch(minimizeWindow({ id: windowId }))
//        }
//
//   3. Define the animation variants object (inside the component, after
//      the guards, or as a module-level constant — your call):
//
//        const variants = {
//          initial: { opacity: 0, scale: 0.95 },
//          animate: { opacity: 1, scale: 1 },
//          exit: () => exitModeRef.current === 'minimize'
//            ? { opacity: 0, scale: 0.5 }
//            : { opacity: 0, scale: 0.95 },
//        }
//
//      Note: `exit` is a function because it reads the ref at exit time.
//      Framer Motion calls dynamic variants at animation time, so the ref
//      value set in handleMinimize/handleClose will be current.
//
//   4. Replace the root <div> with <motion.div>:
//
//        <motion.div
//          className={wrapperClass}
//          style={style}
//          onPointerDown={handlePointerDown}
//          onPointerMove={drag.handlePointerMove}
//          onPointerUp={drag.handlePointerUp}
//          onDoubleClick={handleDoubleClick}
//          data-testid={`managed-window-${windowId}`}
//          variants={variants}
//          initial="initial"
//          animate="animate"
//          exit="exit"
//          transition={{ duration: 0.12, ease: 'easeOut' }}
//        >
//
//      The transition duration (0.12 = 120ms) covers the open animation.
//      For the exit, override the duration to be shorter (100ms = 0.1):
//      Use the `exit` prop's transition inline in the variant itself, or
//      set a custom exit transition. The simplest approach is to include
//      `transition` in the exit variant return value:
//
//        exit: () => exitModeRef.current === 'minimize'
//          ? { opacity: 0, scale: 0.5, transition: { duration: 0.1, ease: 'easeOut' } }
//          : { opacity: 0, scale: 0.95, transition: { duration: 0.1, ease: 'easeOut' } }
//
//   5. Add `useRef` to the react import (it's not imported yet — the drag
//      hook uses its own internal refs, not one from the component).
//
//   6. The motion.div needs a `key` prop for AnimatePresence to track it.
//      When WindowWrapper is rendered by a parent mapping over window ids,
//      the parent provides the key via React's `key=` JSX attribute — the
//      component itself does NOT need to set key internally. However, for
//      Storybook stories wrapped in AnimatePresence, the key must be on the
//      <WindowWrapper> element in the story decorator (already handled by
//      React reconciliation when using windowId as key).
//
//   IMPORTANT — jsdom + motion.div:
//      jsdom does not implement the Web Animations API or getComputedStyle
//      fully enough for Framer Motion's animation engine. Existing RTL tests
//      will still pass because:
//        - motion.div renders a real <div> in the DOM
//        - initial/animate/exit are CSS-like props that Framer Motion applies
//          via inline styles; in jsdom, the "animation" completes instantly
//        - fireEvent.pointerDown etc. still work on motion.div elements
//      If any tests break, check that the test is not asserting on transient
//      animation styles (opacity/scale mid-animation). Tests should assert
//      on final state only.
```

### Step 1 — Storybook AnimatePresence wrapper: `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx`

```tsx
// TODO: [Action Required: wrap stories in AnimatePresence for exit animations] - 10 min
//
//   The meta-level decorator currently wraps Story in a plain div.
//   AnimatePresence must wrap the WindowWrapper(s) so exit animations play
//   when the Close/Minimize buttons are clicked.
//
//   Update the decorator to include AnimatePresence:
//
//     import { AnimatePresence } from 'framer-motion'
//
//     decorators: [
//       (Story, context) => {
//         const windowState = ...
//         const store = setupStore({ window: windowState as WindowState })
//         return (
//           <Provider store={store}>
//             <div style={{ position: 'relative', ... }}>
//               <AnimatePresence>
//                 <Story />
//               </AnimatePresence>
//             </div>
//           </Provider>
//         )
//       },
//     ]
//
//   The ZIndexStacking story has its own decorator — update that one too:
//
//     ZIndexStacking.decorators = [
//       () => {
//         const store = setupStore({ window: threeWindowState })
//         return (
//           <Provider store={store}>
//             <div style={{ ... }}>
//               <AnimatePresence>
//                 <WindowWrapper windowId="win-1" key="win-1" />
//                 <WindowWrapper windowId="win-2" key="win-2" />
//                 <WindowWrapper windowId="win-3" key="win-3" />
//               </AnimatePresence>
//             </div>
//           </Provider>
//         )
//       },
//     ]
//
//   Add a new story to demonstrate the open/close transition:
//
//   Story — AnimatedOpenClose:
//     A story with a button outside the window that dispatches openWindow,
//     so the human can repeatedly open and close a window and see the
//     animation. Use the store's dispatch directly:
//
//       export const AnimatedOpenClose: Story = {
//         args: { windowId: 'win-1' },
//         decorators: [
//           () => {
//             const store = setupStore({ window: makeWindowState() })
//             return (
//               <Provider store={store}>
//                 <div style={{ position: 'relative', width: '100vw', height: '100vh',
//                               background: 'var(--desktop-backdrop) center / cover no-repeat' }}>
//                   <AnimatePresence>
//                     <AnimatedWindowHost store={store} />
//                   </AnimatePresence>
//                 </div>
//               </Provider>
//             )
//           },
//         ],
//         parameters: { docs: { description: { story:
//           'Click Close to see the exit animation. The window fades and scales down over 100ms.'
//         }}},
//       }
//
//     You'll need a small helper component (AnimatedWindowHost) that reads
//     selectVisibleWindows from the store and renders a WindowWrapper for
//     each one. This is a preview of the Task 16 compositor pattern.
//     Alternatively, keep it simpler: just demonstrate that clicking Close
//     triggers the exit animation on the existing single-window story.
//     The simplest approach: just add AnimatePresence to the existing
//     decorator and note in the story description what to observe.
```

### Step 2 — Verify existing tests still pass: `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`

```tsx
// TODO: [Action Required: verify no test regressions from motion.div swap] - 10 min
//
//   Run: npx vitest run --project unit src/components/screens/desktop/WindowWrapper/
//
//   The swap from <div> to <motion.div> should be transparent to RTL tests
//   because:
//     - motion.div renders a real <div> in the DOM
//     - data-testid, className, style, and event handlers all pass through
//     - jsdom skips the actual CSS animation — states resolve instantly
//
//   If any test fails, the likely cause is:
//     1. An inline style assertion that now includes opacity or scale
//        injected by Framer Motion's initial state. Fix: adjust the
//        assertion to account for the additional styles, or use
//        toHaveStyle with only the properties you care about.
//     2. An element query that relied on the wrapper being a plain <div>
//        — motion.div also renders <div>, so this shouldn't happen.
//
//   DO NOT add new animation-specific tests. Framer Motion animations are
//   visual; they cannot be meaningfully asserted in jsdom. The Storybook
//   stories are the verification surface for animation behavior. The RTL
//   suite verifies that the motion wrapper does not break existing
//   functional behavior (Redux wiring, drag, focus, maximize).
```

---

## File Inventory

| File                                                                     | Type                                                      | New/Modified |
| ------------------------------------------------------------------------ | --------------------------------------------------------- | ------------ |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.tsx`         | `motion.div` wrapper + exit mode ref + variants           | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx` | `AnimatePresence` in decorators + AnimatedOpenClose story | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`    | Verify no regressions (no new tests expected)             | Verified     |

---

## Validation Checklist

```
## Task 13 — Framer Motion Window Transitions Validation Checklist

| #  | Gate                                                                              | Verified by       | Status     |
| -- | --------------------------------------------------------------------------------- | ----------------- | ---------- |
| 1  | WindowWrapper root element is a motion.div (not a plain div)                     | code review       | ⬜ Pending |
| 2  | Open animation: scale 0.95 → 1.0 + opacity 0 → 1, duration ~120ms, easeOut     | Storybook visual  | ⬜ Pending |
| 3  | Close exit animation: scale 1.0 → 0.95 + opacity 1 → 0, duration ~100ms        | Storybook visual  | ⬜ Pending |
| 4  | Minimize exit animation: distinct from close (scale → 0.5 or similar)            | Storybook visual  | ⬜ Pending |
| 5  | exitModeRef distinguishes close from minimize at exit time                       | code review       | ⬜ Pending |
| 6  | exit variant is a function (reads ref dynamically, not stale closure)            | code review       | ⬜ Pending |
| 7  | AnimatePresence wraps windows in Storybook decorators                            | code review       | ⬜ Pending |
| 8  | All existing RTL tests (31) still pass — no regressions from motion.div          | npm test          | ⬜ Pending |
| 9  | No new animation-specific RTL tests (visual verification is in Storybook)        | code review       | ⬜ Pending |
| 10 | Storybook stories show open/close/minimize transitions                           | npm run storybook | ⬜ Pending |
| 11 | npx eslint --max-warnings=0 clean                                                | npx eslint        | ⬜ Pending |
| 12 | npm run build clean                                                              | npm run build     | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **`motion.div` replaces the root `<div>`.** The wrapper div that already owns inline geometry
  styles becomes a `motion.div` with `initial` / `animate` / `exit` props. One element handles
  both layout and animation — no nested animation wrappers.
- **Exit mode ref distinguishes close from minimize.** Both dispatch actions that unmount the
  window (via `selectVisibleWindows` filtering), so both trigger the same `exit` event. A ref
  set by `handleClose` or `handleMinimize` before dispatching tells the dynamic exit variant
  which animation to play. A ref (not state) is correct because the value must be set
  synchronously before the dispatch triggers unmount — `useState` would batch the update and
  the exit variant would read the old value.
- **Minimize animation is interim.** The full Windows 7 minimize-to-taskbar animation requires
  `getBoundingClientRect` on a taskbar button ref (Task 14). Task 13 uses scale-to-zero + fade
  as the placeholder. Task 14 can upgrade the exit variant to translate toward the resolved
  taskbar button coordinates without changing the architecture.
- **RTL tests are unaffected.** `motion.div` renders a real `<div>` in the DOM. jsdom skips
  the visual animation, so all 31 existing tests pass unchanged. Animation behavior is verified
  visually in Storybook, not in unit tests.
- **Interview probe:** "Why a ref and not state for exit mode?" — The ref must be written
  synchronously before `dispatch()`. `useState` batches updates in React 18+; the component
  would unmount with the old state value. `useRef` is synchronous and survives across the
  render boundary.
