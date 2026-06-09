<!-- Created: 2026-06-09 00:01:22 -->
<!-- Completed: 2026-06-09 -->

# Task 8: Build Start Menu

---

## Rationale

The Start Menu is the single most recognizable piece of the Windows 7 desktop. It turns this
portfolio from "a wallpaper with icons" into "a working desktop you can navigate." Visitors
who see the orb ➜ menu ➜ shortcut ➜ window chain will register "this person recreated the OS,"
not "this person drew a picture of it."

Task 8 delivers the Start Menu as a **self-contained, Storybook-first component** that owns its
own open/close animation (Framer Motion), dismissal logic (outside-click + Escape), keyboard
navigation (ARIA `menu`/`menuitem`), search filtering, and the Sign Out action. The Taskbar
(Task 14) wires the orb toggle; the avatar comes from session state (Task 15). Both dependencies
are handled via props so this component is buildable and testable in isolation right now.

### Windows 7 Start Menu anatomy

```
┌──────────────────────────────────────────────────┐
│  ┌─────────────────────┬────────────────────────┐ │
│  │                     │     [ Avatar ]          │ │  ← avatar protrudes above top edge
│  │  ▸ Resume           │                         │ │
│  │  ▸ Projects         │   GitHub ▸              │ │
│  │                     │   LinkedIn ▸            │ │
│  │                     │   Source Code ▸         │ │
│  │                     │                         │ │
│  │                     │ ─────────────────────── │ │
│  │                     │   Sign Out              │ │
│  ├─────────────────────┴────────────────────────┤ │
│  │  🔍 Search programs and files                 │ │
│  └───────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

| Zone         | Description                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Left column  | "Pinned" program shortcuts — each dispatches `openWindow` for an IE window                                                  |
| Right column | Folder/link shortcuts — each dispatches `openWindow` for an IE external-link stub                                           |
| Avatar       | Reuses `<AccountIcon>` from `src/components/windows7/AccountIcon/` — reads from a prop (wired to session avatar in Task 15) |
| Search bar   | Filters the left-column shortcuts by label substring match (case-insensitive)                                               |
| Sign Out     | Calls `signOut()` from `src/lib/auth.ts`, dispatches `clearSession`, navigates to `/login`                                  |
| Panel        | Aero glass background via `backdrop-filter: blur()`, opens/closes with Framer Motion                                        |

### What already exists

| Artifact                | Location                                 | Relevance                                              |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `AccountIcon` component | `src/components/windows7/AccountIcon/`   | Reuse directly for the avatar header                   |
| `signOut()`             | `src/lib/auth.ts`                        | Sign Out action calls this                             |
| `clearSession`          | `src/store/slices/sessionSlice.ts`       | Dispatch after signOut                                 |
| `openWindow`            | `src/store/slices/windowSlice.ts`        | Shortcuts dispatch this                                |
| `WindowKind`            | `src/store/slices/windowSlice.ts`        | Currently `'welcome' \| 'about-this-pc'`               |
| Aero glass tokens       | `globals.css` / 7.css                    | `--w7-w-bg`, `--w7-w-bd`, `backdrop-filter: blur(4px)` |
| `renderWithProviders`   | `src/test-utils/renderWithProviders.tsx` | Test helper with Redux + Apollo                        |
| `useRouter`             | `next/navigation`                        | For `/login` redirect after sign out                   |
| `--dsk-z-overlay: 9000` | `globals.css`                            | The Start Menu sits at this z-index layer              |

### Key decisions

**Decision 1 — `WindowKind` must be extended before shortcuts can dispatch.** The left-column
shortcuts open IE windows. `WindowKind` currently has only `'welcome' | 'about-this-pc'`.
Task 16 adds `'internet-explorer'`, but the Start Menu needs it now. Add
`'internet-explorer'` to the `WindowKind` union in `windowSlice.ts` as a prerequisite step
so the dispatched payloads type-check. This is a one-line change that unblocks both Task 8
and Task 16.

**Decision 2 — `isOpen` state lives in the parent, not in Redux.** The Start Menu's
open/closed state is purely local UI — no other component reads it except the Taskbar orb
(Task 14). A `useState` boolean passed as a prop is sufficient. Adding a Redux slice for a
single boolean is over-engineering. The Taskbar wires `isOpen` + `onToggle` + `onClose`.

**Decision 3 — Framer Motion `AnimatePresence` + `motion.div` for the panel.** The menu
fades + slides up on open, reverse on close. `AnimatePresence` handles the exit animation
on unmount. The animation targets: `opacity: 0 → 1`, `y: 10 → 0`, duration `150ms`,
ease-out. This matches Win7's snappy Start Menu reveal.

**Decision 4 — Keyboard navigation via roving tabindex on `menuitem` roles.** The panel
has `role="menu"`. Each shortcut is `role="menuitem"`. Arrow keys move focus between items.
Enter/Space activates. Escape closes the menu. This is the WAI-ARIA Menu pattern.

**Decision 5 — Search filters the left column only.** The right column contains fixed
navigation (GitHub, LinkedIn, Source) that should always be visible. Search narrows the
program shortcuts in the left column by case-insensitive substring match on the label.

**Decision 6 — The avatar prop is a `string | undefined`.** Task 15 persists the avatar
into `sessionSlice`. Until that's done, the Start Menu accepts `avatarSrc?: string` as a
prop and falls back to the default user icon. This keeps Task 8 independent of Task 15.

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 0 — Prerequisite: Extend `WindowKind`

File: `src/store/slices/windowSlice.ts`

```ts
// TODO: [Action Required: add 'internet-explorer' to WindowKind union] - 2 min
//
//   Current:  export type WindowKind = 'welcome' | 'about-this-pc'
//   Change:   export type WindowKind = 'welcome' | 'about-this-pc' | 'internet-explorer'
//
//   This one-line change unblocks both Task 8 (Start Menu shortcuts dispatch
//   openWindow with kind: 'internet-explorer') and Task 16 (IE component).
//   No other code changes needed — the slice is kind-agnostic.
```

### Step 1 — Design tokens: `src/app/globals.css`

```css
/* TODO: [Action Required: add Start Menu tokens to globals.css] - 10 min
 *
 * Add these inside :root, after the Desktop icons section.
 *
 * IMPORTANT: The Start Menu uses Aero glass, which is a semi-transparent
 * panel with backdrop-filter: blur(). The background is NOT a solid color.
 * The 7.css framework uses --w7-w-bg (#4580c4) as the glass tint color
 * and backdrop-filter: blur(4px) for the glass effect.
 *
 * RESEARCH the exact Windows 7 Start Menu styling. The values below are
 * structural starting points — visual tokens (colors, gradients) MUST be
 * sourced from a Windows 7 reference screenshot or the 7.css source.
 * Per CLAUDE.md: "DO NOT makeup css values."
 *
 * Structural tokens (safe to define now):
 *
 *   --sm-width: 410px              ← total panel width
 *   --sm-left-col-width: 190px     ← left program column width
 *   --sm-padding: 6px              ← inner padding (matches --w7-w-space)
 *   --sm-item-height: 30px         ← row height for each shortcut item
 *   --sm-item-padding: 4px 8px     ← shortcut inner padding
 *   --sm-item-icon-size: 24px      ← shortcut icon size (small Win7 icon)
 *   --sm-item-gap: 8px             ← gap between icon and label
 *   --sm-search-height: 26px       ← search input height
 *   --sm-avatar-offset: -20px      ← how far avatar protrudes above top edge
 *   --sm-z: var(--dsk-z-overlay)   ← z-index layer
 *
 * Visual tokens (MUST source from reference):
 *
 *   --sm-bg                        ← the glass background (semi-transparent)
 *   --sm-border                    ← outer border
 *   --sm-shadow                    ← drop-shadow
 *   --sm-left-bg                   ← left column background (slightly lighter)
 *   --sm-right-bg                  ← right column background (slightly darker)
 *   --sm-divider                   ← horizontal divider between shortcuts and sign-out
 *   --sm-item-hover-bg             ← shortcut hover highlight
 *   --sm-item-hover-border         ← shortcut hover border
 *   --sm-search-border             ← search input border
 *   --sm-search-bg                 ← search input background
 *
 * WAIT: Reference https://unpkg.com/7.css for the glass effect pattern.
 * The key technique from 7.css:
 *   - The panel gets position: relative
 *   - A ::after pseudo-element covers the panel with backdrop-filter: blur(4px)
 *     and z-index: -10
 *   - The panel background uses a semi-transparent tint over the blur
 *
 * The Windows 7 Start Menu has a distinctive two-tone layout:
 *   - Left column: white/light background for program list
 *   - Right column: blue-tinted Aero glass for folder shortcuts
 *   - Bottom bar (search): matches left column tone
 *   - Top-right corner: avatar protruding above the panel
 */
