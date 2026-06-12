<!-- Created: 2026-06-09 01:34:58 -->
<!-- Completed: 2026-06-11 -->

# Task 9: Wire Window Component to Redux State

---

## Rationale

The existing `<Window>` component (`src/components/windows7/Window/Window.tsx`) is a pure
presentational shell — it renders 7.css title-bar chrome, a body slot, and an optional status
bar, but knows nothing about Redux, window identity, or lifecycle. Every prop (title, active,
glass, children) is passed in manually. That works for Storybook isolation, but the desktop
needs windows that **know who they are** — reading their geometry, focus state, and min/max
flags from `windowSlice` by id, and dispatching `closeWindow`, `minimizeWindow`,
`toggleMaximize`, and `focusWindow` from their title-bar controls.

`<ManagedWindow>` is the bridge between the stateless 7.css primitive and the Redux window
manager. It's a **composition**, not an extension — it wraps `<Window>`, it does not modify it.

```
┌─────────────────────────────────────────────────────┐
│  <ManagedWindow windowId="win-3">                   │
│    ┌─────────────────────────────────────────────┐  │
│    │  <Window title={...} active={...}           │  │
│    │    controls={<Minimize><Maximize><Close>}    │  │
│    │    glass>                                    │  │
│    │    {children}   ← content slot               │  │
│    │  </Window>                                   │  │
│    └─────────────────────────────────────────────┘  │
│                                                     │
│  CSS Module: absolute positioning via Redux state   │
│  onPointerDown → focusWindow (z-index promotion)    │
└─────────────────────────────────────────────────────┘
```

| Layer              | Responsibility                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<Window>` (7.css) | Presentational chrome — title bar, body, glass effect, status bar slot. No Redux awareness.                                                                                    |
| `<ManagedWindow>`  | Redux bridge — reads `WindowInstance` by id, injects position/size as inline styles, wires title-bar controls to dispatches, passes `active` based on top-of-stack comparison. |
| Window content     | Passed as `children` — `<ManagedWindow>` is content-agnostic. Task 17 maps `WindowKind` to content components.                                                                 |

### Key decisions

**Decision 1 — Composition over inheritance.** `<ManagedWindow>` wraps `<Window>` and passes
computed props down. The 7.css primitive stays untouched — it can still be used in Storybook
stories or non-Redux contexts. This is the adapter pattern.

**Decision 2 — `windowId` is the only required prop.** Everything else (`title`, `position`,
`size`, `zIndex`, `isMinimized`, `isMaximized`, `active`) is derived from Redux via
`selectWindowById(windowId)`. The component's public API is intentionally narrow.

**Decision 3 — `active` is derived from `selectTopWindowId`.** A window is active when its id
matches the top window id (highest z-index among visible windows). The 7.css `active` class
controls the title-bar gradient and button styling — the visual difference between a focused
and unfocused window is entirely handled by 7.css.

**Decision 4 — `onPointerDown` on the outer wrapper dispatches `focusWindow`.** Per CLAUDE.md:
"clicking any window dispatches `focusWindow`". This fires before any child handler, so a click
anywhere in the window — title bar, body, controls — promotes the z-index. The title-bar drag
handler (Task 10) will add `setPointerCapture` on top of this.

**Decision 5 — Maximize/Restore button label toggles between `aria-label="Maximize"` and
`aria-label="Restore"`.** 7.css renders different icons based on the `aria-label` attribute
value (or the `.is-maximize` / `.is-restore` class). The button must swap its label based on
`isMaximized` so the correct icon renders. This is how 7.css was designed — the aria-label
drives the visual.

**Decision 6 — The outer wrapper uses `position: absolute` with `left`, `top`, `width`,
`height` from Redux.** The CSS module defines the positioning context. The window-manager
container (Task 17) provides the `position: relative` parent. Inline styles for geometry
because these values are dynamic per-instance.

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 0 — Design tokens: `src/app/globals.css`

```css
/* TODO: [Action Required: add ManagedWindow tokens to globals.css] - 5 min
 *
 * Add these inside :root, after the Start Menu section.
 *
 * The ManagedWindow wrapper needs minimal new tokens — 7.css handles all
 * window chrome styling. These tokens control only the positioning layer
 * and the resize handle (future Task 11).
 *
 *   --mw-min-width: 240px          ← matches MIN_WINDOW_SIZE in windowSlice
 *   --mw-min-height: 160px         ← matches MIN_WINDOW_SIZE in windowSlice
 *
 * NOTE: The z-index layer for windows is already defined as --dsk-z-windows: 10.
 * ManagedWindow does NOT use this token directly — each window's z-index is a
 * dynamic value from Redux (state.window.byId[id].zIndex). The token exists for
 * the parent container's base layer.
 */
