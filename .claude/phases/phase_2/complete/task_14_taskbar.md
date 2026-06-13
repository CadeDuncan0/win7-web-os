<!-- Created: 2026-06-12 16:16:46 -->
<!-- Completed: 2026-06-12 -->

# Task 14: Build Taskbar Component

---

## Rationale

The taskbar is the persistent control surface of the Windows 7 desktop. Every window the user
opens gets a button in the taskbar; every interaction route (Start Menu, system clock, window
switching) passes through it. Task 14 builds three sub-components and composes them into a
single `<Taskbar>`:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌────────────┐ ┌────────────┐                  ┌──────────────┐  │
│ │ Start   │ │ Window A   │ │ Window B   │    ...            │  3:45 PM     │  │
│ │  Orb    │ │  (active)  │ │ (inactive) │                  │  6/12/2026   │  │
│ └─────────┘ └────────────┘ └────────────┘                  └──────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
  StartOrb      TaskbarButton (one per open window)           SystemTray
```

Architecture:

| Component       | Responsibility                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Taskbar`       | Full-width bar pinned to bottom. Composes the three zones. Owns Start Menu toggle state.                                                                                                                      |
| `StartOrb`      | Circular Windows logo button. Calls `onToggleStartMenu`. No own state.                                                                                                                                        |
| `TaskbarButton` | One per open window from `selectOpenWindows`. Click semantics match Win7: inactive → focus, active → minimize, minimized → restore+focus. Exposes a `ref` for Task 13's minimize-to-taskbar animation target. |
| `SystemTray`    | Live clock: time over date (`h:mm tt` / `M/d/yyyy`). `setInterval` + `useEffect` cleanup.                                                                                                                     |

| Decision                                                          | Why                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectOpenWindows` not `selectVisibleWindows` for buttons        | Minimized windows still show a taskbar button (inactive styling). `selectVisibleWindows` filters them out. `selectOpenWindows` returns all windows regardless of minimize state.                                                                                                                        |
| Start Menu toggle state lives in Taskbar, not Redux               | The open/closed state of the Start Menu is ephemeral UI — it doesn't affect other components and resets on any navigation. Local `useState` is simpler and correct. The `StartMenu` component already accepts `isOpen` / `onClose` as props (see `StartMenu.tsx`).                                      |
| `forwardRef` on TaskbarButton                                     | Task 13's minimize animation needs `getBoundingClientRect()` on the target button to calculate the translate destination. `forwardRef` exposes the button's DOM node to the parent without breaking encapsulation. The parent (Taskbar or WindowManager) can build a `Record<windowId, RefObject>` map. |
| Clock updates via `setInterval(1000)` not `requestAnimationFrame` | A clock that displays minutes doesn't need 60fps. One-second interval is the correct granularity. The interval must be cleaned up in `useEffect`'s return to avoid leaks on unmount.                                                                                                                    |
| 7.css has no taskbar styles                                       | The taskbar is custom CSS Modules. Glass effect uses the same `backdrop-filter: blur()` + semi-transparent background pattern as the Start Menu (`StartMenu.module.css`). All values via CSS custom properties in `globals.css`.                                                                        |
| System tray date format is US locale                              | Windows 7 default regional setting. `h:mm tt` = `3:45 PM` (12-hour), `M/d/yyyy` = `6/12/2026`. Use `Intl.DateTimeFormat` with explicit `en-US` locale for deterministic output across browser locales.                                                                                                  |

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 0 — Add taskbar design tokens: `src/app/globals.css`

```css
/* TODO: [Action Required: add taskbar CSS custom properties to :root] - 5 min
 *
 *   Add these tokens inside the existing :root block, grouped under a
 *   "SEMANTIC: Taskbar" comment section (after the Start Menu tokens):
 *
 *     --tb-height: 40px;
 *       (matches --dsk-taskbar-reserve — the desktop reserves this space)
 *
 *     --tb-bg: rgba(37, 44, 56, 0.75);
 *       (dark translucent — Win7 Aero taskbar is darker than the Start Menu)
 *
 *     --tb-glass-blur: 12px;
 *       (heavier blur than the Start Menu's 4px — the taskbar is always
 *        visible so the glass must be more opaque to maintain readability)
 *
 *     --tb-border-top: 1px solid rgba(255, 255, 255, 0.15);
 *       (subtle white highlight along the top edge, matching Aero glass)
 *
 *     --tb-shadow: 0 -2px 6px rgba(0, 0, 0, 0.3);
 *       (soft upward shadow — the taskbar floats above the desktop)
 *
 *     --tb-btn-height: 32px;
 *       (window buttons are inset from the taskbar height)
 *
 *     --tb-btn-min-width: 48px;
 *     --tb-btn-max-width: 180px;
 *       (buttons flex between these bounds depending on count)
 *
 *     --tb-btn-radius: 3px;
 *
 *     --tb-btn-bg: rgba(255, 255, 255, 0.08);
 *       (idle button — barely visible against the taskbar glass)
 *
 *     --tb-btn-bg-hover: rgba(255, 255, 255, 0.18);
 *     --tb-btn-bg-active: rgba(255, 255, 255, 0.25);
 *       (active = this window is the top/focused window)
 *
 *     --tb-btn-border: 1px solid rgba(255, 255, 255, 0.12);
 *     --tb-btn-border-active: 1px solid rgba(255, 255, 255, 0.3);
 *
 *     --tb-btn-text: rgba(255, 255, 255, 0.9);
 *     --tb-btn-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
 *
 *     --tb-clock-text: rgba(255, 255, 255, 0.9);
 *     --tb-clock-text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
 *
 *     --tb-orb-size: 44px;
 *       (the Start orb extends slightly above the taskbar — this is taller
 *        than --tb-height)
 *
 *     --tb-z: var(--dsk-z-taskbar);
 *       (9500 — above windows and overlays, below nothing)
 */