```

### Step 2 — Start Menu shortcut registry: `src/components/screens/desktop/StartMenu/startMenuItems.ts`

```ts
// TODO: [Action Required: define the shortcut data for both columns] - 10 min
//
//   This is a typed, static registry — NOT a React component.
//   It defines what shortcuts appear in the Start Menu.
//
//   interface StartMenuShortcut {
//     id: string
//     label: string
//     iconSrc: string          // path to the 24x24 shortcut icon
//     action:
//       | { type: 'openWindow'; kind: WindowKind; title: string }
//       | { type: 'signOut' }
//   }
//
//   Export two arrays:
//
//   LEFT_COLUMN_SHORTCUTS: StartMenuShortcut[]
//     - { id: 'sm-resume',   label: 'Resume',   iconSrc: '...', action: { type: 'openWindow', kind: 'internet-explorer', title: 'Resume' } }
//     - { id: 'sm-projects', label: 'Projects', iconSrc: '...', action: { type: 'openWindow', kind: 'internet-explorer', title: 'Projects' } }
//
//   RIGHT_COLUMN_SHORTCUTS: StartMenuShortcut[]
//     - { id: 'sm-github',   label: 'GitHub',      iconSrc: '...', action: { type: 'openWindow', kind: 'internet-explorer', title: 'GitHub' } }
//     - { id: 'sm-linkedin', label: 'LinkedIn',    iconSrc: '...', action: { type: 'openWindow', kind: 'internet-explorer', title: 'LinkedIn' } }
//     - { id: 'sm-source',   label: 'Source Code', iconSrc: '...', action: { type: 'openWindow', kind: 'internet-explorer', title: 'Source Code' } }
//
//   SIGN_OUT_ITEM: StartMenuShortcut
//     - { id: 'sm-signout', label: 'Sign Out', iconSrc: '...', action: { type: 'signOut' } }
//
//   NOTE: Icon images may not exist yet. Use placeholder paths matching the
//   pattern '/imgs/desktop/icons/{name}.png'. Real assets land in Task 17.
//
//   Import WindowKind from '@/store/slices/windowSlice'.
```

### Step 3 — StartMenuItem component: `src/components/screens/desktop/StartMenu/StartMenuItem.tsx`

```tsx
'use client'

