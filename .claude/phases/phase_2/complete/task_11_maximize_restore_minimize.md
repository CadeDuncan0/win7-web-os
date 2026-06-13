<!-- Created: 2026-06-12 15:52:51 -->
<!-- Completed: 2026-06-12 -->

# Task 11: Maximize / Restore / Minimize Geometry

---

## Rationale

Task 9 wired title-bar buttons to `minimizeWindow`, `toggleMaximize`, and `closeWindow`
dispatches. Task 10 added dragging. But Task 9's maximize button just flips a boolean and
overwrites geometry — it doesn't _feel_ like Windows 7 because the component layer is missing
two critical UX behaviors and one rendering rule:

1. **Double-click the title bar** toggles maximize/restore — the most-used window gesture in
   Windows 7 (and every desktop OS since). Currently only the Maximize button does this.
2. **Minimized windows must unmount from the DOM**, not hide via `display: none`. The task spec
   is explicit: "fully unmounted from the active stack." The `selectVisibleWindows` selector
   already filters them out — the component layer in the future WindowManager (Task 16) must
   honour that by conditionally rendering only visible windows. But `WindowWrapper` itself
   also needs to know when it _is_ maximized so it can apply full-bleed styles.
3. **Maximized window styling** — a maximized window fills the viewport minus the taskbar,
   has no border-radius on the corners (flush to edges), and its title bar should not initiate
   a drag (Task 10 already handles this via the `isMaximized` guard).

The slice-level logic is already complete (Task 1 built `toggleMaximize` with `prevGeometry`
snapshot/restore, `minimizeWindow`, `restoreWindow`, `focusWindow` un-minimizes). Task 11
is about the **component layer** completing the circuit:

```
┌────────────────────────────────────────────────────────────────┐
│ Already done (slice)                                          │
│  toggleMaximize: prevGeometry snapshot ↔ restore              │
│  minimizeWindow: isMinimized = true                           │
│  restoreWindow:  isMinimized = false + z-promote              │
│  focusWindow:    un-minimizes + z-promote                     │
│  moveWindow:     no-ops when isMaximized                      │
├────────────────────────────────────────────────────────────────┤
│ Task 11 (component layer)                                     │
│  ① Double-click title bar → toggleMaximize                    │
│  ② Maximized CSS: flush corners, no box-shadow border effect  │
│  ③ RTL + Storybook coverage                                   │
└────────────────────────────────────────────────────────────────┘
```

| Decision                                              | Why                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Double-click on the title bar, not the entire window  | Windows 7 semantics — only the title bar area responds to double-click maximize. Double-clicking the window body should not toggle state.                                                                                                                                                                                                            |
| `onDoubleClick` handler separate from `onPointerDown` | `pointerdown` drives drag (Task 10) and focus promotion (Task 9). `dblclick` is a distinct DOM event that fires _after_ two successive clicks — they do not conflict. React's `onDoubleClick` maps to the native `dblclick` event.                                                                                                                   |
| Exclude `.title-bar-controls` from double-click       | Double-clicking the Close button should close (two clicks), not maximize. The handler must check `closest('.title-bar-controls')` the same way the drag handler does.                                                                                                                                                                                |
| Maximized windows get a `.maximized` CSS class        | The wrapper needs `border-radius: 0` when maximized (flush to viewport edges). This is a behavior-driven class, not a design token — it overrides the 7.css default border-radius.                                                                                                                                                                   |
| Minimize unmount is a Task 16 (WindowManager) concern | `WindowWrapper` doesn't decide whether it renders — its parent does. The `selectVisibleWindows` selector already filters. Task 11 only needs to prove that the minimize dispatch works and that the store reflects the expected state. The actual unmount happens when the WindowManager maps `selectVisibleWindows` to `<WindowWrapper>` instances. |

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work. Steps target existing files unless noted.

### Step 0 — Double-click handler: `src/components/screens/desktop/WindowWrapper/WindowWrapper.tsx`