```

### Step 1 — SystemTray component: `src/components/screens/desktop/Taskbar/SystemTray.tsx`

```tsx
// TODO: [Action Required: build SystemTray with live clock] - 15 min
//
//   This is a presentational component that shows a live clock:
//   time on top, date below, updating once per second.
//
//   1. Create the file at the path above. Mark it 'use client'.
//
//   2. Build a custom hook or inline the logic — your choice.
//      The clock pattern:
//
//        const [now, setNow] = useState(() => new Date())
//
//        useEffect(() => {
//          const id = setInterval(() => setNow(new Date()), 1000)
//          return () => clearInterval(id)
//        }, [])
//
//   3. Format the time and date using Intl.DateTimeFormat for
//      locale-stable output:
//
//        Time: new Intl.DateTimeFormat('en-US', {
//          hour: 'numeric', minute: '2-digit', hour12: true
//        }).format(now)
//        → "3:45 PM"
//
//        Date: new Intl.DateTimeFormat('en-US', {
//          month: 'numeric', day: 'numeric', year: 'numeric'
//        }).format(now)
//        → "6/12/2026"
//
//      Cache the DateTimeFormat instances outside the component
//      (module-level constants) — constructing them is expensive
//      and the options never change.
//
//   4. Render structure:
//
//        <div className={styles.systemTray} role="status" aria-label="System tray">
//          <time className={styles.time} dateTime={now.toISOString()}>
//            {formattedTime}
//          </time>
//          <time className={styles.date} dateTime={now.toISOString()}>
//            {formattedDate}
//          </time>
//        </div>
//
//      Using <time> with dateTime is semantically correct and
//      accessible — screen readers can parse ISO 8601.
//
//   5. Props interface: none needed — this component is self-contained.
//      If you want to support Storybook time injection for deterministic
//      screenshots, add an optional `initialDate?: Date` prop that
//      overrides the initial useState value.
```

### Step 2 — SystemTray styles: `src/components/screens/desktop/Taskbar/SystemTray.module.css`

```css
/* TODO: [Action Required: style the system tray clock] - 5 min
 *
 *   .systemTray {
 *     display: flex;
 *     flex-direction: column;
 *     align-items: center;
 *     justify-content: center;
 *     padding: 0 var(--space-3);
 *     height: 100%;
 *     border-left: 1px solid rgba(255, 255, 255, 0.1);
 *       (subtle separator between buttons zone and clock)
 *   }
 *
 *   .time {
 *     font-size: var(--font-size-xs);
 *     color: var(--tb-clock-text);
 *     text-shadow: var(--tb-clock-text-shadow);
 *     line-height: 1.2;
 *     white-space: nowrap;
 *   }
 *
 *   .date {
 *     font-size: var(--font-size-xs);
 *     color: var(--tb-clock-text);
 *     text-shadow: var(--tb-clock-text-shadow);
 *     line-height: 1.2;
 *     white-space: nowrap;
 *     opacity: 0.85;
 *       (date is slightly dimmer than time — Win7 visual hierarchy)
 *   }
 */