// TODO: [Action Required: implement a single shortcut row] - 15 min
//
//   This is the atomic unit — one row in either column of the Start Menu.
//
//   Props:
//     interface StartMenuItemProps {
//       iconSrc: string
//       label: string
//       onClick: () => void
//     }
//
//   Render:
//     <li
//       role="menuitem"
//       tabIndex={-1}
//       className={styles.item}
//       onClick={onClick}
//       onKeyDown={(e) => {
//         if (e.key === 'Enter' || e.key === ' ') {
//           e.preventDefault()
//           onClick()
//         }
//       }}
//     >
//       <img
//         className={styles.itemIcon}
//         src={iconSrc}
//         alt=""
//         width={24}
//         height={24}
//         draggable={false}
//       />
//       <span className={styles.itemLabel}>{label}</span>
//     </li>
//
//   IMPORTANT: Use a plain <img> here, NOT Next.js <Image>.
//   The shortcut icons are small (24×24) decorative elements where
//   Next.js image optimization adds complexity for zero benefit.
//   The alt="" is intentional — the accessible name comes from the
//   menuitem role + label text, not the icon image.
//
//   The tabIndex={-1} is for roving tabindex — focus is managed
//   programmatically by the parent menu, not by the browser's tab order.
```

### Step 4 — StartMenuItem styles: `src/components/screens/desktop/StartMenu/StartMenuItem.module.css`

```css
/* TODO: [Action Required: style the shortcut row] - 10 min
 *
 * .item
 *   display: flex;
 *   align-items: center;
 *   gap: var(--sm-item-gap);
 *   height: var(--sm-item-height);
 *   padding: var(--sm-item-padding);
 *   border: 1px solid transparent;
 *   border-radius: var(--w7-el-bdr);
 *   cursor: default;
 *   user-select: none;
 *   outline: none;
 *   background: transparent;
 *   color: inherit;
 *
 * .item:hover,
 * .item:focus-visible
 *   background: var(--sm-item-hover-bg);
 *   border-color: var(--sm-item-hover-border);
 *
 *   RESEARCH: The Win7 Start Menu item hover is a translucent blue
 *   highlight with a subtle border — very similar to the 7.css list
 *   highlight tokens:
 *     --w7-li-bg-hl: linear-gradient(#fff9,#e6ecf5cc 90%,#fffc)
 *     --w7-li-bd-hl: #aaddfa
 *   Consider reusing these 7.css tokens directly or defining --sm-*
 *   tokens that reference them.
 *
 * .itemIcon
 *   width: var(--sm-item-icon-size);
 *   height: var(--sm-item-icon-size);
 *   pointer-events: none;
 *   flex-shrink: 0;
 *
 * .itemLabel
 *   font-size: var(--font-size-s);
 *   white-space: nowrap;
 *   overflow: hidden;
 *   text-overflow: ellipsis;
 */
```

### Step 5 — StartMenu component: `src/components/screens/desktop/StartMenu/StartMenu.tsx`

```tsx
'use client'