```

### Step 1 — ManagedWindow component: `src/components/screens/desktop/ManagedWindow/ManagedWindow.tsx`

```tsx
'use client'

// TODO: [Action Required: implement the Redux-wired window wrapper] - 30 min
//
//   This is the core of Task 9. It reads window state from Redux by id and
//   wires title-bar controls to dispatch actions.
//
//   Props:
//     interface ManagedWindowProps {
//       windowId: string
//       children?: ReactNode
//     }
//
//   Implementation:
//
//   1. READ STATE FROM REDUX:
//        const dispatch = useAppDispatch()
//        const windowData = useAppSelector(selectWindowById(windowId))
//        const topWindowId = useAppSelector(selectTopWindowId)
//
//        // Guard: if the window was closed between render cycles, render nothing.
//        if (!windowData) { return null }
//
//        const isActive = windowData.id === topWindowId
//
//   2. FOCUS ON POINTER DOWN:
//        function handlePointerDown() {
//          dispatch(focusWindow({ id: windowId }))
//        }
//
//        IMPORTANT: This fires on the outer wrapper, not the Window.
//        It must fire BEFORE any child handler (click, drag) so the z-index
//        promotion happens first. pointerdown fires before mousedown and click
//        in the event sequence — this is intentional.
//
//   3. TITLE-BAR CONTROL HANDLERS:
//
//        function handleClose() {
//          dispatch(closeWindow({ id: windowId }))
//        }
//
//        function handleMinimize() {
//          dispatch(minimizeWindow({ id: windowId }))
//        }
//
//        function handleToggleMaximize() {
//          // The viewport size must exclude the taskbar. Read it at dispatch time,
//          // not at mount time, because the window may exist for a long time and
//          // the viewport could change (resize, orientation).
//          //
//          // Use window.innerWidth / window.innerHeight minus the taskbar height.
//          // The taskbar height is defined as --dsk-taskbar-reserve in globals.css.
//          // Read it from the computed style:
//          const taskbarHeight = parseInt(
//            getComputedStyle(document.documentElement)
//              .getPropertyValue('--dsk-taskbar-reserve'),
//            10
//          ) || 40
//          dispatch(
//            toggleMaximize({
//              id: windowId,
//              viewport: {
//                width: window.innerWidth,
//                height: window.innerHeight - taskbarHeight,
//              },
//            })
//          )
//        }
//
//   4. RENDER TITLE-BAR CONTROLS:
//        The 7.css library renders Minimize / Maximize / Restore / Close icons
//        based on the button's aria-label attribute. The controls slot:
//
//        const controls = (
//          <>
//            <button aria-label="Minimize" onClick={handleMinimize} />
//            <button
//              aria-label={windowData.isMaximized ? 'Restore' : 'Maximize'}
//              onClick={handleToggleMaximize}
//            />
//            <button aria-label="Close" onClick={handleClose} />
//          </>
//        )
//
//        IMPORTANT: The Maximize/Restore button MUST swap aria-label based on
//        isMaximized. 7.css uses [aria-label="Maximize"] and [aria-label="Restore"]
//        selectors to render different icons. If you hardcode "Maximize", the
//        restore icon will never appear.
//
//   5. INLINE STYLES FROM REDUX:
//        const style: CSSProperties = {
//          position: 'absolute',
//          left: windowData.position.x,
//          top: windowData.position.y,
//          width: windowData.size.width,
//          height: windowData.size.height,
//          zIndex: windowData.zIndex,
//        }
//
//   6. RENDER:
//        <div
//          className={styles.managedWindow}
//          style={style}
//          onPointerDown={handlePointerDown}
//        >
//          <Window
//            title={windowData.title}
//            active={isActive}
//            glass
//            controls={controls}
//          >
//            {children}
//          </Window>
//        </div>
//
//        ARCHITECTURE NOTES:
//
//        - The outer <div> is the positioning shell. Its position/size come from
//          Redux inline styles. The inner <Window> fills it (width/height: 100%).
//        - `glass` is always true for desktop windows — the Aero glass effect
//          comes from 7.css's `.glass` class.
//        - The `active` prop maps to 7.css's `.active` class, which controls the
//          title-bar gradient brightness and control button hover effects.
//        - onPointerDown is on the outer div, not on Window. This ensures focus
//          promotion fires on ANY interaction — clicking the body, the title bar,
//          even a control button. The control's own onClick then fires normally
//          after the pointerdown.
//        - The handleToggleMaximize handler reads the CSS custom property at
//          dispatch time rather than storing it in state. This keeps the component
//          free of a resize listener (which Task 10/11 will need for drag clamping,
//          not for maximize).
```

### Step 2 — ManagedWindow styles: `src/components/screens/desktop/ManagedWindow/ManagedWindow.module.css`

```css
/* TODO: [Action Required: style the managed window wrapper] - 10 min
 *
 * The CSS module for ManagedWindow is minimal — 7.css handles all visual
 * chrome. This module handles only:
 *   1. The positioning shell (absolute, with dimensions from inline styles)
 *   2. Making the inner <Window> fill the shell
 *   3. The display: flex column layout so the window body stretches
 *
 * .managedWindow
 *   position: absolute;         ← inline left/top/width/height/zIndex from Redux
 *   display: flex;
 *   flex-direction: column;
 *
 *   IMPORTANT: DO NOT set width/height here. Those come from inline styles
 *   (Redux state). The CSS module only establishes the flex container so the
 *   inner 7.css .window can stretch.
 *
 * .managedWindow :global(.window)
 *   width: 100%;
 *   height: 100%;
 *   display: flex;
 *   flex-direction: column;
 *
 *   7.css's .window has position: relative and z-index: 0 by default.
 *   We need it to fill the managed wrapper. The :global() escape is
 *   required because .window is a 7.css global class, not a CSS module.
 *
 * .managedWindow :global(.window-body)
 *   flex: 1;
 *   overflow: auto;
 *
 *   The window body should stretch to fill remaining space after the
 *   title bar. 7.css's .window-body does not have flex: 1 by default.
 *   The overflow: auto ensures content scrolls if it exceeds the body.
 */