```

### Step 3 — StartOrb component: `src/components/screens/desktop/Taskbar/StartOrb.tsx`

```tsx
// TODO: [Action Required: build the Start orb button] - 10 min
//
//   A circular button that toggles the Start Menu. Purely presentational —
//   the toggle state lives in the parent Taskbar.
//
//   1. Create the file. Mark it 'use client'.
//
//   2. Props interface:
//
//        interface StartOrbProps {
//          isMenuOpen: boolean
//          onClick: () => void
//        }
//
//   3. The Start orb in Windows 7 is a circular button with the Windows
//      logo. For now, use a CSS-only orb with text "Start" as the label.
//      The Start orb image asset doesn't exist yet — use a gradient
//      placeholder that can be swapped for an image later.
//
//      Render:
//
//        <button
//          className={orbClass}
//          onClick={onClick}
//          aria-label="Start"
//          aria-expanded={isMenuOpen}
//          aria-haspopup="menu"
//          type="button"
//        >
//          <span className={styles.logo} aria-hidden="true" />
//        </button>
//
//      The logo span is a placeholder for the Windows flag icon.
//      Use a CSS radial-gradient circle as the visual (see Step 4).
//
//   4. Class toggling:
//
//        const orbClass = [styles.startOrb, isMenuOpen && styles.active]
//          .filter(Boolean).join(' ')
//
//      When the menu is open, the orb gets a pressed/active appearance.
```

### Step 4 — StartOrb styles: `src/components/screens/desktop/Taskbar/StartOrb.module.css`

```css
/* TODO: [Action Required: style the Start orb] - 10 min
 *
 *   .startOrb {
 *     width: var(--tb-orb-size);
 *     height: var(--tb-orb-size);
 *     border-radius: var(--radius-full);
 *     border: none;
 *     cursor: pointer;
 *     display: flex;
 *     align-items: center;
 *     justify-content: center;
 *     position: relative;
 *     margin-top: -4px;
 *       (the orb extends slightly above the taskbar — Win7 signature)
 *     background: radial-gradient(circle at 40% 35%,
 *       #4bc0f0 0%, #1a7ec5 45%, #0e5a8e 100%);
 *       (placeholder gradient mimicking the Windows orb's blue sphere.
 *        Replace with a real image asset when available.)
 *     box-shadow:
 *       0 0 0 1px rgba(0, 0, 0, 0.4),
 *       0 2px 4px rgba(0, 0, 0, 0.3),
 *       inset 0 1px 2px rgba(255, 255, 255, 0.3);
 *     transition: filter 0.1s ease;
 *   }
 *
 *   .startOrb:hover {
 *     filter: var(--windows7-focus);
 *   }
 *
 *   .startOrb:active,
 *   .startOrb.active {
 *     filter: var(--windows7-active);
 *   }
 *
 *   .logo {
 *     width: 20px;
 *     height: 20px;
 *     (placeholder — a small square or SVG of the Windows flag.
 *      For now, leave empty or use a unicode character via ::after.
 *      The real asset will be added when available.)
 *   }
 */
