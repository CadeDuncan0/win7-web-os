<!-- Created: 2026-06-13 -->
<!-- Completed: 2026-06-13 -->

# Task 16: Compose `/desktop` Route

---

## Rationale

Tasks 1–15 built every piece of the desktop environment in isolation: Redux slices (windowSlice,
desktopSlice, sessionSlice), the `<Desktop>` shell with icon/window/overlay layers, `<IconGrid>`
with drag-and-drop, `<WindowWrapper>` with drag/focus/animations, `<Taskbar>` with Start
orb/clock/window buttons, `<StartMenu>` with search and sign-out, and
`<InternetExplorerWindow>` as the primary content surface. But the `/desktop` page
(`src/app/desktop/page.tsx`) still renders a placeholder — `<Desktop />` with empty slots and a
standalone "Sign Out" `<Button>` floating outside the composition.

Task 16 replaces that placeholder with the real product: a fully composed desktop route that
stitches every component together into the layered stack a visitor actually sees.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <DesktopPage>            (src/app/desktop/page.tsx)                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ <Desktop>             (shell: icon layer + window layer + overlay) │  │
│  │  iconGrid  = <IconGrid icons={DESKTOP_ICONS} />                    │  │
│  │  windowLayer = <WindowManager />    ← NEW: renders visible windows │  │
│  │  overlay   = (reserved for future context menus)                   │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ <Taskbar />           (pinned bottom, owns StartMenu toggle)       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  (sign-out is now in StartMenu, NOT a standalone button)                │
└──────────────────────────────────────────────────────────────────────────┘
```

The critical new piece is the **WindowManager** — a thin component that reads
`selectVisibleWindows` from Redux, wraps the list in `<AnimatePresence>`, and renders a
`<WindowWrapper>` for each visible window. Inside each `<WindowWrapper>`, the WindowManager
maps the window's `kind` to the correct content component using a typed **window content
registry**. This registry is the bridge between the Redux `WindowKind` discriminator and the
React component tree.

| Decision                                                                          | Why                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WindowManager is a separate component, not inline in page.tsx                     | It's a `'use client'` component with hooks (useAppSelector). `page.tsx` should remain as thin as possible — a composition root, not a logic host. The WindowManager encapsulates the `selectVisibleWindows` → render loop + AnimatePresence wrapper.                                       |
| Window content registry maps `WindowKind → React component`                       | The windowSlice is content-agnostic — it stores `kind: 'internet-explorer'` but has no React dependency. The registry is the lookup table that resolves a kind to the actual `<InternetExplorerWindow>` (or `<WelcomeContent>`, etc.). This keeps the slice pure and the mapping explicit. |
| `initialRoute` for IE windows is derived from the window title via `titleToRoute` | The StartMenu dispatches `openWindow({ kind: 'internet-explorer', title: 'Resume' })`. The registry maps `'Resume'` to `portfolio://resume` using `titleToRoute` from the IE route registry. This is the handoff between the Redux action and the IE navigation state.                     |
| The standalone Sign Out button in page.tsx is retired                             | Sign Out now lives in the StartMenu (Task 8). The old `<Button onClick={handleSignOut}>` is removed. The Transition screen ("Logging off...") is preserved — it's triggered by the StartMenu's sign-out action.                                                                            |
| `page.tsx` keeps the Transition screen for sign-out                               | The sign-out flow uses the same `<Transition message="Logging off..." />` screen. But the trigger moves from a direct button click to a Redux/router action dispatched by the StartMenu. `page.tsx` listens for the sign-out state change and conditionally renders the Transition.        |
| DESKTOP_ICONS is a static registry array, not in Redux                            | Icon definitions (id, label, iconSrc, windowKind, windowTitle) are static product data. They never change at runtime. Redux stores only the _positions_ (desktopSlice). The static registry lives in a `desktopIcons.ts` file alongside page.tsx or in the desktop components directory.   |
| Desktop icon assets use placeholder paths initially                               | Real Windows 7 icon assets (My Computer, IE, Recycle Bin) are not yet in the repo. The registry references placeholder paths. Task 17 or Phase 4 can replace them with authentic assets.                                                                                                   |

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 0 — Desktop icon registry: `src/components/screens/desktop/desktopIcons.ts`

