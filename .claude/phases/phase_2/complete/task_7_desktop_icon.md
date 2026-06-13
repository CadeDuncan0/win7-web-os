<!-- Created: 2026-06-07 -->
<!-- Completed: 2026-06-09 -->

# Task 7: Build Desktop Icon Component

---

## Rationale

The desktop icon is the primary interactive surface on the Windows 7 desktop — every action
the visitor takes starts with clicking or dragging one. This task delivers three things as a
single unit: the visual `<DesktopIcon>` primitive, the `<IconGrid>` layout container that
positions icons in a column-first virtual grid, and the `@dnd-kit` drag integration that
lets visitors reposition icons with snap-to-grid behavior.

These were previously separate tasks (old 7 + old 8) and are now merged because the icon
primitive is untestable in isolation from the grid — its position, its selection halo, and
its drag behavior all depend on the grid coordinate system.

### What already exists

| Artifact      | Location                                     | What it provides                                                                                                                                                                                   |
| ------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop slice | `src/store/slices/desktopSlice.ts`           | `DesktopIcon` type, `GridCell` type, `registerIcon`, `setIconPosition`, `setSelectedIcon`, `clearSelection`, `resetGuestPositions`, `selectDesktopIcons`, `selectIconById`, `selectSelectedIconId` |
| Desktop shell | `src/components/screens/desktop/Desktop.tsx` | `<Desktop>` with `iconGrid` slot prop — the grid renders HERE                                                                                                                                      |
| Sensor hook   | `src/hooks/useDesktopSensors.ts`             | `useDesktopSensors()` → configured `PointerSensor` (5px activation) + `KeyboardSensor`                                                                                                             |
| Design tokens | `src/app/globals.css`                        | `--dsk-grid-cell-w: 75px`, `--dsk-grid-cell-h: 80px`, `--dsk-grid-padding: 12px`                                                                                                                   |
| Test helpers  | `src/test-utils/renderWithProviders.tsx`     | `renderWithProviders()` with Redux + Apollo mocking                                                                                                                                                |
| Typed hooks   | `src/store/hooks.ts`                         | `useAppDispatch`, `useAppSelector`                                                                                                                                                                 |

### Key decisions

**Decision 1 — column-first layout, not row-first.** Windows 7 fills icons top-to-bottom,
then left-to-right. The first icon is `{column: 0, row: 0}`, the second is `{column: 0, row: 1}`,
etc. When a column fills (based on available desktop height minus taskbar reserve), the next
icon starts at `{column: 1, row: 0}`. This matches the `GridCell` type already in the
desktop slice.

**Decision 2 — grid math is pure functions, not component logic.** Two conversion functions
live in a dedicated utility file:

- `gridCellToPixels(cell: GridCell): { x: number; y: number }` — for rendering
- `pixelsToGridCell(x: number, y: number): GridCell` — for snap-on-drop

These are unit-testable without React and consumed by both the icon renderer and the drag
handler.

**Decision 3 — `useDraggable` per icon, no `useDroppable`.** Each `<DesktopIcon>` calls
`useDraggable` from `@dnd-kit/core`. The desktop itself is the implicit drop target — there
is no `useDroppable` because the entire icon layer accepts drops. The `DndContext.onDragEnd`
handler on the `<IconGrid>` receives the final coordinates, converts via `pixelsToGridCell`,
and dispatches `setIconPosition`.

**Decision 4 — collision avoidance is naive scan.** When a drop target cell is already
occupied, scan forward in column-first order (row+1, wrap to next column) until a free cell
is found. This is O(n) over registered icons — fine for a portfolio demo with <20 icons.

**Decision 5 — `'use client'` is required.** Both `<DesktopIcon>` and `<IconGrid>` use
hooks (`useDraggable`, `useAppSelector`, `useAppDispatch`, `useDesktopSensors`). They must
be client components. The parent `<Desktop>` shell remains a server component — it receives
the `<IconGrid>` via the `iconGrid` slot prop.

**Decision 6 — the icon registry is NOT part of this task.** The static list of which icons
exist (label, image path, which `WindowKind` they open) is defined in Task 16 (Compose
`/desktop` Route) as a typed in-repo registry. This task builds the _renderer_ that maps
a `DesktopIcon` from Redux into a visual element. Stories and tests use hardcoded mock data.

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 1 — Grid math utility: `src/lib/gridMath.ts`