```

### Step 5 — TaskbarButton component: `src/components/screens/desktop/Taskbar/TaskbarButton.tsx`

```tsx
// TODO: [Action Required: build TaskbarButton with Win7 click semantics] - 20 min
//
//   One button per open window. Click behavior matches Windows 7:
//
//     ┌─────────────────────────────────────────────────────────────┐
//     │ Window State    │ Click Action                             │
//     ├─────────────────┼──────────────────────────────────────────┤
//     │ Inactive (not   │ dispatch(focusWindow({ id }))           │
//     │  top z-index)   │ → promotes to top, switches active chrome│
//     │ Active (top     │ dispatch(minimizeWindow({ id }))        │
//     │  z-index)       │ → hides window, button stays in taskbar │
//     │ Minimized       │ dispatch(focusWindow({ id }))           │
//     │                 │ → restores + promotes (focusWindow       │
//     │                 │   un-minimizes per slice logic)          │
//     └─────────────────────────────────────────────────────────────┘
//
//   1. Create the file. Mark it 'use client'.
//
//   2. Props interface:
//
//        interface TaskbarButtonProps {
//          windowId: string
//        }
//
//   3. Use forwardRef so the parent can read getBoundingClientRect()
//      for the minimize-to-taskbar animation (Task 13 upgrade):
//
//        export const TaskbarButton = forwardRef<HTMLButtonElement, TaskbarButtonProps>(
//          function TaskbarButton({ windowId }, ref) {
//            ...
//          }
//        )
//
//   4. Read window state and top window id from Redux:
//
//        const dispatch = useAppDispatch()
//        const windowData = useAppSelector(selectWindowById(windowId))
//        const topWindowId = useAppSelector(selectTopWindowId)
//
//   5. Guard: if (!windowData) return null
//
//   6. Derive button state:
//
//        const isActive = windowData.id === topWindowId && !windowData.isMinimized
//
//      Note: a minimized window is NOT active even if it has the highest
//      zIndex, because selectTopWindowId filters minimized windows. But
//      the focusWindow reducer also un-minimizes, so the window that was
//      top before minimize might still match topWindowId. Guard with
//      !isMinimized to be safe.
//
//   7. Click handler:
//
//        function handleClick() {
//          if (windowData.isMinimized) {
//            dispatch(focusWindow({ id: windowId }))
//          } else if (isActive) {
//            dispatch(minimizeWindow({ id: windowId }))
//          } else {
//            dispatch(focusWindow({ id: windowId }))
//          }
//        }
//
//      Note: minimized and inactive both dispatch focusWindow. The
//      focusWindow reducer handles un-minimizing. You could collapse
//      these two branches, but keeping them explicit documents the
//      three distinct user intents.
//
//   8. Render:
//
//        <button
//          ref={ref}
//          className={buttonClass}
//          onClick={handleClick}
//          aria-label={windowData.title}
//          aria-pressed={isActive}
//          type="button"
//          title={windowData.title}
//        >
//          <span className={styles.label}>{windowData.title}</span>
//        </button>
//
//   9. Class toggling:
//
//        const buttonClass = [
//          styles.taskbarButton,
//          isActive && styles.active,
//          windowData.isMinimized && styles.minimized,
//        ].filter(Boolean).join(' ')
```

### Step 6 — TaskbarButton styles: `src/components/screens/desktop/Taskbar/TaskbarButton.module.css`

```css
/* TODO: [Action Required: style TaskbarButton with active/inactive/minimized states] - 10 min
 *
 *   .taskbarButton {
 *     height: var(--tb-btn-height);
 *     min-width: var(--tb-btn-min-width);
 *     max-width: var(--tb-btn-max-width);
 *     flex: 1 1 auto;
 *       (buttons share space equally, shrinking when many are open)
 *     padding: 0 var(--space-2);
 *     border: var(--tb-btn-border);
 *     border-radius: var(--tb-btn-radius);
 *     background: var(--tb-btn-bg);
 *     color: var(--tb-btn-text);
 *     text-shadow: var(--tb-btn-text-shadow);
 *     font: var(--w7-font);
 *     font-size: var(--font-size-xs);
 *     cursor: pointer;
 *     text-align: left;
 *     overflow: hidden;
 *     text-overflow: ellipsis;
 *     white-space: nowrap;
 *     transition: background 0.1s ease, border-color 0.1s ease;
 *   }
 *
 *   .taskbarButton:hover {
 *     background: var(--tb-btn-bg-hover);
 *   }
 *
 *   .taskbarButton.active {
 *     background: var(--tb-btn-bg-active);
 *     border: var(--tb-btn-border-active);
 *     box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.1);
 *   }
 *
 *   .taskbarButton.minimized {
 *     opacity: 0.7;
 *       (minimized windows are visually de-emphasized but still present)
 *   }
 *
 *   .label {
 *     pointer-events: none;
 *     overflow: hidden;
 *     text-overflow: ellipsis;
 *   }
 */