```tsx
// TODO: [Action Required: define the static icon registry] - 10 min
//
//   This file defines the desktop icons shown on the icon grid. It is the
//   single source of truth for what icons exist, what they look like, and
//   what window they open when double-clicked.
//
//   The IconGrid component already accepts an `icons` prop with this shape:
//
//     Array<{
//       id: string
//       label: string
//       iconSrc: string
//       windowKind: WindowKind
//       windowTitle: string
//     }>
//
//   Define a matching typed array:
//
//     import type { WindowKind } from '@/store/slices/windowSlice'
//
//     export interface DesktopIconDefinition {
//       id: string
//       label: string
//       iconSrc: string
//       windowKind: WindowKind
//       windowTitle: string
//     }
//
//     // TODO: replace placeholder icon paths with real Win7 icon assets
//     const PLACEHOLDER_ICON = '/imgs/login/windows-logo.png'
//
//     export const DESKTOP_ICONS: DesktopIconDefinition[] = [
//       {
//         id: 'icon-ie',
//         label: 'Internet Explorer',
//         iconSrc: '/imgs/windows7/assets/internetexplorer_logo.png',
//         windowKind: 'internet-explorer',
//         windowTitle: 'Internet Explorer',
//       },
//       {
//         id: 'icon-resume',
//         label: 'Resume',
//         iconSrc: PLACEHOLDER_ICON,
//         windowKind: 'internet-explorer',
//         windowTitle: 'Resume',
//       },
//       {
//         id: 'icon-projects',
//         label: 'Projects',
//         iconSrc: PLACEHOLDER_ICON,
//         windowKind: 'internet-explorer',
//         windowTitle: 'Projects',
//       },
//       {
//         id: 'icon-welcome',
//         label: 'Welcome',
//         iconSrc: PLACEHOLDER_ICON,
//         windowKind: 'welcome',
//         windowTitle: 'Welcome',
//       },
//       {
//         id: 'icon-about',
//         label: 'About This PC',
//         iconSrc: PLACEHOLDER_ICON,
//         windowKind: 'about-this-pc',
//         windowTitle: 'About This PC',
//       },
//     ]
//
//   The id values are stable identifiers used as React keys and Redux icon
//   ids (desktopSlice.registerIcon). The iconSrc for Internet Explorer uses
//   the real logo asset; others use a placeholder until dedicated icon PNGs
//   are added.
//
//   The windowTitle for IE-kind icons is the title used by titleToRoute()
//   in the IE component to determine the initial route (e.g., 'Resume' →
//   'portfolio://resume').
```

### Step 1 — Window content registry + WindowManager: `src/components/screens/desktop/WindowManager/WindowManager.tsx`

```tsx
// TODO: [Action Required: build the WindowManager compositor] - 20 min
//
//   The WindowManager reads visible windows from Redux and renders a
//   <WindowWrapper> for each one, with the correct content component
//   inside based on the window's `kind`.
//
//   1. Create the directory: src/components/screens/desktop/WindowManager/
//
//   2. Define the window content registry — a function that maps WindowKind
//      to the correct React content:
//
//        function renderWindowContent(window: WindowInstance): ReactNode {
//          switch (window.kind) {
//            case 'internet-explorer':
//              return (
//                <InternetExplorerWindow
//                  initialRoute={titleToRoute(window.title)}
//                />
//              )
//            case 'welcome':
//              return <WelcomeContent />
//            case 'about-this-pc':
//              return <AboutThisPCContent />
//          }
//        }
//
//      For now, WelcomeContent and AboutThisPCContent are simple inline
//      placeholder components:
//
//        function WelcomeContent() {
//          return (
//            <div style={{ padding: 20 }}>
//              <h2>Welcome to Windows 7</h2>
//              <p>This is Cade Duncan&apos;s portfolio website.</p>
//            </div>
//          )
//        }
//
//        function AboutThisPCContent() {
//          return (
//            <div style={{ padding: 20 }}>
//              <h2>About This PC</h2>
//              <p>Windows 7 Portfolio Edition</p>
//              <p>Built with Next.js, React, Redux, and TypeScript.</p>
//            </div>
//          )
//        }
//
//      These are deliberately minimal. They are stub content components
//      that prove the window kind → content mapping works. Future tasks
//      can replace them with real components.
//
//   3. The WindowManager component:
//
//        export function WindowManager() {
//          const visibleWindows = useAppSelector(selectVisibleWindows)
//
//          return (
//            <AnimatePresence>
//              {visibleWindows.map((win) => (
//                <WindowWrapper key={win.id} windowId={win.id}>
//                  {renderWindowContent(win)}
//                </WindowWrapper>
//              ))}
//            </AnimatePresence>
//          )
//        }
//
//      CRITICAL: AnimatePresence wraps the list. This is what makes
//      Framer Motion exit animations work — when a window is closed or
//      minimized (removed from visibleWindows), AnimatePresence keeps
//      the motion.div mounted long enough to play the exit animation
//      before React unmounts it.
//
//      The `key={win.id}` on each WindowWrapper is what AnimatePresence
//      uses to track entering/exiting children.
//
//   4. WindowWrapper already has pointer-events: auto in its CSS, so
//      windows are clickable even though the parent windowLayer has
//      pointer-events: none. Verify this in WindowWrapper.module.css.
//
//   5. Create WindowManager/index.ts barrel:
//        export { WindowManager } from './WindowManager'
```