```ts
// Pure functions — no React, no Redux, no side effects.
// Consumed by <IconGrid> (drop handler) and <DesktopIcon> (position rendering).

// TODO: [Action Required: implement grid coordinate conversion] - 15 min
//
//   Constants (derive from CSS tokens — hardcode the numeric values here since
//   these are consumed at runtime in JS, not in CSS):
//     CELL_WIDTH  = 75   // matches --dsk-grid-cell-w
//     CELL_HEIGHT = 80   // matches --dsk-grid-cell-h
//     GRID_PADDING = 12  // matches --dsk-grid-padding
//
//   Export both constants AND the conversion functions — tests and the drag
//   handler both need the constants.
//
//   1. gridCellToPixels(cell: GridCell): { x: number; y: number }
//      x = cell.column * CELL_WIDTH + GRID_PADDING
//      y = cell.row * CELL_HEIGHT + GRID_PADDING
//
//   2. pixelsToGridCell(x: number, y: number): GridCell
//      column = Math.round((x - GRID_PADDING) / CELL_WIDTH)
//      row    = Math.round((y - GRID_PADDING) / CELL_HEIGHT)
//      Clamp both to >= 0 (no negative grid positions).
//
//   3. isCellOccupied(cell: GridCell, icons: DesktopIcon[], excludeId?: string): boolean
//      Returns true if any icon (except excludeId) has position matching cell.
//      Used by the collision avoidance logic in onDragEnd.
//
//   4. findNextFreeCell(startCell: GridCell, icons: DesktopIcon[], excludeId: string, maxRows: number): GridCell
//      Starting from startCell, scan forward in column-first order:
//        row + 1 → if row >= maxRows, column + 1 and row = 0
//      Return the first cell where isCellOccupied is false.
//      If startCell itself is free, return it immediately.
//
//   Import GridCell and DesktopIcon types from '@/store/slices/desktopSlice'.
```

### Step 2 — Grid math tests: `src/lib/gridMath.test.ts`

```ts
// TODO: [Action Required: unit test the pure grid math] - 15 min
//
//   describe('gridCellToPixels')
//     - { column: 0, row: 0 } → { x: 12, y: 12 }   (origin = GRID_PADDING)
//     - { column: 1, row: 2 } → { x: 87, y: 172 }   (75*1 + 12, 80*2 + 12)
//
//   describe('pixelsToGridCell')
//     - Exact center of cell (0,0): (12, 12) → { column: 0, row: 0 }
//     - Exact center of cell (1,2): (87, 172) → { column: 1, row: 2 }
//     - Halfway between cells rounds to nearest: (49, 12) → { column: 0, row: 0 } (0.49 rounds to 0)
//     - Negative pixel values clamp to column 0, row 0
//
//   describe('isCellOccupied')
//     - Returns true when an icon at the target cell exists
//     - Returns false when excludeId matches the icon at that cell
//     - Returns false when no icon at that cell
//
//   describe('findNextFreeCell')
//     - Returns startCell when it is free
//     - Skips occupied cells and returns the next free one
//     - Wraps from bottom of column to top of next column
```

### Step 3 — DesktopIcon component: `src/components/desktop/DesktopIcon/DesktopIcon.tsx`

