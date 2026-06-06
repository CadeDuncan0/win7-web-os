<!-- Created: 2026-06-06 02:16:43 -->

# 🎯 Task: Build Wallpaper & Desktop Shell

---

## 🧠 Rationale

Every Phase 2 surface — icons, windows, context menus, the taskbar — renders **inside** a
full-viewport container that paints the Aero wallpaper and establishes the stacking context all
those layers live in. Without this shell, there is no compositing anchor: windows would not know
their z-index ceiling, icons would not know their grid origin, and the taskbar would not know
where "bottom" is. The `<Desktop>` component is that anchor.

**Decision 1 — named slots, not children.** Three distinct visual planes stack on the desktop:
icons, windows, and overlays (context menus, start menu). Each needs its own z-positioned CSS
layer. Passing all three as undifferentiated `children` forces consumers to know the internal DOM
order and apply z-index themselves. Named slot props make the stacking contract explicit:

```
┌──────────────────────────────────────────────┐
│  Desktop (full viewport, wallpaper bg)       │
│  ┌────────────────────────────────────────┐  │
│  │  iconGrid         z: var(--dsk-z-icon) │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  windowLayer   z: var(--dsk-z-win)│  │  │
│  │  │  ┌──────────────────────────┐    │  │  │
│  │  │  │  overlay    z: var(--dsk-│    │  │  │
│  │  │  │             z-overlay)   │    │  │  │
│  │  │  └──────────────────────────┘    │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  (Taskbar — Task 15, not this task)    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Decision 2 — pure presentational component, no `'use client'`.** The shell renders static
structure: a wallpaper `<div>`, three stacking layers, and whatever ReactNode props are passed
in. It has no hooks, no state, no event handlers. Interactivity (click-to-deselect, DndContext
wrapping, right-click capture) is added by **consuming** components in Tasks 8, 9, and 17. This
keeps the shell testable in Storybook without a Redux provider and server-renderable by default.

**Decision 3 — tokens first, styles second.** The desktop introduces a new visual domain: grid
cell dimensions, layer z-indices, and the wallpaper fill. Per `CLAUDE.md`, every value is a
`--w7-*` or `--dsk-*` custom property in `globals.css` before any CSS module references it.

| Token                | Value  | Consumer                         |
| -------------------- | ------ | -------------------------------- |
| `--dsk-grid-cell-w`  | `75px` | Icon grid column width (Task 8)  |
| `--dsk-grid-cell-h`  | `80px` | Icon grid row height (Task 8)    |
| `--dsk-grid-padding` | `12px` | Desktop edge inset for icon grid |
| `--dsk-z-icons`      | `1`    | Icon layer                       |
| `--dsk-z-windows`    | `10`   | Window manager layer base        |
| `--dsk-z-overlay`    | `9000` | Context menu / start menu        |
| `--dsk-z-taskbar`    | `9500` | Taskbar (above overlays)         |

Window instances get individual z-indices from Redux (`windowSlice.zCounter`) applied inline. The
`--dsk-z-windows` token sets the **layer's** `z-index` so the entire window plane floats above
the icon plane. The gap between `--dsk-z-windows` (10) and `--dsk-z-overlay` (9000) is
intentional — `zCounter` grows monotonically per focus, and 8990 open-close cycles before an
overlay collision is a comfortable ceiling for a portfolio demo.

---

## 🛠️ Implementation Outline

> Imports are omitted in these blocks — deduce them (the committed files must include them per the
> `import/order` rule). Each TODO is one 5–10 min unit.

### Step 1 — Add desktop tokens to `globals.css`

```css
/* globals.css — append inside :root, after the existing logon tokens */

/* TODO: [Action Required: add desktop shell tokens] - 5 min
   1. Add the seven tokens from the Rationale table above under a new
      SEMANTIC comment block: "SEMANTIC: Desktop shell".
   2. --dsk-grid-cell-w, --dsk-grid-cell-h, --dsk-grid-padding are consumed
      by the icon grid (Task 8) but defined now so the Desktop CSS module
      can reference --dsk-grid-padding for edge inset.
   3. The four z-index tokens (--dsk-z-icons, --dsk-z-windows, --dsk-z-overlay,
      --dsk-z-taskbar) enforce stacking order via CSS, not convention.
   4. Verify no existing token names collide — search globals.css for "--dsk-". */