```

### Step 7 — Taskbar composition: `src/components/screens/desktop/Taskbar/Taskbar.tsx`

```tsx
// TODO: [Action Required: compose Taskbar from StartOrb + buttons + SystemTray] - 20 min
//
//   1. Create the file. Mark it 'use client'.
//
//   2. This component:
//      - Renders the full-width Aero taskbar pinned to the viewport bottom
//      - Owns the Start Menu toggle state (local useState)
//      - Iterates selectOpenWindows to render one TaskbarButton per window
//      - Renders the StartMenu component (isOpen/onClose)
//      - Renders SystemTray on the right
//
//   3. Props interface:
//
//        export interface TaskbarProps {}
//        (no props needed — all state comes from Redux and local state)
//
//   4. State and selectors:
//
//        const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
//        const openWindows = useAppSelector(selectOpenWindows)
//
//   5. Refs map for TaskbarButtons (for future minimize animation):
//
//        Build a ref map so each TaskbarButton's DOM node is accessible
//        by windowId. One approach:
//
//          const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
//
//        Pass a callback ref to each TaskbarButton:
//
//          ref={(el) => { buttonRefs.current[win.id] = el }}
//
//        This map is not consumed yet — Task 13's minimize animation
//        upgrade will use it. Wiring it now avoids a future refactor.
//
//   6. Render structure:
//
//        <nav className={styles.taskbar} role="navigation" aria-label="Taskbar">
//          <StartOrb
//            isMenuOpen={isStartMenuOpen}
//            onClick={() => setIsStartMenuOpen((prev) => !prev)}
//          />
//
//          <div className={styles.buttonGroup}>
//            {openWindows.map((win) => (
//              <TaskbarButton
//                key={win.id}
//                windowId={win.id}
//                ref={(el) => { buttonRefs.current[win.id] = el }}
//              />
//            ))}
//          </div>
//
//          <SystemTray />
//
//          <StartMenu
//            isOpen={isStartMenuOpen}
//            onClose={() => setIsStartMenuOpen(false)}
//          />
//        </nav>
//
//   7. The StartMenu is rendered inside the Taskbar so Taskbar owns its
//      lifecycle. StartMenu positions itself with `position: fixed;
//      bottom: var(--dsk-taskbar-reserve)` (already in StartMenu.module.css),
//      so it visually floats above the taskbar regardless of DOM nesting.
//
//   8. Start Menu click-outside handling:
//      The StartMenu already has click-outside detection (useEffect with
//      mousedown listener in StartMenu.tsx). The Start orb click fires
//      setIsStartMenuOpen(toggle) — but the mousedown on the orb also
//      triggers StartMenu's click-outside handler (the orb is outside
//      the panel ref). This would instantly close the menu on the same
//      click that opens it.
//
//      Fix: make the Start orb's onClick handler stop propagation of
//      the underlying mousedown, OR add the orb button's ref to the
//      StartMenu's "inside" check. The simplest approach: wrap the
//      orb in a div with onMouseDown={(e) => e.stopPropagation()}
//      so the StartMenu's document-level mousedown listener never
//      sees the orb click. Alternatively, use a ref on the orb and
//      pass it to StartMenu as an "ignore" target.
//
//      Pick one approach and verify in Storybook that toggling works:
//      click orb → menu opens, click orb again → menu closes, click
//      outside → menu closes.
```

### Step 8 — Taskbar styles: `src/components/screens/desktop/Taskbar/Taskbar.module.css`

```css
/* TODO: [Action Required: style the Taskbar with Aero glass] - 10 min
 *
 *   .taskbar {
 *     position: fixed;
 *     bottom: 0;
 *     left: 0;
 *     right: 0;
 *     height: var(--tb-height);
 *     z-index: var(--tb-z);
 *     display: flex;
 *     align-items: center;
 *     padding: 0 var(--space-1);
 *     gap: var(--space-1);
 *     background: var(--tb-bg);
 *     border-top: var(--tb-border-top);
 *     box-shadow: var(--tb-shadow);
 *   }
 *
 *   Glass effect — same pattern as StartMenu.module.css:
 *
 *   .taskbar::after {
 *     content: '';
 *     position: absolute;
 *     inset: 0;
 *     backdrop-filter: blur(var(--tb-glass-blur));
 *     -webkit-backdrop-filter: blur(var(--tb-glass-blur));
 *     z-index: -1;
 *     pointer-events: none;
 *   }
 *
 *   .buttonGroup {
 *     flex: 1;
 *     display: flex;
 *     align-items: center;
 *     gap: 2px;
 *       (tight gap between window buttons — Win7 signature)
 *     overflow: hidden;
 *       (buttons truncate text rather than overflowing the taskbar)
 *     height: 100%;
 *     padding: 4px 0;
 *       (vertically center the buttons within the taskbar)
 *   }
 */