```tsx
'use client'

// TODO: [Action Required: implement the icon primitive] - 25 min
//
//   Props:
//     interface DesktopIconProps {
//       id: string            // Redux icon id — key for useDraggable + selector
//       label: string         // Display text below the icon image
//       iconSrc: string       // Path to the icon image (e.g., '/imgs/desktop/icons/ie.png')
//       onOpen: () => void    // Fired on double-click / Enter / Space — dispatches openWindow upstream
//     }
//
//   Implementation:
//
//   1. Read icon state from Redux:
//        const icon = useAppSelector(selectIconById(id))
//        const selectedIconId = useAppSelector(selectSelectedIconId)
//        const isSelected = selectedIconId === id
//
//   2. Wire @dnd-kit draggable:
//        const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
//
//   3. Compute position from grid cell:
//        const position = icon ? gridCellToPixels(icon.position) : { x: 0, y: 0 }
//
//   4. Build the inline style:
//        const style: CSSProperties = {
//          position: 'absolute',
//          left: position.x,
//          top: position.y,
//          width: 'var(--dsk-grid-cell-w)',
//          height: 'var(--dsk-grid-cell-h)',
//          // During drag, apply the transform delta from @dnd-kit:
//          transform: transform ? CSS.Translate.toString(transform) : undefined,
//          // Dim slightly while dragging for visual feedback:
//          opacity: isDragging ? 0.6 : 1,
//          // Lift above siblings while dragging:
//          zIndex: isDragging ? 100 : 1,
//        }
//      Import CSS from '@dnd-kit/utilities' for the transform helper.
//
//   5. Render structure:
//        <button
//          ref={setNodeRef}
//          className={clsx(styles.icon, isSelected && styles.selected)}
//          style={style}
//          onClick={() => dispatch(setSelectedIcon({ id, position: icon!.position, defaultPosition: icon!.defaultPosition }))}
//          onDoubleClick={onOpen}
//          aria-label={label}
//          {...attributes}
//          {...listeners}
//        >
//          <img className={styles.image} src={iconSrc} alt="" draggable={false} />
//          <span className={styles.label}>{label}</span>
//        </button>
//
//      Use a <button> for native keyboard focus + activation. The aria-label on
//      the button provides the accessible name; the img is decorative (alt="").
//
//   6. Keyboard activation:
//      The <button> natively handles Enter and Space for onClick.
//      Double-click via keyboard: onKeyDown, if key === 'Enter', call onOpen().
//      (onClick handles single-click selection, onDoubleClick handles mouse open,
//      Enter keydown handles keyboard open — matching Windows 7 behavior.)
//
//   NOTE: Do NOT dispatch setSelectedIcon with a full DesktopIcon payload.
//   The current slice reducer accepts PayloadAction<DesktopIcon> but only reads
//   action.payload.id. You may want to update the slice to accept just { id: string }
//   — or pass the full object as required by the current signature.
//   Review desktopSlice.ts line 73: setSelectedIcon(state, action: PayloadAction<DesktopIcon>)
//   and decide whether to narrow the payload type.
```

### Step 4 — DesktopIcon styles: `src/components/desktop/DesktopIcon/DesktopIcon.module.css`

```css
/* TODO: [Action Required: style the icon primitive] - 15 min
 *
 * IMPORTANT: Reference real Windows 7 desktop icon styling:
 *   - Icon image: 48×48 centered in the cell
 *   - Label: white text, 11px, text-shadow for readability on wallpaper
 *   - Selection halo: semi-transparent blue highlight rectangle around the icon
 *   - Focus-visible: dotted outline (standard a11y indicator)
 *
 * .icon
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   justify-content: flex-start;
 *   padding-top: var(--space-1);         ← push image down from cell top edge
 *   gap: var(--space-1);                 ← between image and label
 *   background: transparent;
 *   border: none;
 *   cursor: default;
 *   user-select: none;
 *   outline: none;
 *   -webkit-user-drag: none;
 *   touch-action: none;                  ← required by @dnd-kit pointer sensor
 *
 * .icon:focus-visible
 *   outline: 1px dotted var(--color-neutral-0);
 *   outline-offset: -2px;
 *
 * .selected
 *   RESEARCH NEEDED: The Windows 7 icon selection halo is a semi-transparent
 *   blue-ish rounded rectangle with a lighter border. You need to find the
 *   exact values. As a starting point:
 *     background: rgba(80, 140, 210, 0.35);
 *     border: 1px solid rgba(120, 180, 240, 0.7);
 *     border-radius: 3px;
 *   These values are PLACEHOLDERS — add proper --dsk-* or --w7-* tokens
 *   to globals.css once the real values are sourced. DO NOT ship raw rgba
 *   values in the CSS module. Define tokens first, reference them here.
 *
 *   NEW TOKENS needed in globals.css:
 *     --dsk-icon-select-bg      (the blue translucent fill)
 *     --dsk-icon-select-border  (the lighter blue translucent stroke)
 *     --dsk-icon-select-radius  (corner rounding, probably 3px)
 *
 * .image
 *   width: 48px;
 *   height: 48px;
 *   pointer-events: none;               ← prevent img from eating drag events
 *   image-rendering: auto;
 *   WAIT: 48px should be a token. Add --dsk-icon-image-size: 48px to globals.css.
 *
 * .label
 *   color: var(--color-neutral-0);
 *   font-size: 11px;
 *   text-align: center;
 *   text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
 *   max-width: 100%;
 *   overflow: hidden;
 *   text-overflow: ellipsis;
 *   white-space: nowrap;
 *   line-height: 1.2;
 *   WAIT: font-size and text-shadow need tokens too:
 *     --dsk-icon-label-size: 11px
 *     --dsk-icon-label-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8)
 *   (or reuse an existing alpha-black scale value for the shadow)
 *
 * TOTAL NEW TOKENS for globals.css:
 *   --dsk-icon-image-size: 48px
 *   --dsk-icon-label-size: 11px
 *   --dsk-icon-label-shadow: 1px 1px 2px var(--alpha-black-80)
 *   --dsk-icon-select-bg: <research needed>
 *   --dsk-icon-select-border: <research needed>
 *   --dsk-icon-select-radius: 3px
 */
```