// TODO: [Action Required: implement the Start Menu panel] - 40 min
//
//   This is the main component. It renders the two-column panel with
//   Framer Motion animation, search filtering, keyboard navigation,
//   outside-click dismissal, and Escape dismissal.
//
//   Props:
//     interface StartMenuProps {
//       isOpen: boolean
//       onClose: () => void
//       avatarSrc?: string      // from session — wired in Task 15
//     }
//
//   Implementation:
//
//   1. SEARCH STATE:
//        const [searchQuery, setSearchQuery] = useState('')
//        const searchRef = useRef<HTMLInputElement>(null)
//
//   2. FILTERED SHORTCUTS:
//        const filteredLeft = useMemo(() => {
//          if (!searchQuery.trim()) return LEFT_COLUMN_SHORTCUTS
//          const q = searchQuery.toLowerCase()
//          return LEFT_COLUMN_SHORTCUTS.filter(s => s.label.toLowerCase().includes(q))
//        }, [searchQuery])
//
//   3. OUTSIDE-CLICK DISMISSAL:
//        const panelRef = useRef<HTMLDivElement>(null)
//
//        useEffect(() => {
//          if (!isOpen) return
//          function handleClickOutside(e: MouseEvent) {
//            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
//              onClose()
//            }
//          }
//          document.addEventListener('mousedown', handleClickOutside)
//          return () => document.removeEventListener('mousedown', handleClickOutside)
//        }, [isOpen, onClose])
//
//   4. ESCAPE DISMISSAL:
//        useEffect(() => {
//          if (!isOpen) return
//          function handleEscape(e: KeyboardEvent) {
//            if (e.key === 'Escape') onClose()
//          }
//          document.addEventListener('keydown', handleEscape)
//          return () => document.removeEventListener('keydown', handleEscape)
//        }, [isOpen, onClose])
//
//   5. FOCUS MANAGEMENT — on open, focus the search input:
//        useEffect(() => {
//          if (isOpen) {
//            // Small delay to let Framer Motion mount the panel
//            requestAnimationFrame(() => searchRef.current?.focus())
//          } else {
//            setSearchQuery('')
//          }
//        }, [isOpen])
//
//   6. KEYBOARD NAVIGATION — roving tabindex:
//        The menu container has role="menu". On ArrowDown/ArrowUp from
//        the search input, move focus to the first/last menuitem.
//        Within the menuitems, ArrowDown/ArrowUp cycle focus.
//        Home/End jump to first/last item.
//
//        function handleMenuKeyDown(e: React.KeyboardEvent) {
//          const items = panelRef.current?.querySelectorAll('[role="menuitem"]')
//          if (!items?.length) return
//
//          const focusedIndex = Array.from(items).indexOf(document.activeElement as Element)
//
//          if (e.key === 'ArrowDown') {
//            e.preventDefault()
//            const next = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0
//            ;(items[next] as HTMLElement).focus()
//          }
//          if (e.key === 'ArrowUp') {
//            e.preventDefault()
//            const prev = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1
//            ;(prev >= 0 ? items[prev] as HTMLElement : searchRef.current)?.focus()
//          }
//          if (e.key === 'Home') {
//            e.preventDefault()
//            ;(items[0] as HTMLElement).focus()
//          }
//          if (e.key === 'End') {
//            e.preventDefault()
//            ;(items[items.length - 1] as HTMLElement).focus()
//          }
//        }
//
//   7. ACTION HANDLER:
//        const dispatch = useAppDispatch()
//        const router = useRouter()
//
//        async function handleAction(action: StartMenuShortcut['action']) {
//          onClose()
//          if (action.type === 'openWindow') {
//            dispatch(openWindow({ kind: action.kind, title: action.title }))
//          } else if (action.type === 'signOut') {
//            await signOut()
//            dispatch(clearSession())
//            router.push('/login')
//          }
//        }
//
//   8. RENDER — AnimatePresence wraps the conditional panel:
//
//        <AnimatePresence>
//          {isOpen && (
//            <motion.div
//              ref={panelRef}
//              className={styles.panel}
//              role="menu"
//              aria-label="Start menu"
//              onKeyDown={handleMenuKeyDown}
//              initial={{ opacity: 0, y: 10 }}
//              animate={{ opacity: 1, y: 0 }}
//              exit={{ opacity: 0, y: 10 }}
//              transition={{ duration: 0.15, ease: 'easeOut' }}
//            >
//              {/* ── Left column ─────────────────────────────── */}
//              <div className={styles.leftColumn}>
//                <ul className={styles.shortcutList}>
//                  {filteredLeft.map(shortcut => (
//                    <StartMenuItem
//                      key={shortcut.id}
//                      iconSrc={shortcut.iconSrc}
//                      label={shortcut.label}
//                      onClick={() => handleAction(shortcut.action)}
//                    />
//                  ))}
//                </ul>
//              </div>
//
//              {/* ── Right column ────────────────────────────── */}
//              <div className={styles.rightColumn}>
//                {/* Avatar header — protrudes above the panel */}
//                <div className={styles.avatarHeader}>
//                  <AccountIcon
//                    iconSrc={avatarSrc}
//                    width={48}
//                    height={48}
//                    disabled
//                  />
//                </div>
//
//                <ul className={styles.shortcutList}>
//                  {RIGHT_COLUMN_SHORTCUTS.map(shortcut => (
//                    <StartMenuItem
//                      key={shortcut.id}
//                      iconSrc={shortcut.iconSrc}
//                      label={shortcut.label}
//                      onClick={() => handleAction(shortcut.action)}
//                    />
//                  ))}
//                </ul>
//
//                <div className={styles.divider} />
//
//                <StartMenuItem
//                  iconSrc={SIGN_OUT_ITEM.iconSrc}
//                  label={SIGN_OUT_ITEM.label}
//                  onClick={() => handleAction(SIGN_OUT_ITEM.action)}
//                />
//              </div>
//
//              {/* ── Search bar ──────────────────────────────── */}
//              <div className={styles.searchBar}>
//                <input
//                  ref={searchRef}
//                  className={styles.searchInput}
//                  type="text"
//                  placeholder="Search programs and files"
//                  aria-label="Search programs and files"
//                  value={searchQuery}
//                  onChange={(e) => setSearchQuery(e.target.value)}
//                  onKeyDown={(e) => {
//                    if (e.key === 'ArrowDown') {
//                      e.preventDefault()
//                      const firstItem = panelRef.current?.querySelector('[role="menuitem"]') as HTMLElement
//                      firstItem?.focus()
//                    }
//                  }}
//                />
//              </div>
//            </motion.div>
//          )}
//        </AnimatePresence>
//
//   ARCHITECTURE NOTES:
//
//   - The panel position is `position: fixed; bottom: var(--dsk-taskbar-reserve);
//     left: 0;` — it sits directly above the taskbar, anchored to the Start orb.
//   - z-index: var(--sm-z) puts it above windows but below the taskbar itself.
//   - The Aero glass effect uses the same ::after technique from 7.css:
//       .panel::after {
//         content: '';
//         position: absolute;
//         inset: 0;
//         backdrop-filter: blur(4px);
//         border-radius: inherit;
//         z-index: -1;
//       }
//     The panel's own background is semi-transparent to let the blur show through.
//
//   - The AccountIcon reuse from the logon screen may need size overrides.
//     The logon screen uses 128×128 images in a 144×144 frame. The Start Menu
//     avatar is much smaller (~48×48 image). Pass width={48} height={48} and
//     verify the frame scales correctly. You may need to add a `size` variant
//     or just override via a wrapper className. Check AccountIcon.tsx to see
//     if it handles smaller sizes gracefully — the 144px hardcoded in the CSS
//     may need a conditional. If it doesn't scale, wrap in a container with
//     CSS transform: scale() as a quick fix, or add a `size` prop to AccountIcon.
//
//   - IMPORTANT: The `signOut` function is async (it calls supabase.auth.signOut).
//     The handler must await it before dispatching clearSession and navigating.
```

### Step 6 — StartMenu styles: `src/components/screens/desktop/StartMenu/StartMenu.module.css`

```css
/* TODO: [Action Required: style the Start Menu panel] - 25 min
 *
 * RESEARCH NEEDED: The Windows 7 Start Menu has very specific styling
 * that goes beyond generic Aero glass. Source from a reference.
 *
 * .panel
 *   position: fixed;
 *   bottom: var(--dsk-taskbar-reserve);
 *   left: 0;
 *   width: var(--sm-width);
 *   z-index: var(--sm-z);
 *   display: grid;
 *   grid-template-columns: var(--sm-left-col-width) 1fr;
 *   grid-template-rows: 1fr auto;
 *   border: var(--sm-border);
 *   border-radius: var(--w7-w-bdr) var(--w7-w-bdr) 0 0;
 *   box-shadow: var(--sm-shadow);
 *   overflow: visible;           ← avatar protrudes above top edge
 *   color: var(--w7-el-c);
 *
 * .panel::after               ← Aero glass blur layer (from 7.css pattern)
 *   content: '';
 *   position: absolute;
 *   inset: 0;
 *   backdrop-filter: blur(4px);
 *   -webkit-backdrop-filter: blur(4px);
 *   border-radius: inherit;
 *   z-index: -1;
 *
 * .leftColumn
 *   grid-column: 1;
 *   grid-row: 1;
 *   background: var(--sm-left-bg);
 *   padding: var(--sm-padding);
 *   border-right: 1px solid var(--sm-divider);
 *   overflow-y: auto;
 *
 * .rightColumn
 *   grid-column: 2;
 *   grid-row: 1;
 *   background: var(--sm-right-bg);
 *   padding: var(--sm-padding);
 *   position: relative;         ← for avatar positioning
 *   display: flex;
 *   flex-direction: column;
 *
 * .avatarHeader
 *   display: flex;
 *   justify-content: center;
 *   margin-top: var(--sm-avatar-offset);    ← negative value pulls it up
 *   margin-bottom: var(--sm-padding);
 *
 * .shortcutList
 *   list-style: none;
 *   margin: 0;
 *   padding: 0;
 *   display: flex;
 *   flex-direction: column;
 *
 * .divider
 *   height: 1px;
 *   background: var(--sm-divider);
 *   margin: var(--sm-padding) 0;
 *
 * .searchBar
 *   grid-column: 1 / -1;       ← spans both columns
 *   grid-row: 2;
 *   padding: var(--sm-padding);
 *   background: var(--sm-left-bg);
 *   border-top: 1px solid var(--sm-divider);
 *   border-radius: 0 0 var(--w7-w-bdr) var(--w7-w-bdr);
 *
 * .searchInput
 *   width: 100%;
 *   height: var(--sm-search-height);
 *   padding: 2px 6px 2px 24px;  ← left padding for search icon
 *   border: var(--sm-search-border);
 *   border-radius: var(--w7-el-bdr);
 *   background: var(--sm-search-bg);
 *   font: var(--w7-font);
 *   color: var(--w7-el-c);
 *   outline: none;
 *
 *   RESEARCH: The Win7 search box has a magnifying glass icon on the
 *   left side. Implement via background-image on the input or a ::before
 *   on the wrapper. The 7.css source includes a search icon as a data URI
 *   stored in --w7-s-icon / --w7-s-bg. Use that:
 *     background: var(--w7-s-bg);
 *     background-size: 14px;
 *     background-position: 6px center;
 *
 * .searchInput:focus
 *   border-color: var(--w7-el-bd-h);
 *   box-shadow: var(--w7-el-sd);
 */