```tsx
// TODO: [Action Required: add title-bar double-click → toggleMaximize] - 10 min
//
//   Add a new handler function inside WindowWrapper:
//
//     function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
//       // 1. Only respond to double-clicks on the title bar itself
//       if (!(e.target as Element).closest('.title-bar')) return
//       // 2. Ignore double-clicks on the control buttons (Close, Minimize, Maximize)
//       if ((e.target as Element).closest('.title-bar-controls')) return
//       // 3. Dispatch toggleMaximize with the current viewport
//       //    Reuse the same viewport-reading logic from handleToggleMaximize —
//       //    extract the shared viewport computation into a local helper to
//       //    avoid duplicating the getComputedStyle + TASKBAR_RESERVE logic:
//       //
//       //      function getViewport() {
//       //        const taskbarHeight = parseInt(
//       //          getComputedStyle(document.documentElement)
//       //            .getPropertyValue('--dsk-taskbar-reserve'), 10
//       //        ) || TASKBAR_RESERVE
//       //        return {
//       //          width: window.innerWidth,
//       //          height: window.innerHeight - taskbarHeight,
//       //        }
//       //      }
//       //
//       //    Then both handleToggleMaximize and handleDoubleClick call
//       //    getViewport() instead of inlining the computation.
//       dispatch(toggleMaximize({ id: windowId, viewport: getViewport() }))
//     }
//
//   Attach it to the wrapper div:
//     onDoubleClick={handleDoubleClick}
//
//   Why onDoubleClick and not counting pointerdowns?
//   - The browser already debounces double-click detection with the correct
//     OS-level double-click interval. Rolling your own is a bug farm.
//   - React's onDoubleClick maps to the native 'dblclick' event which fires
//     AFTER the second mouseup — it never conflicts with pointerdown (drag)
//     or the single-click focus dispatch from Task 9.
```

### Step 1 — Maximized styles: `src/components/screens/desktop/WindowWrapper/WindowWrapper.module.css`

```css
/* TODO: [Action Required: add maximized class for flush-to-viewport styling] - 5 min
 *
 * .maximized :global(.window)
 *   border-radius: 0;
 *     ↑ 7.css gives .window a default border-radius for the Aero glass frame.
 *       A maximized window is flush to the viewport edges — rounding the
 *       corners would leave visible gaps. Windows 7 removes the radius at
 *       maximize; so do we.
 *
 *   box-shadow: none;
 *     ↑ 7.css applies a drop shadow on .window. Maximized windows sit flush
 *       against the viewport boundary — the shadow is invisible and just
 *       wastes a compositing layer. Windows 7 removes it.
 *
 * No new design tokens needed — these are behavior-driven overrides, not theme values.
 */
```

### Step 2 — Apply the `.maximized` class: `src/components/screens/desktop/WindowWrapper/WindowWrapper.tsx`

```tsx
// TODO: [Action Required: conditionally apply maximized CSS class] - 5 min
//
//   Modify the wrapperClass construction to include the maximized class
//   when windowData.isMaximized is true:
//
//     const wrapperClass = [
//       styles.WindowWrapper,
//       drag.isDragging && styles.dragging,
//       windowData.isMaximized && styles.maximized,
//     ]
//       .filter(Boolean)
//       .join(' ')
//
//   This replaces the ternary that only toggled .dragging. The array-filter-
//   join pattern scales to multiple conditional classes without nested
//   ternaries — same pattern the Window primitive uses for its merged class.
```

### Step 3 — RTL tests: `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`

```tsx
// TODO: [Action Required: add maximize/restore/minimize geometry tests] - 25 min
//
//   Add a new describe block after the dragging suite:
//
//   describe('WindowWrapper — maximize / restore / minimize geometry')
//
//     Reuse the existing SINGLE_WINDOW, MAXIMIZED_WINDOW, and TWO_WINDOWS
//     fixtures. The jsdom viewport is 1024×768.
//
//     it('toggles maximize on title-bar double-click')
//       - Render with SINGLE_WINDOW (position 100,50 / size 400×300)
//       - fireEvent.doubleClick on container.querySelector('.title-bar')
//       - Assert store: isMaximized === true
//       - Assert store: position === { x: 0, y: 0 }
//       - Assert store: size.width === 1024 (jsdom viewport width)
//       - Assert store: prevGeometry records the original { x: 100, y: 50,
//         width: 400, height: 300 }
//
//     it('restores original geometry on second title-bar double-click')
//       - Same setup, double-click twice
//       - After second double-click: isMaximized === false
//       - position === { x: 100, y: 50 }, size === { width: 400, height: 300 }
//       - prevGeometry === null
//
//     it('does not toggle maximize when double-clicking a control button')
//       - Double-click the Close button [aria-label="Close"]
//       - Assert: isMaximized is still false
//       - Note: the Close button's click handler will fire, so the window
//         may be closed — assert on the state BEFORE the close or test
//         on the Minimize button instead (which won't remove the window)
//       - Alternative: double-click the Minimize button and assert
//         isMaximized remains false (window will be minimized, not maximized)
//
//     it('does not toggle maximize when double-clicking the window body')
//       - Double-click on a child element inside the window body
//       - Assert: isMaximized remains false
//
//     it('applies the maximized CSS class when isMaximized is true')
//       - Render with MAXIMIZED_WINDOW fixture
//       - Assert: wrapper element has the CSS module's .maximized class
//       - Use: expect(wrapper.className).toMatch(/maximized/)
//         (CSS modules mangle class names, so use a regex or toContain)
//
//     it('does not have the maximized class when isMaximized is false')
//       - Render with SINGLE_WINDOW fixture
//       - Assert: wrapper className does NOT match /maximized/
//
//     it('dispatches minimizeWindow and the window remains in Redux')
//       - Click the Minimize button (already tested in Task 9, but this
//         test specifically asserts the STATE shape survives minimize:
//         isMinimized === true, id still in state.ids, byId entry intact)
//       - This proves the "remains present in windowSlice so the taskbar
//         button keeps the id" contract from the task spec
```