### Step 5 — DesktopIcon barrel: `src/components/desktop/DesktopIcon/index.ts`

```ts
// TODO: [Action Required: create barrel export] - 1 min
//   export * from './DesktopIcon'
```

### Step 6 — IconGrid component: `src/components/desktop/IconGrid/IconGrid.tsx`

```tsx
'use client'

// TODO: [Action Required: implement the grid container + drag handler] - 25 min
//
//   This component wraps all desktop icons in a DndContext from @dnd-kit/core
//   and handles the snap-on-drop logic. It is passed to <Desktop iconGrid={...} />.
//
//   Props:
//     interface IconGridProps {
//       icons: Array<{
//         id: string
//         label: string
//         iconSrc: string
//         windowKind: WindowKind  // from windowSlice — what to open on double-click
//         windowTitle: string     // title for the opened window
//       }>
//     }
//
//   Implementation:
//
//   1. Pull hooks:
//        const dispatch = useAppDispatch()
//        const sensors = useDesktopSensors()
//        const desktopIcons = useAppSelector(selectDesktopIcons)
//
//   2. On mount, register icons that aren't already in Redux:
//        useEffect(() => {
//          icons.forEach((iconDef, index) => {
//            dispatch(registerIcon({
//              id: iconDef.id,
//              position: { column: 0, row: index },   ← default: single column, stacked
//              defaultPosition: { column: 0, row: index },
//            }))
//          })
//        }, [])   // intentional empty deps — register once on mount
//
//   3. Compute maxRows from viewport height:
//        const maxRows = useMemo(() => {
//          const availableHeight = window.innerHeight - TASKBAR_RESERVE - GRID_PADDING * 2
//          return Math.floor(availableHeight / CELL_HEIGHT)
//        }, [])
//      Where TASKBAR_RESERVE = 40 (matches --dsk-taskbar-reserve).
//      Import CELL_HEIGHT and GRID_PADDING from gridMath.ts.
//
//   4. DndContext.onDragEnd handler:
//        function handleDragEnd(event: DragEndEvent) {
//          const { active, delta } = event
//          const iconId = active.id as string
//          const icon = desktopIcons.find(i => i.id === iconId)
//          if (!icon) return
//
//          // Current pixel position + drag delta → new pixel position
//          const currentPixels = gridCellToPixels(icon.position)
//          const newPixels = {
//            x: currentPixels.x + delta.x,
//            y: currentPixels.y + delta.y,
//          }
//
//          // Snap to nearest grid cell
//          let targetCell = pixelsToGridCell(newPixels.x, newPixels.y)
//
//          // Clamp to grid bounds
//          targetCell = {
//            column: Math.max(0, targetCell.column),
//            row: Math.max(0, Math.min(targetCell.row, maxRows - 1)),
//          }
//
//          // Collision avoidance: if occupied, find next free cell
//          if (isCellOccupied(targetCell, desktopIcons, iconId)) {
//            targetCell = findNextFreeCell(targetCell, desktopIcons, iconId, maxRows)
//          }
//
//          dispatch(setIconPosition({
//            id: iconId,
//            position: targetCell,
//            defaultPosition: icon.defaultPosition,
//          }))
//        }
//
//   5. Click-to-deselect: when the grid background (not an icon) is clicked,
//      dispatch clearSelection(). Add onClick on the wrapping div:
//        onClick={(e) => {
//          if (e.target === e.currentTarget) dispatch(clearSelection())
//        }}
//
//   6. Render:
//        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
//          <div className={styles.grid} onClick={handleDeselect}>
//            {icons.map((iconDef) => (
//              <DesktopIcon
//                key={iconDef.id}
//                id={iconDef.id}
//                label={iconDef.label}
//                iconSrc={iconDef.iconSrc}
//                onOpen={() => dispatch(openWindow({
//                  kind: iconDef.windowKind,
//                  title: iconDef.windowTitle,
//                }))}
//              />
//            ))}
//          </div>
//        </DndContext>
//
//   IMPORTANT: <DndContext> wraps at this level, NOT in the <Desktop> shell.
//   The shell is a server component and cannot host hooks.
```