### Step 2 — Rewrite `src/app/desktop/page.tsx`

```tsx
// TODO: [Action Required: compose the full desktop route] - 15 min
//
//   The current page.tsx has:
//     - A standalone <Desktop /> with no slot content
//     - A <Button> for sign-out
//     - A <Transition> screen for the sign-out animation
//
//   Replace with the full composition:
//
//     'use client'
//
//     export default function DesktopPage() {
//       return (
//         <>
//           <Desktop
//             iconGrid={<IconGrid icons={DESKTOP_ICONS} />}
//             windowLayer={<WindowManager />}
//           />
//           <Taskbar />
//         </>
//       )
//     }
//
//   Key changes:
//
//   a) Desktop slots are filled:
//      - iconGrid: <IconGrid icons={DESKTOP_ICONS} /> using the registry
//        from desktopIcons.ts
//      - windowLayer: <WindowManager /> — the new compositor
//      - overlay: omitted for now (reserved for context menus in future)
//
//   b) Taskbar is rendered AFTER Desktop, not inside it. The Taskbar uses
//      position: fixed with its own z-index (--tb-z), so it floats above
//      everything. It doesn't need to be a slot in Desktop.
//
//   c) The standalone Sign Out <Button> is REMOVED. Sign Out now lives
//      exclusively in the StartMenu component (Task 8). The StartMenu
//      already handles signOut() + clearSession() + router.push('/login').
//
//   d) The Transition screen ("Logging off...") is no longer needed in
//      page.tsx. The StartMenu handles the sign-out navigation directly
//      via router.push('/login'). The Transition component can be re-added
//      later if a sign-out animation is desired, but for now, the direct
//      navigation is clean and correct.
//
//   e) Remove the useState, useRouter, handleSignOut, and isSigningOut
//      logic — all sign-out responsibility is in the StartMenu.
//
//   f) Remove the <main> wrapper. The Desktop component already renders
//      as a full-screen fixed div with role="main". A nested <main>
//      would violate ARIA landmark uniqueness.
//
//   g) Imports to add:
//      - { Desktop } from '@/components/screens/desktop'
//      - { IconGrid } from '@/components/screens/desktop'
//      - { Taskbar } from '@/components/screens/desktop/Taskbar'
//      - { WindowManager } from '@/components/screens/desktop/WindowManager'
//      - { DESKTOP_ICONS } from '@/components/screens/desktop/desktopIcons'
//
//   h) Imports to REMOVE:
//      - { useRouter } from 'next/navigation'
//      - { useState } from 'react'
//      - { Button } from '@/components/windows7/Button'
//      - { signOut } from '@/lib/auth'
//      - { Transition } from '@/components/screens/Transition'
```

### Step 3 — Update barrel exports: `src/components/screens/desktop/index.ts`

```tsx
// TODO: [Action Required: add WindowManager and desktopIcons to barrel] - 2 min
//
//   The current barrel exports:
//     export * from './Desktop'
//     export * from './DesktopIcon'
//     export * from './IconGrid'
//     export * from './WindowWrapper'
//     export * from './StartMenu'
//
//   Add:
//     export * from './WindowManager'
//
//   The Taskbar is intentionally NOT re-exported from this barrel —
//   it has its own import path and was established that way in Task 14.
//
//   desktopIcons.ts is a data file, not a component directory. It can
//   be imported directly: '@/components/screens/desktop/desktopIcons'.
//   Adding it to the barrel is optional.
```

### Step 4 — Verify WindowWrapper has pointer-events

```tsx
// TODO: [Action Required: verify pointer-events: auto on WindowWrapper] - 2 min
//
//   The Desktop shell sets pointer-events: none on the windowLayer div
//   so clicks pass through to the icon layer beneath. Each WindowWrapper
//   must re-enable pointer-events on itself.
//
//   Check WindowWrapper.module.css for:
//
//     .WindowWrapper {
//       pointer-events: auto;
//     }
//
//   If it's missing, add it. Without this, windows are visible but
//   unclickable — the windowLayer's pointer-events: none propagates
//   to all children unless explicitly overridden.
```

### Step 5 — RTL tests: `src/app/desktop/page.test.tsx`