```

### Step 3 — Barrel export: `src/components/screens/desktop/ManagedWindow/index.ts`

```ts
// TODO: [Action Required: create barrel export] - 1 min
//   export { ManagedWindow } from './ManagedWindow'
//   export type { ManagedWindowProps } from './ManagedWindow'
```

### Step 4 — Storybook stories: `src/components/screens/desktop/ManagedWindow/ManagedWindow.stories.tsx`

```tsx
// TODO: [Action Required: create ManagedWindow stories] - 25 min
//
//   ManagedWindow reads from Redux, so every story must provide a pre-seeded
//   store via a decorator. The setupStore function accepts preloadedState.
//
//   IMPORTANT: You must construct the preloadedState manually to match
//   the WindowState shape — byId, ids, zCounter, nextIdSeed. You cannot
//   dispatch openWindow in a decorator because Storybook decorators run
//   at render time and the state must be present before first render.
//
//   Helper function for stories:
//
//     function makeWindowState(overrides: Partial<WindowInstance> = {}): WindowState {
//       const instance: WindowInstance = {
//         id: 'win-1',
//         kind: 'welcome',
//         title: 'Welcome',
//         position: { x: 100, y: 60 },
//         size: { width: 480, height: 360 },
//         zIndex: 1,
//         isMinimized: false,
//         isMaximized: false,
//         prevGeometry: null,
//         ...overrides,
//       }
//       return {
//         byId: { [instance.id]: instance },
//         ids: [instance.id],
//         zCounter: 1,
//         nextIdSeed: 1,
//       }
//     }
//
//   Decorator:
//     (Story, context) => {
//       const windowState = context.args.__windowState ?? makeWindowState()
//       const store = setupStore({ window: windowState })
//       return (
//         <Provider store={store}>
//           <div style={{
//             position: 'relative',
//             width: '100vw',
//             height: '100vh',
//             background: 'var(--desktop-backdrop) center / cover no-repeat',
//           }}>
//             <Story />
//           </div>
//         </Provider>
//       )
//     }
//
//   IMPORTANT: The parent div MUST have `position: relative` — ManagedWindow
//   uses `position: absolute` and needs a positioned parent.
//
//   Story 1 — Active:
//     args: { windowId: 'win-1' }
//     Default state from makeWindowState() — single window, active (top of stack).
//     Verify: Aero glass title bar is bright, controls are interactive.
//
//   Story 2 — Inactive:
//     args: {
//       windowId: 'win-1',
//       __windowState: {
//         byId: {
//           'win-1': { ...defaults, id: 'win-1', zIndex: 1 },
//           'win-2': { ...defaults, id: 'win-2', zIndex: 2, position: { x: 200, y: 100 } },
//         },
//         ids: ['win-1', 'win-2'],
//         zCounter: 2,
//         nextIdSeed: 2,
//       }
//     }
//     win-1 is behind win-2 — verify the title bar renders in the inactive
//     (dimmer) style. Two windows visible at once.
//
//   Story 3 — Maximized:
//     args: {
//       windowId: 'win-1',
//       __windowState: makeWindowState({
//         isMaximized: true,
//         position: { x: 0, y: 0 },
//         size: { width: 1280, height: 680 },
//         prevGeometry: { x: 100, y: 60, width: 480, height: 360 },
//       })
//     }
//     Verify: window fills the viewport, Maximize button shows Restore icon.
//
//   Story 4 — WithContent:
//     args: { windowId: 'win-1' }
//     Provide children: a paragraph or placeholder content inside the window body.
//     Verify: content renders inside the window body below the title bar.
```

### Step 5 — RTL integration tests: `src/components/screens/desktop/ManagedWindow/ManagedWindow.test.tsx`

```tsx
// TODO: [Action Required: test Redux wiring and control dispatches] - 25 min
//
//   Use renderWithProviders from '@/test-utils' with preloadedState.
//
//   Helper: build a preloadedState with one or two windows:
//
//     const SINGLE_WINDOW_STATE: Partial<RootState> = {
//       window: {
//         byId: {
//           'win-1': {
//             id: 'win-1',
//             kind: 'welcome',
//             title: 'Test Window',
//             position: { x: 100, y: 50 },
//             size: { width: 400, height: 300 },
//             zIndex: 1,
//             isMinimized: false,
//             isMaximized: false,
//             prevGeometry: null,
//           },
//         },
//         ids: ['win-1'],
//         zCounter: 1,
//         nextIdSeed: 1,
//       },
//     }
//
//   describe('ManagedWindow')
//
//     it('renders the window title from Redux state')
//       - Render <ManagedWindow windowId="win-1" /> with SINGLE_WINDOW_STATE
//       - expect(screen.getByText('Test Window')).toBeInTheDocument()
//
//     it('renders nothing when windowId does not exist in state')
//       - Render <ManagedWindow windowId="win-999" /> with SINGLE_WINDOW_STATE
//       - expect(screen.queryByText('Test Window')).not.toBeInTheDocument()
//       - The component itself should be absent from the DOM
//
//     it('applies position and size from Redux as inline styles')
//       - Render with SINGLE_WINDOW_STATE
//       - Find the outer wrapper (the element with position: absolute)
//         Use a data-testid="managed-window-win-1" or query by role
//       - Assert style.left === '100px', style.top === '50px',
//         style.width === '400px', style.height === '300px'
//
//     it('applies zIndex from Redux state')
//       - Render with SINGLE_WINDOW_STATE
//       - Find the outer wrapper
//       - Assert style.zIndex === '1'
//
//     it('passes active=true when window is the top window')
//       - Render with SINGLE_WINDOW_STATE (only one window — it's the top)
//       - The outer 7.css .window div should have the 'active' class
//       - Use container.querySelector('.window.active') or check classList
//
//     it('passes active=false when another window is on top')
//       - Create TWO_WINDOW_STATE with win-1 (zIndex: 1) and win-2 (zIndex: 2)
//       - Render <ManagedWindow windowId="win-1" />
//       - The .window div should NOT have the 'active' class
//
//     it('dispatches closeWindow when Close button is clicked')
//       - Render with SINGLE_WINDOW_STATE
//       - Click the button with aria-label="Close"
//       - Assert store.getState().window.ids does not include 'win-1'
//       - Assert store.getState().window.byId['win-1'] is undefined
//
//     it('dispatches minimizeWindow when Minimize button is clicked')
//       - Render with SINGLE_WINDOW_STATE
//       - Click the button with aria-label="Minimize"
//       - Assert store.getState().window.byId['win-1'].isMinimized === true
//
//     it('dispatches toggleMaximize when Maximize button is clicked')
//       - Render with SINGLE_WINDOW_STATE
//       - Click the button with aria-label="Maximize"
//       - Assert store.getState().window.byId['win-1'].isMaximized === true
//
//     it('shows Restore button when window is maximized')
//       - Create MAXIMIZED_WINDOW_STATE with isMaximized: true
//       - Render <ManagedWindow windowId="win-1" />
//       - expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()
//       - expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument()
//
//     it('dispatches focusWindow on pointerdown')
//       - Create TWO_WINDOW_STATE with win-1 at zIndex: 1, win-2 at zIndex: 2
//       - Render <ManagedWindow windowId="win-1" />
//       - fireEvent.pointerDown on the outer wrapper
//       - Assert store.getState().window.byId['win-1'].zIndex > 1
//         (it should now be 3 — zCounter was 2, bumped to 3)
//
//   NOTES:
//   - To query the 7.css global classes (.window, .active), use
//     container.querySelector() since RTL's screen queries don't match
//     CSS class names — they match accessible roles/labels/text.
//   - The title bar text is rendered in a .title-bar-text div by <Window>.
//     It IS accessible text so screen.getByText works.
//   - fireEvent.pointerDown is the correct event for the onPointerDown handler.
//     user-event's .click() fires mousedown, not pointerdown.
```

---

## File Inventory

| File                                                                     | Type                       | New/Modified |
| ------------------------------------------------------------------------ | -------------------------- | ------------ |
| `src/app/globals.css`                                                    | ManagedWindow tokens       | Modified     |
| `src/components/screens/desktop/ManagedWindow/ManagedWindow.tsx`         | Redux-wired window wrapper | New          |
| `src/components/screens/desktop/ManagedWindow/ManagedWindow.module.css`  | Positioning styles         | New          |
| `src/components/screens/desktop/ManagedWindow/index.ts`                  | Barrel export              | New          |
| `src/components/screens/desktop/ManagedWindow/ManagedWindow.stories.tsx` | Storybook stories (4)      | New          |
| `src/components/screens/desktop/ManagedWindow/ManagedWindow.test.tsx`    | RTL integration tests (11) | New          |

---

## Validation Checklist

```
## Task 9 — ManagedWindow Validation Checklist