### Step 7 — IconGrid styles: `src/components/desktop/IconGrid/IconGrid.module.css`

```css
/* TODO: [Action Required: style the grid container] - 5 min
 *
 * .grid
 *   position: relative;    ← icons position absolute within this
 *   width: 100%;
 *   height: 100%;
 *
 * That's it — the grid div is just a positioning context. All visual layout
 * (cell sizing, padding) is handled by the absolute-positioned icons via
 * gridCellToPixels. The parent .iconLayer in Desktop.module.css already
 * provides the padding and z-index.
 */
```

### Step 8 — IconGrid barrel: `src/components/desktop/IconGrid/index.ts`

```ts
// TODO: [Action Required: create barrel export] - 1 min
//   export * from './IconGrid'
```

### Step 9 — Storybook stories: `src/components/desktop/DesktopIcon/DesktopIcon.stories.tsx`

```tsx
// TODO: [Action Required: create icon stories covering all visual states] - 20 min
//
//   meta:
//     title: 'Desktop/DesktopIcon'
//     component: DesktopIcon
//     parameters: { layout: 'fullscreen' }
//     decorators: [
//       (Story) => {
//         // Wrap in a div with the desktop wallpaper background and relative
//         // positioning so the absolute-positioned icon renders correctly.
//         // Also wrap in Redux Provider with a pre-seeded store containing
//         // a registered icon at position { column: 0, row: 0 }.
//         return <Provider store={...}><DndContext><div style={...}><Story /></div></DndContext></Provider>
//       }
//     ]
//
//   The decorator is essential: DesktopIcon reads from Redux and calls useDraggable,
//   so it must live inside both a <Provider> and a <DndContext>.
//
//   For each story, pre-seed the Redux store with a registered icon using setupStore
//   from '@/store'. The icon's id must match the story's args.id.
//
//   Story 1 — Idle:
//     Default state. Icon at grid position (0,0), not selected, not dragging.
//     args: { id: 'icon-test', label: 'My Computer', iconSrc: '/imgs/desktop/icons/computer.png' }
//
//   Story 2 — Selected:
//     Same icon, but pre-seed selectedIconId = 'icon-test' in the store.
//     Verifies the selection halo renders.
//
//   Story 3 — Hover:
//     Same as Idle. Hover state is CSS-only (:hover), so just document it.
//     (Storybook can't force :hover — this story exists for visual QA.)
//
//   Story 4 — Focused:
//     Tab to the icon. Verifies :focus-visible outline renders.
//     Use play function: await userEvent.tab()
//
//   Story 5 — LongLabel:
//     args: { id: 'icon-long', label: 'Windows Media Player with a Very Long Name', ... }
//     Verifies text-overflow: ellipsis truncation.
//
//   Story 6 — Disabled (stretch):
//     If a disabled state is needed later (e.g., admin-only icon for guest),
//     placeholder story with aria-disabled="true" and reduced opacity.
//
//   NOTE: Icon images may not exist yet at the paths used in stories.
//   Use placeholder paths and note that real assets are added in Task 16.
//   Storybook will show a broken image — that's fine for now. Or use a
//   simple colored div as a placeholder image.
```

### Step 10 — Storybook stories: `src/components/desktop/IconGrid/IconGrid.stories.tsx`

```tsx
// TODO: [Action Required: create grid stories showing the full drag flow] - 15 min
//
//   meta:
//     title: 'Desktop/IconGrid'
//     component: IconGrid
//     parameters: { layout: 'fullscreen' }
//     decorators: [
//       (Story) => <Provider store={setupStore()}><div style={{ position: 'fixed', inset: 0, background: ... }}><Story /></div></Provider>
//     ]
//
//   Story 1 — DefaultLayout:
//     3-4 icons in the default single-column layout.
//     args: { icons: [
//       { id: 'icon-1', label: 'My Computer', iconSrc: '...', windowKind: 'welcome', windowTitle: 'Welcome' },
//       { id: 'icon-2', label: 'Recycle Bin', iconSrc: '...', windowKind: 'welcome', windowTitle: 'Welcome' },
//       { id: 'icon-3', label: 'Internet Explorer', iconSrc: '...', windowKind: 'welcome', windowTitle: 'Welcome' },
//     ]}
//     Verifies icons stack vertically in column 0.
//
//   Story 2 — WithSelectedIcon:
//     Same icons, but pre-seed selectedIconId in the store.
//     Verifies one icon has the selection halo.
//
//   Story 3 — ManyIcons:
//     8+ icons to test column wrapping (icons overflow into column 1).
//     Verifies the column-first layout math works at scale.
```