```tsx
// TODO: [Action Required: write integration tests for the composed route] - 20 min
//
//   This is the first test that exercises the full composition. It
//   verifies that page.tsx correctly wires all components together.
//
//   Use renderWithProviders from '@/test-utils'. Mock next/navigation
//   (useRouter) since it's used by StartMenu's sign-out flow.
//
//   vi.mock('next/navigation', () => ({
//     useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
//   }))
//
//   Mock the auth module since signOut makes a network call:
//   vi.mock('@/lib/auth', () => ({
//     signOut: vi.fn().mockResolvedValue(undefined),
//   }))
//
//   describe('DesktopPage')
//
//     it('renders the desktop shell')
//       - Render <DesktopPage />
//       - screen.getByRole('main', { name: /desktop/i })
//
//     it('renders the icon grid with desktop icons')
//       - Render <DesktopPage />
//       - screen.getByTestId('icon-grid') exists
//       - Assert each DESKTOP_ICONS entry appears as a button with
//         the correct aria-label (e.g., 'Internet Explorer', 'Resume', etc.)
//
//     it('renders the taskbar')
//       - Render <DesktopPage />
//       - screen.getByRole('navigation', { name: /taskbar/i })
//
//     it('does not render a standalone Sign Out button')
//       - Render <DesktopPage />
//       - Verify there is no <button> with text "Sign Out" visible at
//         the top level (it's inside the StartMenu, which is closed)
//
//     it('opening a window from an icon renders the window')
//       - Render <DesktopPage />
//       - Double-click the 'Internet Explorer' icon button
//       - Assert: a window appears (data-testid 'managed-window-win-1'
//         or a toolbar with navigation)
//       - Assert: the Taskbar shows a button for the new window
//
//     it('opening an IE window with title "Resume" starts on the resume route')
//       - Render <DesktopPage />
//       - Double-click the 'Resume' icon button
//       - Assert: the address bar shows 'portfolio://resume'
//
//   describe('WindowManager')
//
//     it('renders nothing when no windows are open')
//       - Render <WindowManager /> with an empty preloadedState
//       - Assert: no managed-window test ids in the document
//
//     it('renders a WindowWrapper for each visible window')
//       - Render <WindowManager /> with preloadedState containing 2 windows
//       - Assert: 2 managed-window test ids exist
//
//     it('does not render minimized windows')
//       - Render with 1 minimized + 1 visible window
//       - Assert: only 1 managed-window test id
//
//     it('renders InternetExplorerWindow for internet-explorer kind')
//       - Open a window with kind 'internet-explorer', title 'Resume'
//       - Assert: toolbar with navigation is present
//       - Assert: address bar shows 'portfolio://resume'
//
//     it('renders WelcomeContent for welcome kind')
//       - Open a window with kind 'welcome'
//       - Assert: 'Welcome to Windows 7' text is in the document
//
//     it('renders AboutThisPCContent for about-this-pc kind')
//       - Open a window with kind 'about-this-pc'
//       - Assert: 'About This PC' text is in the document
```

### Step 6 — Verify full build and test suite

```
// TODO: [Action Required: run all checks] - 5 min
//
//   1. npx vitest run --project unit
//      All existing tests + new page tests must pass.
//
//   2. npx eslint --max-warnings=0 src/app/desktop/ src/components/screens/desktop/
//      Zero errors/warnings.
//
//   3. npm run build
//      Production build clean — TypeScript, no unused imports, no
//      circular dependencies.
//
//   4. Manual smoke test (optional but recommended):
//      npm run dev → open http://localhost:3000/desktop
//      - Desktop background visible
//      - Icons visible in the grid
//      - Double-click an icon → window opens with correct content
//      - Taskbar shows the window button
//      - Click the Start orb → Start Menu opens
//      - Click Resume in Start Menu → IE window opens on resume route
//      - Click Sign Out → navigates to /login
```

---

## File Inventory

| File                                                                    | Type                                 | New/Modified      |
| ----------------------------------------------------------------------- | ------------------------------------ | ----------------- |
| `src/components/screens/desktop/desktopIcons.ts`                        | Static icon registry                 | New               |
| `src/components/screens/desktop/WindowManager/WindowManager.tsx`        | Compositor + content registry        | New               |
| `src/components/screens/desktop/WindowManager/index.ts`                 | Barrel export                        | New               |
| `src/app/desktop/page.tsx`                                              | Full route composition               | Modified          |
| `src/components/screens/desktop/index.ts`                               | Add WindowManager export             | Modified          |
| `src/components/screens/desktop/WindowWrapper/WindowWrapper.module.css` | Verify pointer-events: auto          | Verified/Modified |
| `src/app/desktop/page.test.tsx`                                         | Integration tests for composed route | New               |