```

### Step 9 — Barrel export: `src/components/screens/desktop/Taskbar/index.ts`

```tsx
// TODO: [Action Required: create the barrel export] - 2 min
//
//   export { Taskbar } from './Taskbar'
//   export type { TaskbarProps } from './Taskbar'
```

### Step 10 — Taskbar tests: `src/components/screens/desktop/Taskbar/Taskbar.test.tsx`

```tsx
// TODO: [Action Required: write RTL tests for Taskbar and sub-components] - 30 min
//
//   Use renderWithProviders from '@/test-utils'. Each test seeds
//   preloadedState with specific window configurations.
//
//   Test fixtures:
//
//     const NO_WINDOWS: Partial<RootState> = {
//       window: { byId: {}, ids: [], zCounter: 0, nextIdSeed: 0 }
//     }
//
//     const TWO_WINDOWS: Partial<RootState> = {
//       window: {
//         byId: {
//           'win-1': { id: 'win-1', kind: 'welcome', title: 'Window A',
//                      position: { x: 80, y: 80 }, size: { width: 640, height: 440 },
//                      zIndex: 1, isMinimized: false, isMaximized: false,
//                      prevGeometry: null },
//           'win-2': { id: 'win-2', kind: 'welcome', title: 'Window B',
//                      position: { x: 200, y: 100 }, size: { width: 640, height: 440 },
//                      zIndex: 2, isMinimized: false, isMaximized: false,
//                      prevGeometry: null },
//         },
//         ids: ['win-1', 'win-2'],
//         zCounter: 2,
//         nextIdSeed: 2,
//       }
//     }
//
//     const MINIMIZED_WINDOW: Partial<RootState> = {
//       window: {
//         byId: {
//           'win-1': { id: 'win-1', kind: 'welcome', title: 'Minimized Win',
//                      position: { x: 80, y: 80 }, size: { width: 640, height: 440 },
//                      zIndex: 1, isMinimized: true, isMaximized: false,
//                      prevGeometry: null },
//         },
//         ids: ['win-1'],
//         zCounter: 1,
//         nextIdSeed: 1,
//       }
//     }
//
//   describe('Taskbar')
//
//     it('renders the taskbar navigation landmark')
//       - Render <Taskbar /> with NO_WINDOWS
//       - screen.getByRole('navigation', { name: /taskbar/i })
//
//     it('renders the Start orb button')
//       - Render <Taskbar /> with NO_WINDOWS
//       - screen.getByRole('button', { name: /start/i })
//
//     it('renders the system tray with time and date')
//       - Render <Taskbar /> with NO_WINDOWS
//       - screen.getByRole('status', { name: /system tray/i })
//       - Verify two <time> elements exist inside it
//
//     it('renders one button per open window')
//       - Render <Taskbar /> with TWO_WINDOWS
//       - screen.getByRole('button', { name: 'Window A' })
//       - screen.getByRole('button', { name: 'Window B' })
//
//     it('still shows a button for minimized windows')
//       - Render <Taskbar /> with MINIMIZED_WINDOW
//       - screen.getByRole('button', { name: 'Minimized Win' })
//
//   describe('TaskbarButton — click semantics')
//
//     it('clicking an inactive window button focuses it')
//       - Render <Taskbar /> with TWO_WINDOWS (win-2 is active)
//       - Click the 'Window A' button
//       - Assert: store.getState().window.byId['win-1'].zIndex > win-2's zIndex
//
//     it('clicking the active window button minimizes it')
//       - Render <Taskbar /> with TWO_WINDOWS (win-2 is active/top)
//       - Click the 'Window B' button
//       - Assert: store.getState().window.byId['win-2'].isMinimized === true
//
//     it('clicking a minimized window button restores and focuses it')
//       - Render <Taskbar /> with MINIMIZED_WINDOW
//       - Click the 'Minimized Win' button
//       - Assert: store.getState().window.byId['win-1'].isMinimized === false
//       - Assert: win-1 zIndex bumped (higher than before)
//
//   describe('StartOrb — Start Menu toggle')
//
//     it('toggles the Start Menu on orb click')
//       - Render <Taskbar />
//       - Click the Start button
//       - Assert: screen.getByRole('menu', { name: /start menu/i }) is present
//       - Click the Start button again
//       - Assert: menu is no longer in the document
//
//   describe('SystemTray — clock')
//
//     it('updates time on interval')
//       - Use vi.useFakeTimers()
//       - Render <Taskbar />
//       - Note the initial time text
//       - vi.advanceTimersByTime(61000) (advance 61 seconds)
//       - Assert: the time text has changed (minute rolled over)
//       - vi.useRealTimers() in afterEach
//
//     it('cleans up interval on unmount')
//       - Use vi.useFakeTimers()
//       - const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
//       - Render, then unmount
//       - Assert: clearIntervalSpy was called
//       - vi.useRealTimers()
```

### Step 11 — Storybook stories: `src/components/screens/desktop/Taskbar/Taskbar.stories.tsx`

```tsx
// TODO: [Action Required: write Storybook stories for Taskbar] - 15 min
//
//   Stories to cover (per task spec):
//
//   1. Idle — no open windows
//      Render <Taskbar /> with empty window state.
//      Shows: Start orb + empty button group + system tray clock.
//
//   2. WithWindows — two open windows
//      Seed with TWO_WINDOWS state. Shows two taskbar buttons,
//      one active (win-2 has higher zIndex).
//
//   3. WithManyWindows — six or more windows
//      Stress test for button overflow. Buttons should truncate
//      labels and share space equally.
//
//   4. StartMenuOpen — Start Menu visible
//      Use a custom decorator that renders Taskbar and auto-clicks
//      the Start orb via a useEffect to show the Start Menu.
//      OR use a play function:
//
//        play: async ({ canvasElement }) => {
//          const canvas = within(canvasElement)
//          await userEvent.click(canvas.getByRole('button', { name: /start/i }))
//        }
//
//   5. MinimizedWindow — one window minimized, one active
//      Shows inactive styling on the minimized window's button.
//
//   Meta setup:
//     - title: 'Desktop/Taskbar'
//     - component: Taskbar
//     - parameters: { layout: 'fullscreen' }
//     - Decorator: Provider with setupStore, and a container div
//       with desktop background + relative positioning so the
//       fixed taskbar renders correctly in the Storybook canvas.
//
//   Each story passes preloaded window state via the decorator's
//   store setup — same pattern as WindowWrapper stories. Use
//   setupStore({ window: ... }) with WindowState fixtures.
```

---

## File Inventory

| File                                                              | Type                                              | New/Modified |
| ----------------------------------------------------------------- | ------------------------------------------------- | ------------ |
| `src/app/globals.css`                                             | Taskbar design tokens in `:root`                  | Modified     |
| `src/components/screens/desktop/Taskbar/SystemTray.tsx`           | Live clock component                              | New          |
| `src/components/screens/desktop/Taskbar/SystemTray.module.css`    | Clock styles                                      | New          |
| `src/components/screens/desktop/Taskbar/StartOrb.tsx`             | Start orb button                                  | New          |
| `src/components/screens/desktop/Taskbar/StartOrb.module.css`      | Orb styles                                        | New          |
| `src/components/screens/desktop/Taskbar/TaskbarButton.tsx`        | Per-window button with Win7 click semantics       | New          |
| `src/components/screens/desktop/Taskbar/TaskbarButton.module.css` | Button active/inactive/minimized styles           | New          |
| `src/components/screens/desktop/Taskbar/Taskbar.tsx`              | Composition: orb + buttons + tray + StartMenu     | New          |
| `src/components/screens/desktop/Taskbar/Taskbar.module.css`       | Aero glass taskbar layout                         | New          |
| `src/components/screens/desktop/Taskbar/index.ts`                 | Barrel export                                     | New          |
| `src/components/screens/desktop/Taskbar/Taskbar.test.tsx`         | RTL tests (click semantics, clock, toggle)        | New          |
| `src/components/screens/desktop/Taskbar/Taskbar.stories.tsx`      | Storybook stories (idle, windows, overflow, menu) | New          |

---

## Validation Checklist

```
## Task 14 — Build Taskbar Component Validation Checklist