```

### Step 7 — Barrel export: `src/components/screens/desktop/StartMenu/index.ts`

```ts
// TODO: [Action Required: create barrel export] - 1 min
//   export { StartMenu } from './StartMenu'
//   export type { StartMenuProps } from './StartMenu'
//   (only if StartMenuProps is exported from the component file)
```

### Step 8 — Storybook stories: `src/components/screens/desktop/StartMenu/StartMenu.stories.tsx`

```tsx
// TODO: [Action Required: create Start Menu stories] - 20 min
//
//   meta:
//     title: 'Desktop/StartMenu'
//     component: StartMenu
//     parameters: { layout: 'fullscreen' }
//     decorators: [
//       (Story) => {
//         const store = setupStore()
//         return (
//           <Provider store={store}>
//             <div style={{
//               position: 'fixed',
//               inset: 0,
//               background: 'var(--desktop-backdrop) center / cover no-repeat',
//             }}>
//               <Story />
//             </div>
//           </Provider>
//         )
//       },
//     ]
//
//   IMPORTANT: The Start Menu is fixed-positioned at the bottom-left. The
//   fullscreen decorator with the desktop wallpaper provides realistic context.
//
//   Story 1 — Closed:
//     args: { isOpen: false, onClose: fn() }
//     Verifies nothing renders when closed.
//
//   Story 2 — Open:
//     args: { isOpen: true, onClose: fn() }
//     Verifies the full panel renders with both columns, search bar,
//     shortcuts, avatar, and Sign Out button visible.
//
//   Story 3 — OpenWithSearchActive:
//     args: { isOpen: true, onClose: fn() }
//     play: async ({ canvasElement }) => {
//       const canvas = within(canvasElement)
//       const search = canvas.getByRole('textbox', { name: /search/i })
//       await userEvent.type(search, 'res')
//       // Verifies only 'Resume' remains visible after filtering
//     }
//
//   Story 4 — OpenWithAvatar:
//     args: { isOpen: true, onClose: fn(), avatarSrc: '/imgs/windows7/user-icons/user.bmp' }
//     Verifies the avatar renders in the right column header.
```

### Step 9 — RTL integration test: `src/components/screens/desktop/StartMenu/StartMenu.test.tsx`

```tsx
// TODO: [Action Required: test search filtering and shortcut dispatch] - 25 min
//
//   Use renderWithProviders from '@/test-utils'.
//
//   describe('StartMenu')
//
//     it('does not render when isOpen is false')
//       - renderWithProviders(<StartMenu isOpen={false} onClose={fn()} />)
//       - expect(screen.queryByRole('menu')).not.toBeInTheDocument()
//
//     it('renders the menu panel when isOpen is true')
//       - renderWithProviders(<StartMenu isOpen={true} onClose={fn()} />)
//       - expect(screen.getByRole('menu', { name: /start menu/i })).toBeInTheDocument()
//
//     it('renders all left-column shortcuts')
//       - renderWithProviders(<StartMenu isOpen={true} onClose={fn()} />)
//       - expect(screen.getByRole('menuitem', { name: 'Resume' })).toBeInTheDocument()
//       - expect(screen.getByRole('menuitem', { name: 'Projects' })).toBeInTheDocument()
//
//     it('renders all right-column shortcuts')
//       - Verify GitHub, LinkedIn, Source Code menuitems exist.
//
//     it('renders the Sign Out item')
//       - expect(screen.getByRole('menuitem', { name: 'Sign Out' })).toBeInTheDocument()
//
//     it('filters left-column shortcuts by search query')
//       - Render with isOpen true
//       - Type 'res' into the search input
//       - expect(screen.getByRole('menuitem', { name: 'Resume' })).toBeInTheDocument()
//       - expect(screen.queryByRole('menuitem', { name: 'Projects' })).not.toBeInTheDocument()
//       - Right column items should still be present
//
//     it('dispatches openWindow when a shortcut is clicked')
//       - Render with isOpen true
//       - Click the Resume menuitem
//       - Assert store.getState().window.ids.length === 1
//       - Assert the opened window has kind: 'internet-explorer' and title: 'Resume'
//
//     it('calls onClose when a shortcut is clicked')
//       - const onClose = jest.fn()
//       - Render with isOpen true, onClose
//       - Click any menuitem
//       - expect(onClose).toHaveBeenCalledTimes(1)
//
//     it('calls onClose on Escape key')
//       - const onClose = jest.fn()
//       - Render with isOpen true, onClose
//       - fireEvent.keyDown(document, { key: 'Escape' })
//       - expect(onClose).toHaveBeenCalledTimes(1)
//
//     it('focuses the search input when opened')
//       - Render with isOpen true
//       - await waitFor(() => {
//           expect(screen.getByRole('textbox', { name: /search/i })).toHaveFocus()
//         })
//
//     it('navigates menuitems with ArrowDown/ArrowUp')
//       - Render with isOpen true
//       - Focus the search input
//       - Press ArrowDown → first menuitem should have focus
//       - Press ArrowDown → second menuitem should have focus
//       - Press ArrowUp → first menuitem should have focus
//
//   NOTES:
//   - The signOut test is trickier because signOut() is async and calls
//     supabase.auth.signOut(). You'll need to mock the auth module:
//       jest.mock('@/lib/auth', () => ({
//         signOut: jest.fn().mockResolvedValue({ ok: true, data: null }),
//       }))
//     Then test the Sign Out item dispatches clearSession and calls
//     router.push('/login'). You'll also need to mock next/navigation:
//       const mockPush = jest.fn()
//       jest.mock('next/navigation', () => ({
//         useRouter: () => ({ push: mockPush }),
//       }))
//
//   - For the outside-click test, you need to fire a mousedown event on
//     the document body (outside the panel). Use fireEvent.mouseDown(document.body).
```

---

## New Tokens Summary

These tokens must be added to `globals.css` before the CSS modules reference them:

```css
/* ─── SEMANTIC: Start Menu ─────────────────────────────────────── */
/* Structural tokens */
--sm-width: 410px;
--sm-left-col-width: 190px;
--sm-padding: 6px;
--sm-item-height: 30px;
--sm-item-padding: 4px 8px;
--sm-item-icon-size: 24px;
--sm-item-gap: 8px;
--sm-search-height: 26px;
--sm-avatar-offset: -20px;
--sm-z: var(--dsk-z-overlay);