```

### Step 2 — Create `src/components/desktop/Desktop/Desktop.module.css`

```css
/* TODO: [Action Required: style the desktop shell layers] - 10 min
   1. .shell — the root container:
        position: fixed; inset: 0;                      ← full viewport
        background: var(--desktop-backdrop) center / cover no-repeat;
        overflow: hidden;                                ← no scroll

   2. .iconLayer — absolute positioned, inset: 0, padded by --dsk-grid-padding,
        z-index: var(--dsk-z-icons).
        This layer will host the icon grid (Task 8).
        Bottom padding must leave room for the taskbar — add a
        --dsk-taskbar-reserve token (40px is the Windows 7 taskbar height)
        so the icon grid doesn't render behind the taskbar. Define
        this token in globals.css alongside the others.

   3. .windowLayer — absolute positioned, inset: 0,
        z-index: var(--dsk-z-windows).
        pointer-events: none on the layer div itself so clicks pass through
        to the icon layer beneath; individual windows inside set
        pointer-events: auto (they already do via inline styles / their own CSS).

   4. .overlay — absolute positioned, inset: 0,
        z-index: var(--dsk-z-overlay).
        pointer-events: none (same pass-through pattern — menus set auto).

   5. Zero hardcoded colors, sizes, or z-index values in this file.
      Every value references a --dsk-* or existing globals.css token. */
```

### Step 3 — Create `src/components/desktop/Desktop/Desktop.tsx`

```tsx
// Pure presentational component — NO 'use client', no hooks, no state.
// Accepts named slot props for each stacking layer.

interface DesktopProps {
  iconGrid?: ReactNode
  windowLayer?: ReactNode
  overlay?: ReactNode
}

// TODO: [Action Required: implement the Desktop shell] - 10 min
//   1. Render a <div className={styles.shell}> as the root.
//      Set role="main" and aria-label="Desktop" for a11y landmarks.
//
//   2. Inside the shell, render three layer divs in DOM order:
//        <div className={styles.iconLayer}>{iconGrid}</div>
//        <div className={styles.windowLayer}>{windowLayer}</div>
//        <div className={styles.overlay}>{overlay}</div>
//      DOM order matches visual stacking order (later = higher).
//      Each layer uses its z-index token — the CSS enforces the stack.
//
//   3. All three slots are optional (ReactNode | undefined).
//      An empty slot renders an empty layer div — no conditional
//      rendering, because Storybook stories fill one slot at a time
//      and the layers must always exist for consistent stacking context.
//
//   4. Do NOT add onClick, onContextMenu, or any event handlers here.
//      Click-to-deselect (Task 8), right-click menu (Task 9), and
//      DndContext (Task 8) are added by consuming components.
```

### Step 4 — Barrel export: `src/components/desktop/Desktop/index.ts`

```ts
// TODO: [Action Required: create the barrel] - 2 min
//   export { Desktop } from './Desktop'
//   Mirror the pattern used in src/components/windows7/Window/index.ts.
```

### Step 5 — Storybook stories: `src/components/desktop/Desktop/Desktop.stories.tsx`

```tsx
// TODO: [Action Required: create stories for all four states] - 10 min
//   meta:
//     title: 'Desktop/Desktop'
//     component: Desktop
//     parameters: { layout: 'fullscreen' }     ← not 'centered' — this IS the viewport
//
//   Story 1 — Empty:
//     No slot props. Just the wallpaper. Verifies the shell renders and fills
//     the viewport. Use this story to eyeball wallpaper coverage and edge behavior.
//     args: {}
//
//   Story 2 — WithIcons:
//     Pass a mock iconGrid: a <div> with 3–4 placeholder icon boxes (colored
//     rectangles with labels) laid out in a column. Sized to approximate
//     --dsk-grid-cell-w × --dsk-grid-cell-h. Verifies the icon layer sits on
//     the wallpaper with correct padding.
//     args: { iconGrid: <MockIconGrid /> }
//
//   Story 3 — WithActiveWindow:
//     Pass a mock windowLayer: a single <Window> (import the existing 7.css
//     Window primitive) with absolute positioning, title "Test Window", and
//     some body content. Verifies the window floats above the icon layer.
//     Pass both iconGrid and windowLayer to confirm layering.
//     args: { iconGrid: <MockIconGrid />, windowLayer: <MockWindow /> }
//
//   Story 4 — WithContextMenu:
//     Pass a mock overlay: a small positioned <div> styled as a menu
//     (white bg, border, drop-shadow, a few text items). Verifies the
//     overlay renders above windows. Pass all three slots.
//     args: { iconGrid: <MockIconGrid />, windowLayer: <MockWindow />,
//             overlay: <MockContextMenu /> }
//
//   Mock helper components can be defined at the top of this file as
//   plain function components (they are story-only, never imported elsewhere).
//   Use inline styles on mocks — they are not production components, so
//   design tokens and CSS modules are not required for mocks.
```

### Step 6 — Clean up the placeholder in `src/app/desktop/page.module.css`

```css
/* TODO: [Action Required: remove the old .main and .signOut styles] - 5 min
   1. The .main class duplicates what the <Desktop> shell now provides.
      Delete .main. The page will import and render <Desktop> (Task 17),
      so the page.module.css may become empty or minimal.
   2. The .signOut class is retired — Sign Out relocates to the Start Menu
      (Task 24). Delete .signOut and all its pseudo/state selectors.
   3. If page.module.css is now empty, keep the file but leave it blank —
      Task 17 may add page-level composition styles.
   4. In page.tsx, remove the className={styles.main} reference on <main>.
      Replace <main className={styles.main}></main> with just <main></main>
      (or keep the page minimal until Task 17 composes the full desktop).
      Clean up the commented-out sign-out code — it served its purpose. */