### Step 11 — RTL integration test: `src/components/desktop/IconGrid/IconGrid.test.tsx`

```tsx
// TODO: [Action Required: behavior test for drag-to-snap] - 20 min
//
//   Use renderWithProviders from '@/test-utils'.
//
//   IMPORTANT: @dnd-kit drag simulation in tests is tricky. The PointerSensor
//   requires real pointer events with correct coordinates. Consider these
//   approaches:
//
//   Option A — Test at the Redux level (recommended for reliability):
//     1. Render <IconGrid> with 2 icons
//     2. Verify icons render at expected positions (check style.left / style.top)
//     3. Dispatch setIconPosition directly to the store
//     4. Verify the icon's rendered position updates to match the new grid cell
//     This tests the gridCellToPixels → render pipeline without fighting dnd-kit's
//     event simulation.
//
//   Option B — Simulate drag events (more realistic but fragile):
//     1. fireEvent.pointerDown on icon
//     2. fireEvent.pointerMove with delta > 5px (activation distance)
//     3. fireEvent.pointerUp
//     4. Assert store.getState().desktop.iconsById[id].position matches the
//        snapped target cell
//     If you go this route, note that @dnd-kit v6 may need DragOverlay awareness
//     and the events must include correct clientX/clientY.
//
//   describe('IconGrid')
//
//     it('renders icons at their grid cell positions')
//       - Render with 2 icons
//       - Assert icon 1 is at gridCellToPixels({column:0, row:0}) via style
//       - Assert icon 2 is at gridCellToPixels({column:0, row:1}) via style
//
//     it('registers icons in Redux on mount')
//       - Render with 2 icons
//       - Assert store.getState().desktop.iconIds.length === 2
//
//     it('selects an icon on click')
//       - Render with 2 icons
//       - Click icon 1 (by aria-label)
//       - Assert store.getState().desktop.selectedIconId === 'icon-1'
//
//     it('clears selection on grid background click')
//       - Pre-seed selectedIconId in store
//       - Click the grid container (not an icon)
//       - Assert store.getState().desktop.selectedIconId === null
//
//     it('opens a window on double-click')
//       - Render with 1 icon
//       - Double-click the icon
//       - Assert store.getState().window.ids.length === 1
//
//     it('reflects position changes from Redux')
//       - Render with 1 icon at (0,0)
//       - Dispatch setIconPosition to move it to (1,2)
//       - Assert the icon's style.left/top match gridCellToPixels({column:1, row:2})
```

---

## New Tokens Summary

These tokens must be added to `globals.css` before the CSS module references them:

```css
/* ─── SEMANTIC: Desktop icons ────────────────────────────────────── */
--dsk-icon-image-size: 48px;
--dsk-icon-label-size: 11px;
--dsk-icon-label-shadow: 1px 1px 2px var(--alpha-black-80);
--dsk-icon-select-bg: <RESEARCH NEEDED — source from Windows 7 reference>;
--dsk-icon-select-border: <RESEARCH NEEDED — source from Windows 7 reference>;
--dsk-icon-select-radius: 3px;
```

The selection halo values (`--dsk-icon-select-bg`, `--dsk-icon-select-border`) require visual
research against a real Windows 7 desktop or a reference screenshot. Do not guess — per
`CLAUDE.md`, "DO NOT makeup css values."

---

## File Inventory