| #  | Gate                                                                              | Verified by       | Status     |
| -- | --------------------------------------------------------------------------------- | ----------------- | ---------- |
| 1  | Taskbar renders as a fixed nav at viewport bottom                                | Storybook visual  | ⬜ Pending |
| 2  | Taskbar height matches --dsk-taskbar-reserve (40px)                              | code review       | ⬜ Pending |
| 3  | Aero glass effect: backdrop-filter blur + semi-transparent bg                    | Storybook visual  | ⬜ Pending |
| 4  | Start orb renders and toggles Start Menu on click                                | RTL test          | ⬜ Pending |
| 5  | Start Menu opens/closes correctly (no double-fire from click-outside)            | Storybook visual  | ⬜ Pending |
| 6  | One TaskbarButton per open window (including minimized)                          | RTL test          | ⬜ Pending |
| 7  | Click inactive button → focusWindow dispatched                                   | RTL test          | ⬜ Pending |
| 8  | Click active button → minimizeWindow dispatched                                  | RTL test          | ⬜ Pending |
| 9  | Click minimized button → focusWindow dispatched (restores + focuses)             | RTL test          | ⬜ Pending |
| 10 | Active button has distinct styling (--tb-btn-bg-active)                          | Storybook visual  | ⬜ Pending |
| 11 | Minimized button has de-emphasized styling                                       | Storybook visual  | ⬜ Pending |
| 12 | SystemTray shows time in h:mm tt format                                          | RTL test          | ⬜ Pending |
| 13 | SystemTray shows date in M/d/yyyy format                                         | RTL test          | ⬜ Pending |
| 14 | Clock updates every second via setInterval                                       | RTL test          | ⬜ Pending |
| 15 | setInterval cleaned up on unmount                                                | RTL test          | ⬜ Pending |
| 16 | TaskbarButton uses forwardRef (ref accessible to parent)                         | code review       | ⬜ Pending |
| 17 | Buttons truncate long titles with text-overflow: ellipsis                        | Storybook visual  | ⬜ Pending |
| 18 | Many-windows story shows buttons sharing space equally                           | Storybook visual  | ⬜ Pending |
| 19 | All design tokens reference globals.css custom properties (no magic values)      | code review       | ⬜ Pending |
| 20 | npx vitest run --project unit passes                                             | npx vitest        | ⬜ Pending |
| 21 | npx eslint --max-warnings=0 clean                                                | npx eslint        | ⬜ Pending |
| 22 | npm run build clean                                                              | npm run build     | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **Three sub-components compose the taskbar.** `StartOrb` (toggle button), `TaskbarButton`
  (one per open window with Win7 click semantics), and `SystemTray` (live clock). `Taskbar`
  composes them into a fixed-bottom Aero glass bar.
- **TaskbarButton click semantics are the core behavior.** Three states, three actions:
  inactive → focus, active → minimize, minimized → restore+focus. All three route through
  existing windowSlice reducers (`focusWindow`, `minimizeWindow`). The reducer handles the
  un-minimize-on-focus logic — the component doesn't need to call `restoreWindow` separately.
- **`forwardRef` on TaskbarButton enables future minimize animation.** Task 13's minimize
  exit variant currently scales to zero. With button refs exposed, the animation can be
  upgraded to translate toward `getBoundingClientRect()` of the target button — matching
  the Windows 7 minimize-to-taskbar effect.
- **The clock uses `Intl.DateTimeFormat` for deterministic locale output.** Hardcoding
  `'en-US'` prevents the clock from rendering differently based on the visitor's browser
  locale. The format objects are module-level constants — they're expensive to construct
  and the options never change.
- **Interview probe:** "Why `selectOpenWindows` instead of `selectVisibleWindows` for
  taskbar buttons?" — Minimized windows are hidden from the desktop (unmounted) but still
  present in the taskbar. `selectVisibleWindows` filters minimized windows for the desktop
  renderer. `selectOpenWindows` returns all windows for the taskbar. Two different views of
  the same state, serving two different UI contracts.