/* Visual tokens — RESEARCH NEEDED from Windows 7 reference */
--sm-bg: <source from reference>;
--sm-border: <source from reference>;
--sm-shadow: <source from reference>;
--sm-left-bg: <source from reference>;
--sm-right-bg: <source from reference>;
--sm-divider: <source from reference>;
--sm-item-hover-bg: <source from reference — consider reusing --w7-li-bg-hl>;
--sm-item-hover-border: <source from reference — consider reusing --w7-li-bd-hl>;
--sm-search-border: <source from reference>;
--sm-search-bg: <source from reference>;
```

The visual tokens require sourcing from a real Windows 7 Start Menu reference. Per `CLAUDE.md`:
"DO NOT makeup css values." Structural tokens (dimensions, spacing) are safe to define now.

---

## File Inventory

| File                                                                | Type                 | New/Modified |
| ------------------------------------------------------------------- | -------------------- | ------------ |
| `src/store/slices/windowSlice.ts`                                   | WindowKind extension | Modified     |
| `src/app/globals.css`                                               | Start Menu tokens    | Modified     |
| `src/components/screens/desktop/StartMenu/startMenuItems.ts`        | Shortcut registry    | New          |
| `src/components/screens/desktop/StartMenu/StartMenuItem.tsx`        | Row component        | New          |
| `src/components/screens/desktop/StartMenu/StartMenuItem.module.css` | Row styles           | New          |
| `src/components/screens/desktop/StartMenu/StartMenu.tsx`            | Panel component      | New          |
| `src/components/screens/desktop/StartMenu/StartMenu.module.css`     | Panel styles         | New          |
| `src/components/screens/desktop/StartMenu/index.ts`                 | Barrel export        | New          |
| `src/components/screens/desktop/StartMenu/StartMenu.stories.tsx`    | Storybook stories    | New          |
| `src/components/screens/desktop/StartMenu/StartMenu.test.tsx`       | RTL tests            | New          |

---

## Validation Checklist

```
## Task 8 — Start Menu Validation Checklist