```

---

## 📝 Validation Report

> New task — nothing is done yet. Each row is the bar **you** must clear and the command that proves
> it. Flip to ✅ only on a real pass; do not loosen a step to make it green.

```
## Task 6 — Wallpaper & Desktop Shell Validation Checklist

| #  | Step                                                                              | Verified by                                               | Status |
| -- | --------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| 1  | 8 new --dsk-* tokens in globals.css (:root), no hardcoded values                  | grep globals.css for --dsk-                               | ⬜ Pending |
| 2  | Desktop.module.css references only --dsk-* and existing tokens (no magic values)  | code review + grep for raw px/color literals              | ⬜ Pending |
| 3  | Desktop.tsx has NO 'use client', no hooks, no event handlers                      | code review                                               | ⬜ Pending |
| 4  | Desktop.tsx renders role="main" and aria-label="Desktop"                          | code review                                               | ⬜ Pending |
| 5  | Three layer divs always render (even when slots are empty)                        | Storybook Empty story — inspect DOM                       | ⬜ Pending |
| 6  | pointer-events: none on windowLayer and overlay; auto on children within          | Storybook — click through window layer to icon layer      | ⬜ Pending |
| 7  | Barrel export works: import { Desktop } from '@/components/desktop/Desktop'       | editor import resolution                                  | ⬜ Pending |
| 8  | Storybook story: Empty — wallpaper fills viewport, no scroll                      | npm run storybook → Desktop/Desktop → Empty               | ⬜ Pending |
| 9  | Storybook story: WithIcons — mock icons visible on wallpaper with edge padding    | npm run storybook → Desktop/Desktop → WithIcons           | ⬜ Pending |
| 10 | Storybook story: WithActiveWindow — window floats above icons                     | npm run storybook → Desktop/Desktop → WithActiveWindow    | ⬜ Pending |
| 11 | Storybook story: WithContextMenu — menu floats above window                       | npm run storybook → Desktop/Desktop → WithContextMenu     | ⬜ Pending |
| 12 | Placeholder page.module.css cleaned up (.main, .signOut removed)                  | cat src/app/desktop/page.module.css                       | ⬜ Pending |
| 13 | npx tsc --noEmit clean                                                            | npx tsc --noEmit                                          | ⬜ Pending |
| 14 | npx eslint --max-warnings=0 clean                                                | npx eslint --max-warnings=0                               | ⬜ Pending |
| 15 | npm test green (49 tests, no regressions)                                         | npm test                                                  | ⬜ Pending |
| 16 | npm run build-storybook succeeds                                                  | npm run build-storybook                                   | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## 🛡️ Summary

- **Named slots, not children.** `iconGrid`, `windowLayer`, and `overlay` are explicit props
  because each maps to a CSS-positioned layer with its own z-index. Consumers cannot mis-order
  the stacking.
- **Tokens enforce the contract.** Eight `--dsk-*` custom properties in `globals.css` define grid
  cell dimensions, edge padding, taskbar reserve, and four z-index tiers. Zero raw values in the
  CSS module.
- **Pure presentational — no `'use client'`.** The shell is a static layout: fixed-position
  viewport container, wallpaper background, three stacking layers. No hooks, no state, no event
  handlers. Interactivity (DndContext, click-to-deselect, right-click) is added by Tasks 8, 9,
  and 17 at the composition layer.
- **`pointer-events: none` on window and overlay layers** lets clicks pass through empty space
  to the icon layer beneath. Individual windows and menus set `pointer-events: auto` on
  themselves so they remain interactive — no z-index tricks needed to reach the desktop.
- **Storybook fullscreen layout** (`parameters: { layout: 'fullscreen' }`) because this
  component IS the viewport. Four stories cover every stacking combination.