| #  | Gate                                                                                          | Verified by                    | Status     |
| -- | --------------------------------------------------------------------------------------------- | ------------------------------ | ---------- |
| 1  | --mw-* tokens added to globals.css                                                           | grep globals.css for --mw-     | ⬜ Pending |
| 2  | ManagedWindow.tsx reads WindowInstance from Redux via selectWindowById                        | code review                    | ⬜ Pending |
| 3  | ManagedWindow.tsx derives `active` from selectTopWindowId comparison                         | code review                    | ⬜ Pending |
| 4  | Title-bar controls dispatch closeWindow, minimizeWindow, toggleMaximize                      | RTL test                       | ⬜ Pending |
| 5  | Maximize/Restore button swaps aria-label based on isMaximized                                | RTL test + code review         | ⬜ Pending |
| 6  | onPointerDown on outer wrapper dispatches focusWindow                                        | RTL test                       | ⬜ Pending |
| 7  | Inline styles apply position/size/zIndex from Redux state                                    | RTL test                       | ⬜ Pending |
| 8  | Component returns null when windowId not in state                                            | RTL test                       | ⬜ Pending |
| 9  | <Window> receives glass={true} and active from computed state                                | code review                    | ⬜ Pending |
| 10 | CSS module: inner .window fills the wrapper (width/height: 100%, flex column)                | code review                    | ⬜ Pending |
| 11 | No @dnd-kit imports (enforced by ESLint rule in eslint.config.mjs)                           | npx eslint                     | ⬜ Pending |
| 12 | Storybook: Active / Inactive / Maximized / WithContent stories                               | npm run storybook              | ⬜ Pending |
| 13 | No raw color/shadow/blur values in CSS module — all tokens                                   | grep for raw rgba/hex literals | ⬜ Pending |
| 14 | npx tsc --noEmit clean (excluding pre-existing errors)                                       | npx tsc --noEmit               | ⬜ Pending |
| 15 | npx eslint --max-warnings=0 clean on all new files                                           | npx eslint                     | ⬜ Pending |
| 16 | npm test green (all existing + new tests)                                                    | npm test                       | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **Adapter pattern, not inheritance.** `<ManagedWindow>` wraps the stateless 7.css `<Window>`
  and injects Redux-derived props. The primitive stays reusable in Storybook and non-Redux
  contexts. This is the same relationship `<StartMenuItem>` has to its shortcut data.
- **`windowId` is the sole identity prop.** Everything — title, position, size, z-index, focus
  state, min/max — is read from `windowSlice` via `selectWindowById(windowId)`. The
  component's public surface is as narrow as possible.
- **`active` is derived, not stored.** A window is active when `selectTopWindowId` returns its
  id. This is a computed selector (memoized via `createSelector`) — no extra state to sync.
  An interviewer might ask: "Why not store `isActive` in the slice?" Answer: it's derived from
  z-index ordering, and duplicating it would create a synchronization hazard.
- **`onPointerDown` for focus promotion fires before everything.** The Pointer Events spec
  guarantees `pointerdown` fires before `mousedown` and `click`. Placing the handler on the
  outer wrapper ensures z-index promotion happens before any child interaction — including
  title-bar button clicks and the future drag handler (Task 10).
- **7.css uses `aria-label` to select button icons.** The Maximize button becomes Restore by
  changing its `aria-label` — the CSS selector `[aria-label="Restore"]` renders a different
  background image. This means the accessible label and the visual icon are always in sync —
  a design win from 7.css's architecture.