| #  | Step                                                                                         | Verified by                    | Status     |
| -- | -------------------------------------------------------------------------------------------- | ------------------------------ | ---------- |
| 1  | WindowKind includes 'internet-explorer'                                                      | grep windowSlice.ts            | ⬜ Pending |
| 2  | --sm-* tokens added to globals.css                                                           | grep globals.css for --sm-     | ⬜ Pending |
| 3  | Visual tokens sourced from Windows 7 reference (no raw guessed values)                       | code review                    | ⬜ Pending |
| 4  | startMenuItems.ts exports LEFT_COLUMN_SHORTCUTS, RIGHT_COLUMN_SHORTCUTS, SIGN_OUT_ITEM      | code review                    | ⬜ Pending |
| 5  | StartMenuItem.tsx uses role="menuitem" and tabIndex={-1}                                     | code review                    | ⬜ Pending |
| 6  | StartMenu.tsx wraps panel in AnimatePresence + motion.div                                    | code review                    | ⬜ Pending |
| 7  | Panel has role="menu" and aria-label                                                         | code review                    | ⬜ Pending |
| 8  | Outside-click fires onClose                                                                  | RTL test                       | ⬜ Pending |
| 9  | Escape fires onClose                                                                         | RTL test                       | ⬜ Pending |
| 10 | Search input focused on open                                                                 | RTL test                       | ⬜ Pending |
| 11 | Search filters left-column shortcuts by label (case-insensitive)                             | RTL test                       | ⬜ Pending |
| 12 | Right-column shortcuts NOT filtered by search                                                | RTL test                       | ⬜ Pending |
| 13 | Shortcut click dispatches openWindow with correct kind and title                             | RTL test                       | ⬜ Pending |
| 14 | Sign Out calls signOut(), dispatches clearSession, navigates to /login                       | RTL test (mocked auth)         | ⬜ Pending |
| 15 | Keyboard: ArrowDown/ArrowUp navigate menuitems                                               | RTL test                       | ⬜ Pending |
| 16 | AccountIcon renders in right-column header with avatarSrc prop                               | Storybook visual               | ⬜ Pending |
| 17 | Storybook: Closed / Open / OpenWithSearchActive / OpenWithAvatar stories                     | npm run storybook              | ⬜ Pending |
| 18 | Aero glass effect: backdrop-filter: blur() on panel ::after                                  | code review + Storybook        | ⬜ Pending |
| 19 | No raw color/shadow/blur values in CSS modules — all tokens                                  | grep for raw rgba/hex literals | ⬜ Pending |
| 20 | npx tsc --noEmit clean (excluding pre-existing errors)                                       | npx tsc --noEmit               | ⬜ Pending |
| 21 | npx eslint --max-warnings=0 clean on all new files                                           | npx eslint                     | ⬜ Pending |
| 22 | npm test green (all existing + new tests)                                                    | npm test                       | ⬜ Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **One component, three layers.** A typed shortcut registry (pure data), a `<StartMenuItem>`
  row primitive (stateless, `menuitem` role), and the `<StartMenu>` panel (state, animation,
  keyboard nav, search, actions). Each layer is independently testable.