### Step 4 — Storybook story: `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx`

```tsx
// TODO: [Action Required: add DoubleClickMaximize story] - 5 min
//
//   Story 6 — DoubleClickMaximize:
//     Reuse makeWindowState() with no overrides (normal, non-maximized window).
//     args: { windowId: 'win-1' }
//
//     parameters.docs.description.story should explain:
//       'Double-click the title bar to maximize. Double-click again to restore
//        to original size and position. The window should fill the viewport
//        (minus the taskbar) when maximized and return exactly to its prior
//        geometry on restore. Double-clicking control buttons should NOT maximize.'
//
//   The existing Maximized story (Story 3) already shows the maximized STATE.
//   This new story demonstrates the INTERACTION: starting from a normal window,
//   the user can double-click to maximize and double-click again to restore.
```

---

## File Inventory

| File                                                                     | Type                                                              | New/Modified |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------------ |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.tsx`         | Double-click handler + maximized class + viewport helper refactor | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.module.css`  | `.maximized` overrides (border-radius, box-shadow)                | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.test.tsx`    | +7 maximize/restore/minimize tests                                | Modified     |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.stories.tsx` | +1 DoubleClickMaximize story                                      | Modified     |

---

## Validation Checklist

```
## Task 11 — Maximize / Restore / Minimize Geometry Validation Checklist

| #  | Gate                                                                              | Verified by              | Status     |
| -- | --------------------------------------------------------------------------------- | ------------------------ | ---------- |
| 1  | Double-click on title bar dispatches toggleMaximize                                | RTL test                 | ⬜ Pending |
| 2  | Second double-click restores original position/size from prevGeometry             | RTL test                 | ⬜ Pending |
| 3  | Double-click on .title-bar-controls does NOT toggle maximize                      | RTL test                 | ⬜ Pending |
| 4  | Double-click on window body does NOT toggle maximize                              | RTL test                 | ⬜ Pending |
| 5  | .maximized CSS class applied when isMaximized === true                            | RTL test                 | ⬜ Pending |
| 6  | .maximized CSS class absent when isMaximized === false                            | RTL test                 | ⬜ Pending |
| 7  | .maximized :global(.window) sets border-radius: 0 and box-shadow: none           | code review              | ⬜ Pending |
| 8  | Minimized window entry persists in Redux (id in ids, byId entry intact)           | RTL test                 | ⬜ Pending |
| 9  | Viewport helper extracts shared getComputedStyle logic (no duplication)           | code review              | ⬜ Pending |
| 10 | DoubleClickMaximize Storybook story added with interaction description            | npm run storybook        | ⬜ Pending |
| 11 | All existing Task 9 + Task 10 tests still pass (no regressions)                  | npm test                 | ⬜ Pending |
| 12 | npx eslint --max-warnings=0 clean                                                 | npx eslint               | ⬜ Pending |
| 13 | npm run build clean                                                               | npm run build            | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **The slice work is already done.** `toggleMaximize` snapshots `prevGeometry` on maximize and
  restores it on the second toggle. `minimizeWindow` / `restoreWindow` / `focusWindow` handle
  the minimize lifecycle. Task 11 is purely **component-layer wiring**.
- **Double-click on the title bar is the primary gesture.** The native `dblclick` event is the
  correct primitive — it handles double-click interval detection at the OS level and never
  conflicts with `pointerdown` (drag) because `dblclick` fires after the second `mouseup`.
  The `.title-bar-controls` exclusion prevents button double-clicks from triggering maximize.
- **Maximized windows get flush styling.** `border-radius: 0` and `box-shadow: none` override
  7.css defaults — a maximized window touches viewport edges with no gaps or shadows.
- **Minimize unmount is a WindowManager concern (Task 16), not WindowWrapper's.**
  `WindowWrapper` doesn't decide whether it renders. `selectVisibleWindows` filters minimized
  windows. The WindowManager will map that selector to `<WindowWrapper>` instances. Task 11
  only proves that the Redux state shape survives minimization.
- **Interview probe:** "Why `onDoubleClick` instead of counting `pointerdown` intervals?" —
  the browser already implements the OS double-click threshold; reimplementing it introduces
  platform-specific timing bugs and edge cases around pointer capture.