| File                                                         | Type                          | New/Modified |
| ------------------------------------------------------------ | ----------------------------- | ------------ |
| `src/lib/gridMath.ts`                                        | Grid coordinate utility       | New          |
| `src/lib/gridMath.test.ts`                                   | Jest unit tests for grid math | New          |
| `src/components/desktop/DesktopIcon/DesktopIcon.tsx`         | Icon component                | New          |
| `src/components/desktop/DesktopIcon/DesktopIcon.module.css`  | Icon styles                   | New          |
| `src/components/desktop/DesktopIcon/index.ts`                | Barrel export                 | New          |
| `src/components/desktop/DesktopIcon/DesktopIcon.stories.tsx` | Storybook stories             | New          |
| `src/components/desktop/IconGrid/IconGrid.tsx`               | Grid container + DndContext   | New          |
| `src/components/desktop/IconGrid/IconGrid.module.css`        | Grid styles                   | New          |
| `src/components/desktop/IconGrid/index.ts`                   | Barrel export                 | New          |
| `src/components/desktop/IconGrid/IconGrid.stories.tsx`       | Storybook stories             | New          |
| `src/components/desktop/IconGrid/IconGrid.test.tsx`          | RTL integration test          | New          |
| `src/app/globals.css`                                        | New `--dsk-icon-*` tokens     | Modified     |

---

## Validation Checklist

```
## Task 7 — Desktop Icon Component Validation Checklist

| #  | Step                                                                              | Verified by                                               | Status     |
| -- | --------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------- |
| 1  | gridMath.ts exports gridCellToPixels, pixelsToGridCell, isCellOccupied, findNextFreeCell | code review                                          | ⬜ Pending |
| 2  | gridMath.test.ts covers all conversion functions + edge cases                     | npm test                                                  | ⬜ Pending |
| 3  | DesktopIcon.tsx uses useDraggable, reads position from Redux, no hardcoded values | code review                                               | ⬜ Pending |
| 4  | DesktopIcon.module.css references only tokens (no raw px/color/shadow values)     | grep for raw literals                                     | ⬜ Pending |
| 5  | New --dsk-icon-* tokens added to globals.css                                      | grep globals.css for --dsk-icon                           | ⬜ Pending |
| 6  | IconGrid.tsx wraps icons in DndContext, handles onDragEnd with snap logic         | code review                                               | ⬜ Pending |
| 7  | IconGrid.tsx dispatches clearSelection on background click                       | code review + RTL test                                    | ⬜ Pending |
| 8  | Collision avoidance: dropping on occupied cell finds next free cell               | gridMath.test.ts                                          | ⬜ Pending |
| 9  | Storybook: DesktopIcon stories (Idle, Selected, Focused, LongLabel)              | npm run storybook                                         | ⬜ Pending |
| 10 | Storybook: IconGrid stories (DefaultLayout, ManyIcons)                           | npm run storybook                                         | ⬜ Pending |
| 11 | RTL test: icon renders at correct pixel position from grid cell                  | npm test                                                  | ⬜ Pending |
| 12 | RTL test: click selects, double-click opens window                               | npm test                                                  | ⬜ Pending |
| 13 | RTL test: background click clears selection                                      | npm test                                                  | ⬜ Pending |
| 14 | Keyboard: Enter on focused icon dispatches onOpen                                | manual test + RTL                                         | ⬜ Pending |
| 15 | touch-action: none on icon button (required by @dnd-kit PointerSensor)           | code review                                               | ⬜ Pending |
| 16 | No @dnd-kit imports in any Window/ or WindowWrapper/ file                        | npx eslint --max-warnings=0                               | ⬜ Pending |
| 17 | npx tsc --noEmit clean (excluding pre-existing login casing issue)               | npx tsc --noEmit                                          | ⬜ Pending |
| 18 | npx eslint --max-warnings=0 clean                                                | npx eslint --max-warnings=0                               | ⬜ Pending |
| 19 | npm test green (all existing + new tests)                                         | npm test                                                  | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **Three deliverables, one task.** Grid math utility (pure functions, unit tested), `<DesktopIcon>`
  primitive (visual + draggable + selectable), and `<IconGrid>` container (DndContext + snap-on-drop
  - collision avoidance). They form a single testable unit.
- **Grid math is pure.** `gridCellToPixels` and `pixelsToGridCell` are plain functions in `src/lib/`
  with their own Jest tests — no React, no Redux, no mocking.
- **`useDraggable` per icon, DndContext on the grid.** Each icon is independently draggable. The
  grid's `onDragEnd` converts the final pixel position to a grid cell, resolves collisions, and
  dispatches `setIconPosition`.
- **Column-first layout.** Icons fill top-to-bottom, then left-to-right — matching Windows 7.
- **Selection halo tokens need research.** The exact `rgba` values for the Win7 icon selection
  highlight must be sourced from a reference — do not guess. Placeholder values are noted.
- **Icon images may not exist yet.** Real icon assets are added when the registry is built in Task 16.
  Stories use placeholder paths or colored rectangles.