- **Framer Motion `AnimatePresence` gates the exit animation.** Without it, the panel unmounts
  instantly on close. `motion.div` with `initial`/`animate`/`exit` and `duration: 0.15` gives
  the Win7-snappy reveal feel.
- **WAI-ARIA Menu pattern for keyboard navigation.** `role="menu"` on the panel,
  `role="menuitem"` + `tabIndex={-1}` on each shortcut, roving tabindex managed by
  `onKeyDown` — ArrowDown/ArrowUp cycle, Enter/Space activate, Escape dismisses. This is
  the standard ARIA pattern for flyout menus.
- **Search filters left column only.** Right column (GitHub, LinkedIn, Source) is fixed
  navigation. Case-insensitive substring match via `useMemo` for derived state.
- **`isOpen` is a prop, not Redux.** The Taskbar (Task 14) owns the toggle state. The Start
  Menu is a controlled component — `isOpen` to show, `onClose` to dismiss. No global state
  for a local UI concern.
- **`WindowKind` must include `'internet-explorer'` before shortcuts can type-check.** This
  is a one-line prerequisite change in `windowSlice.ts` that also unblocks Task 16.
- **Visual tokens require research.** The Start Menu's two-tone background (white left, blue
  right), Aero glass blur, and item hover highlights must be sourced from a real Win7
  reference — not guessed. Structural tokens (dimensions) are defined; visual tokens are
  marked RESEARCH NEEDED.