---

## Validation Checklist

```
## Task 16 — Compose /desktop Route Validation Checklist

| #  | Gate                                                                              | Verified by       | Status     |
| -- | --------------------------------------------------------------------------------- | ----------------- | ---------- |
| 1  | DESKTOP_ICONS registry defines 5 icons (IE, Resume, Projects, Welcome, About)    | code review       | ⬜ Pending |
| 2  | Each icon has id, label, iconSrc, windowKind, windowTitle                         | code review       | ⬜ Pending |
| 3  | WindowManager reads selectVisibleWindows and renders WindowWrapper per window     | code review       | ⬜ Pending |
| 4  | AnimatePresence wraps the window list in WindowManager                            | code review       | ⬜ Pending |
| 5  | Window content registry maps all WindowKind values to content components          | code review       | ⬜ Pending |
| 6  | IE windows receive initialRoute via titleToRoute(window.title)                    | code review       | ⬜ Pending |
| 7  | WelcomeContent and AboutThisPCContent render placeholder content                 | code review       | ⬜ Pending |
| 8  | page.tsx passes iconGrid and windowLayer slots to Desktop                         | code review       | ⬜ Pending |
| 9  | Taskbar renders after Desktop (not as a slot)                                     | code review       | ⬜ Pending |
| 10 | Standalone Sign Out button removed from page.tsx                                  | code review       | ⬜ Pending |
| 11 | No duplicate <main> landmark (Desktop has role="main")                            | code review       | ⬜ Pending |
| 12 | WindowWrapper has pointer-events: auto                                            | code review       | ⬜ Pending |
| 13 | Desktop barrel exports include WindowManager                                      | code review       | ⬜ Pending |
| 14 | Double-clicking an icon dispatches openWindow with correct kind + title           | RTL test          | ⬜ Pending |
| 15 | Opening an IE window with title "Resume" starts on portfolio://resume             | RTL test          | ⬜ Pending |
| 16 | WindowManager renders nothing when no windows open                                | RTL test          | ⬜ Pending |
| 17 | WindowManager renders correct content per window kind                             | RTL test          | ⬜ Pending |
| 18 | Minimized windows are not rendered by WindowManager                               | RTL test          | ⬜ Pending |
| 19 | npx vitest run --project unit passes                                              | npx vitest        | ⬜ Pending |
| 20 | npx eslint --max-warnings=0 clean                                                 | npx eslint        | ⬜ Pending |
| 21 | npm run build clean                                                               | npm run build     | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **The desktop route becomes a composition root.** `page.tsx` fills the `<Desktop>` shell's
  three named slots (iconGrid, windowLayer, overlay) and renders the `<Taskbar>` alongside it.
  It is a thin assembly layer with no business logic — all behavior lives in the child
  components and Redux.
- **WindowManager is the window compositor.** It reads `selectVisibleWindows`, wraps the list
  in `<AnimatePresence>`, and renders `<WindowWrapper key={id} windowId={id}>` for each
  visible window. The `key` prop is critical — it's how AnimatePresence tracks entering and
  exiting children for animation.
- **The window content registry maps `WindowKind → React component`.** This is a switch
  statement inside WindowManager that resolves `'internet-explorer'` → `<InternetExplorerWindow>`,
  `'welcome'` → `<WelcomeContent>`, `'about-this-pc'` → `<AboutThisPCContent>`. The IE
  component receives `initialRoute={titleToRoute(window.title)}` to start on the correct page.
- **The standalone Sign Out button is retired.** Sign Out now lives exclusively in the
  StartMenu (Task 8), which already handles `signOut()` + `clearSession()` +
  `router.push('/login')`. The old button, its `useState` for `isSigningOut`, and the
  `<Transition>` screen are removed from page.tsx.
- **DESKTOP_ICONS is static product data.** It defines what icons appear on the desktop (IE,
  Resume, Projects, Welcome, About This PC). The desktopSlice stores only positions — icon
  metadata is looked up from this registry at render time.
- **pointer-events: auto on WindowWrapper is essential.** The Desktop's windowLayer has
  `pointer-events: none` so clicks pass through to the icon layer. Each window must re-enable
  pointer-events on itself. Without this, windows render visually but cannot be clicked.
- **Interview probe:** "Why is WindowManager a separate component and not inline in page.tsx?"
  — WindowManager uses `useAppSelector(selectVisibleWindows)`, which re-renders on every
  window state change. Isolating it in its own component means only the window list re-renders,
  not the entire page. If the selector lived in page.tsx, every window open/close/focus would
  re-render the icon grid and taskbar unnecessarily.
