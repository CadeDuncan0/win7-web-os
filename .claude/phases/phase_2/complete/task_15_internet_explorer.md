<!-- Created: 2026-06-12 16:47:19 -->
<!-- Completed: 2026-06-12 -->

# Task 15: Internet Explorer Component

---

## Rationale

The Internet Explorer window is the primary content surface of the desktop environment. Every
piece of portfolio content — Resume, Projects, external links — opens inside an IE window.
This is not a real browser: it's a controlled React state machine that renders internal stub
pages within Windows 7 IE chrome. The architecture has three layers:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ WindowWrapper (Task 9)                                                   │
│  title: "{page title} - Windows Internet Explorer"                       │
│  position, size, zIndex, drag, focus, animations                         │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ InternetExplorerWindow                                            │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ IEToolbar (navigation row)                                  │  │   │
│  │  │  (●←)(→) [ 🌐 address bar + pseudo-URL         🔄]         │  │   │
│  │  │   ↑    ↑    ↑ IE favicon from             refresh ↑         │  │   │
│  │  │  large small  internetexplorer_logo.png   at bar edge       │  │   │
│  │  ├──────────────────────────────────────────────────────────────┤  │   │
│  │  │ IEFavoritesBar (bookmarks row)                              │  │   │
│  │  │  ☆ [Resume] [Projects] [GitHub] [LinkedIn] [Source Code]    │  │   │
│  │  ├──────────────────────────────────────────────────────────────┤  │   │
│  │  │ Content Area                                                │  │   │
│  │  │  renders the stub page for the current pseudo-route         │  │   │
│  │  │  (HomePage / ResumePage / ProjectsPage / ExternalLink)      │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

Visual reference: `public/imgs/windows7/assets/internetexplorer_OG.png` — screenshot of
real Windows 7 IE8 showing the exact chrome layout to replicate.

Logo asset: `public/imgs/windows7/assets/internetexplorer_logo.png` — classic IE "e" logo
with golden swoosh. Used as the favicon in the address bar.

| Decision                                                                 | Why                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation is controlled React state, not URL-based routing              | IE windows exist inside the Redux window manager. Multiple IE windows can be open simultaneously with different routes. React Router would fight with Next.js's App Router. A simple `useState` + history array gives each IE instance its own independent navigation stack.                                                                    |
| Route registry is a typed allow-list, not arbitrary URLs                 | Security: no third-party iframes, no arbitrary URL loading. Determinism: every route is a known React component. Testability: the route map is a pure data structure that can be iterated in tests.                                                                                                                                             |
| Stub pages are placeholders for Phase 3 content                          | Resume, Projects, and per-project detail pages will eventually render live Supabase data (Phase 3). Phase 2 delivers the navigation shell + layout structure. Stub content documents what will fill each slot.                                                                                                                                  |
| External links (GitHub, LinkedIn, Source) render info cards, not iframes | Opening `github.com` in a fake browser would be confusing — the user would try to interact with it. Instead, external "routes" render a card with the link title, URL, and an "Open in new tab" button that calls `window.open()`.                                                                                                              |
| IE chrome is custom CSS Modules, not 7.css                               | 7.css has no toolbar, address bar, or browser chrome components. The IE toolbar is built with CSS Modules using design tokens in `globals.css`. Visual reference: `internetexplorer_OG.png`.                                                                                                                                                    |
| Back button is large and circular, forward is smaller                    | The reference screenshot shows a dominant large circular blue back button with a smaller forward button beside it. This asymmetric sizing is the defining visual characteristic of IE8's toolbar — it signals "back is the primary navigation action." The back button uses a blue gradient; the forward button is smaller but visually paired. |
| Refresh is embedded in the address bar, not a standalone button          | The reference shows refresh/stop as a small icon at the right edge of the address bar, not a separate toolbar button. This matches real IE8 behavior. In our implementation, refresh triggers `navigate(DEFAULT_ROUTE)` (home).                                                                                                                 |
| Favorites bar provides bookmark-style navigation                         | The reference screenshot shows a secondary row below the main toolbar with starred bookmark links. This is the natural surface for the IE window's quick-link navigation (Resume, Projects, GitHub, etc.) — more discoverable than burying them in the home page only.                                                                          |
| Window title format: `{title} - Windows Internet Explorer`               | The reference title bar reads "Google - Windows Internet Explorer". Every IE window's title follows this pattern. The route registry stores the short page title; the compositor appends the suffix.                                                                                                                                            |
| IE favicon from `internetexplorer_logo.png` in address bar               | The reference shows a small page icon (favicon) at the left edge of the address bar. We use the IE logo asset from `public/imgs/windows7/assets/internetexplorer_logo.png`, scaled to the address bar icon width.                                                                                                                               |
| `initialRoute` prop seeds the navigation stack                           | When the Start Menu dispatches `openWindow({ kind: 'internet-explorer', title: 'Resume' })`, the Task 16 compositor passes the window title to determine which route to open. The `initialRoute` prop lets each IE window start on a different page without ambient state.                                                                      |
| History stack is a simple array + index                                  | `historyStack: string[]` + `historyIndex: number`. Back decrements index, forward increments. Navigate pushes a new route and truncates any forward entries (like a real browser). This is the minimal correct implementation of browser history semantics.                                                                                     |

---

## Implementation Outline

> Imports are omitted in code blocks — deduce them per `import/order` rule. Each step is a
> discrete unit of work.

### Step 0 — IE design tokens: `src/app/globals.css`

```css
/* TODO: [Action Required: add Internet Explorer CSS custom properties to :root] - 10 min
 *
 *   Visual reference: public/imgs/windows7/assets/internetexplorer_OG.png
 *
 *   Add these tokens inside the existing :root block, grouped under a
 *   "SEMANTIC: Internet Explorer chrome" comment section:
 *
 *   -- Toolbar row (navigation bar) --
 *
 *     --ie-toolbar-height: 36px;
 *     --ie-toolbar-bg: linear-gradient(
 *       to bottom,
 *       rgba(240, 243, 248, 1) 0%,
 *       rgba(218, 225, 234, 1) 100%
 *     );
 *       (Win7 IE toolbar gradient: light grey-blue top to medium grey-blue bottom,
 *        visible in the OG screenshot behind the nav buttons and address bar)
 *
 *     --ie-toolbar-border: 1px solid rgba(160, 170, 185, 0.5);
 *     --ie-toolbar-padding: 4px 8px;
 *
 *   -- Back button (large circular, blue — the dominant toolbar element) --
 *
 *     --ie-back-btn-size: 30px;
 *       (the OG screenshot shows the back button is noticeably larger than
 *        the forward button — it's the primary navigation affordance)
 *
 *     --ie-back-btn-bg: linear-gradient(
 *       to bottom,
 *       rgba(110, 175, 230, 1) 0%,
 *       rgba(50, 120, 195, 1) 50%,
 *       rgba(35, 95, 165, 1) 100%
 *     );
 *       (blue gradient matching Win7 IE back button from reference)
 *
 *     --ie-back-btn-bg-hover: linear-gradient(
 *       to bottom,
 *       rgba(130, 195, 245, 1) 0%,
 *       rgba(70, 145, 215, 1) 50%,
 *       rgba(50, 115, 185, 1) 100%
 *     );
 *
 *     --ie-back-btn-bg-disabled: linear-gradient(
 *       to bottom,
 *       rgba(200, 210, 220, 1) 0%,
 *       rgba(170, 180, 195, 1) 100%
 *     );
 *       (greyed out when no back history — still circular, but desaturated)
 *
 *     --ie-back-btn-border: 1px solid rgba(30, 80, 140, 0.6);
 *     --ie-back-btn-arrow-color: #fff;
 *     --ie-back-btn-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
 *
 *   -- Forward button (smaller circular, same blue palette) --
 *
 *     --ie-fwd-btn-size: 22px;
 *       (visibly smaller than back button in the reference screenshot)
 *
 *     --ie-fwd-btn-bg: var(--ie-back-btn-bg);
 *     --ie-fwd-btn-bg-hover: var(--ie-back-btn-bg-hover);
 *     --ie-fwd-btn-bg-disabled: var(--ie-back-btn-bg-disabled);
 *     --ie-fwd-btn-border: var(--ie-back-btn-border);
 *
 *   -- Address bar (white input-like container with favicon + URL + refresh) --
 *
 *     --ie-address-height: 24px;
 *     --ie-address-bg: #fff;
 *     --ie-address-border: 1px solid rgba(120, 140, 165, 0.5);
 *     --ie-address-radius: 2px;
 *     --ie-address-text: #333;
 *     --ie-address-icon-size: 16px;
 *       (the IE favicon from internetexplorer_logo.png, scaled to fit)
 *
 *   -- Refresh button (small icon at the right edge of the address bar) --
 *
 *     --ie-refresh-size: 18px;
 *     --ie-refresh-color: rgba(80, 100, 130, 0.7);
 *     --ie-refresh-color-hover: rgba(50, 70, 100, 1);
 *
 *   -- Favorites bar (secondary row below toolbar with bookmark links) --
 *
 *     --ie-favbar-height: 24px;
 *     --ie-favbar-bg: linear-gradient(
 *       to bottom,
 *       rgba(235, 239, 245, 1) 0%,
 *       rgba(220, 226, 234, 1) 100%
 *     );
 *       (slightly lighter than the toolbar gradient — visible as a
 *        separate row in the OG screenshot with "Google" bookmark)
 *
 *     --ie-favbar-border: 1px solid rgba(160, 170, 185, 0.3);
 *     --ie-favbar-link-color: #1a3a5c;
 *     --ie-favbar-link-hover-bg: rgba(180, 200, 225, 0.4);
 *     --ie-favbar-link-radius: 2px;
 *     --ie-favbar-star-color: rgba(200, 170, 50, 0.9);
 *
 *   -- Content area --
 *
 *     --ie-content-bg: #fff;
 *
 *   -- External link card --
 *
 *     --ie-external-card-bg: rgba(240, 243, 248, 0.8);
 *     --ie-external-card-border: 1px solid var(--w7-el-bd);
 *     --ie-external-card-radius: 4px;
 *     --ie-external-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
 */
```

### Step 1 — Route registry: `src/components/screens/desktop/InternetExplorer/ieRoutes.ts`

```tsx
// TODO: [Action Required: define the typed route registry] - 15 min
//
//   This file defines every pseudo-URL the IE window can navigate to.
//   It is a pure data structure with no React dependencies.
//
//   1. Define the route type:
//
//        type IERouteType = 'internal' | 'external'
//
//        interface IERoute {
//          url: string          // pseudo-URL displayed in the address bar
//          title: string        // short page title (e.g. "Resume")
//          type: IERouteType
//          externalUrl?: string // real URL for external links (window.open target)
//        }
//
//      IMPORTANT — Window title format:
//        The reference screenshot shows the title bar as:
//          "Google - Windows Internet Explorer"
//        The route's `title` stores the short name ("Resume", "Projects").
//        The window title displayed in the title bar is constructed as:
//          `${route.title} - Windows Internet Explorer`
//        This formatting happens in the compositor (Task 16) or in
//        InternetExplorerWindow when it updates the parent window's title.
//        Export a constant for the suffix:
//
//          export const IE_TITLE_SUFFIX = ' - Windows Internet Explorer'
//
//   2. Define the registry as a Record keyed by pseudo-URL:
//
//        export const IE_ROUTES: Record<string, IERoute> = {
//          'about:home': {
//            url: 'about:home',
//            title: 'Internet Explorer',
//            type: 'internal',
//          },
//          'portfolio://resume': {
//            url: 'portfolio://resume',
//            title: 'Resume',
//            type: 'internal',
//          },
//          'portfolio://projects': {
//            url: 'portfolio://projects',
//            title: 'Projects',
//            type: 'internal',
//          },
//          'https://github.com/CadeDuncan': {
//            url: 'https://github.com/CadeDuncan',
//            title: 'GitHub',
//            type: 'external',
//            externalUrl: 'https://github.com/CadeDuncan',
//          },
//          'https://linkedin.com/in/cade-duncan': {
//            url: 'https://linkedin.com/in/cade-duncan',
//            title: 'LinkedIn',
//            type: 'external',
//            externalUrl: 'https://linkedin.com/in/cade-duncan',
//          },
//          'https://github.com/CadeDuncan/PortfolioWebsite-Windows7': {
//            url: 'https://github.com/CadeDuncan/PortfolioWebsite-Windows7',
//            title: 'Source Code',
//            type: 'external',
//            externalUrl: 'https://github.com/CadeDuncan/PortfolioWebsite-Windows7',
//          },
//        }
//
//      Adjust GitHub/LinkedIn URLs to match the real profile URLs.
//      The pseudo-URL scheme (`portfolio://`) distinguishes internal
//      routes from external links visually in the address bar.
//
//   3. Export a default route constant:
//
//        export const DEFAULT_ROUTE = 'about:home'
//
//   4. Export a lookup helper:
//
//        export function resolveRoute(url: string): IERoute | undefined {
//          return IE_ROUTES[url]
//        }
//
//   5. Export a helper that maps a window title to an initial route:
//
//        export function titleToRoute(title: string): string {
//          const match = Object.values(IE_ROUTES).find(
//            (r) => r.title === title
//          )
//          return match?.url ?? DEFAULT_ROUTE
//        }
//
//      This is how the compositor (Task 16) converts the `title` from
//      `openWindow({ kind: 'internet-explorer', title: 'Resume' })`
//      into an `initialRoute` prop for the IE component.
```

### Step 2 — Stub page components: `src/components/screens/desktop/InternetExplorer/pages/`

```tsx
// TODO: [Action Required: create stub page components] - 20 min
//
//   Create a `pages/` subdirectory under InternetExplorer/ with these files:
//
//   --- HomePage.tsx ---
//   The about:home landing page. A simple centered welcome message.
//
//     export function HomePage() {
//       return (
//         <div className={styles.homePage}>
//           // TODO: render a centered "Welcome to Internet Explorer" heading
//           // with a brief description and quick-link tiles to Resume,
//           // Projects, GitHub, LinkedIn, Source Code.
//           // Each tile is a button that calls onNavigate(url) — passed
//           // via props or context.
//           // For now: static HTML with placeholder text. The tiles
//           // dispatch navigation in Step 5 when the IE component wires
//           // the onNavigate callback.
//         </div>
//       )
//     }
//
//   --- ResumePage.tsx ---
//   Stub for the resume document viewer (Phase 3 renders a real PDF).
//
//     export function ResumePage() {
//       return (
//         <div className={styles.resumePage}>
//           // TODO: render a placeholder document frame with:
//           // - A heading "Resume"
//           // - A grey rectangle placeholder where the PDF will render
//           // - A note: "PDF viewer coming in Phase 3"
//           // - Optionally, a "Download Resume" button (non-functional stub)
//         </div>
//       )
//     }
//
//   --- ProjectsPage.tsx ---
//   Stub for the project card grid (Phase 3 renders live Supabase data).
//
//     export function ProjectsPage() {
//       return (
//         <div className={styles.projectsPage}>
//           // TODO: render a stub card grid with 3-4 placeholder cards.
//           // Each card: grey thumbnail placeholder, title, short description,
//           // tech stack tags.
//           // Layout: CSS Grid, 2-3 columns, responsive within the window.
//           // Note inline: "Live project data from Supabase in Phase 3"
//         </div>
//       )
//     }
//
//   --- ExternalLinkPage.tsx ---
//   Card for external URLs (GitHub, LinkedIn, Source Code).
//
//     interface ExternalLinkPageProps {
//       title: string
//       url: string
//     }
//
//     export function ExternalLinkPage({ title, url }: ExternalLinkPageProps) {
//       return (
//         <div className={styles.externalLinkPage}>
//           // TODO: render a centered card with:
//           // - The link title
//           // - The URL displayed
//           // - A button "Open in new tab" that calls window.open(url, '_blank', 'noopener')
//           //   (the third arg prevents the opened page from accessing window.opener)
//           // - A note: "External links open outside the portfolio"
//         </div>
//       )
//     }
//
//   --- pages/index.ts ---
//   Barrel export:
//     export { HomePage } from './HomePage'
//     export { ResumePage } from './ResumePage'
//     export { ProjectsPage } from './ProjectsPage'
//     export { ExternalLinkPage } from './ExternalLinkPage'
//
//   Create corresponding *.module.css files for each page component.
//   Use --ie-content-bg as the page background. All layout values via
//   design tokens.
```

### Step 3 — IE navigation hook: `src/components/screens/desktop/InternetExplorer/useIENavigation.ts`

```tsx
// TODO: [Action Required: build the browser history state machine] - 15 min
//
//   A custom hook that manages the IE window's navigation stack.
//   Each IE window instance gets its own independent history.
//
//   1. Interface:
//
//        interface UseIENavigationReturn {
//          currentUrl: string
//          canGoBack: boolean
//          canGoForward: boolean
//          navigate: (url: string) => void
//          goBack: () => void
//          goForward: () => void
//        }
//
//   2. Implementation:
//
//        export function useIENavigation(initialRoute: string): UseIENavigationReturn {
//          const [historyStack, setHistoryStack] = useState<string[]>([initialRoute])
//          const [historyIndex, setHistoryIndex] = useState(0)
//
//          const currentUrl = historyStack[historyIndex]
//          const canGoBack = historyIndex > 0
//          const canGoForward = historyIndex < historyStack.length - 1
//
//          // Navigate: push new URL, truncate any forward entries
//          const navigate = useCallback((url: string) => {
//            setHistoryStack((prev) => [...prev.slice(0, historyIndex + 1), url])
//            setHistoryIndex((prev) => prev + 1)
//          }, [historyIndex])
//
//          // Back: decrement index (don't modify the stack)
//          const goBack = useCallback(() => {
//            if (canGoBack) {
//              setHistoryIndex((prev) => prev - 1)
//            }
//          }, [canGoBack])
//
//          // Forward: increment index (don't modify the stack)
//          const goForward = useCallback(() => {
//            if (canGoForward) {
//              setHistoryIndex((prev) => prev + 1)
//            }
//          }, [canGoForward])
//
//          return { currentUrl, canGoBack, canGoForward, navigate, goBack, goForward }
//        }
//
//   IMPORTANT — stale closure on `navigate`:
//      The `navigate` callback captures `historyIndex` in its closure.
//      If the user clicks two links in rapid succession before React
//      re-renders, the second navigate uses a stale index. Fix: use
//      functional updates for BOTH setHistoryStack and setHistoryIndex
//      that derive from the previous state, not from the closed-over
//      index. Alternatively, use useReducer — the reducer always sees
//      the latest state.
//
//      Recommended: useReducer for correctness:
//
//        type NavAction =
//          | { type: 'navigate'; url: string }
//          | { type: 'back' }
//          | { type: 'forward' }
//
//        interface NavState {
//          stack: string[]
//          index: number
//        }
//
//        function navReducer(state: NavState, action: NavAction): NavState {
//          switch (action.type) {
//            case 'navigate':
//              return {
//                stack: [...state.stack.slice(0, state.index + 1), action.url],
//                index: state.index + 1,
//              }
//            case 'back':
//              return state.index > 0
//                ? { ...state, index: state.index - 1 }
//                : state
//            case 'forward':
//              return state.index < state.stack.length - 1
//                ? { ...state, index: state.index + 1 }
//                : state
//          }
//        }
//
//      Then the hook becomes:
//
//        const [state, dispatch] = useReducer(navReducer, {
//          stack: [initialRoute], index: 0
//        })
//        const navigate = useCallback((url: string) =>
//          dispatch({ type: 'navigate', url }), [])
//        const goBack = useCallback(() =>
//          dispatch({ type: 'back' }), [])
//        const goForward = useCallback(() =>
//          dispatch({ type: 'forward' }), [])
//
//      No stale closures — useReducer always has the latest state.
```

### Step 4 — IE Toolbar component: `src/components/screens/desktop/InternetExplorer/IEToolbar.tsx`

```tsx
// TODO: [Action Required: build the IE toolbar matching the OG reference screenshot] - 25 min
//
//   Visual reference: public/imgs/windows7/assets/internetexplorer_OG.png
//
//   The reference shows this layout (left to right):
//     (●←)  (→)  [🌐 https://oldgoogle.neocities.org/2009/           🔄]
//     large  small    ↑ favicon    address bar URL            refresh ↑
//     blue   blue     from internetexplorer_logo.png          embedded
//     circular        (16px, left edge)                       at right edge
//
//   Key visual details from the reference:
//   - Back button is LARGE and CIRCULAR with a blue gradient — it's the
//     dominant visual element in the toolbar, significantly bigger than forward
//   - Forward button is SMALLER and CIRCULAR — visually paired with back
//     but clearly subordinate in size
//   - Both buttons have white arrow glyphs centered inside
//   - When disabled, both buttons show a desaturated grey gradient
//   - The address bar stretches to fill remaining width
//   - A small favicon sits at the left edge of the address bar
//   - A refresh icon sits at the right edge of the address bar (not a separate button)
//   - No standalone Home button in the navigation area (Home is in the
//     command bar far-right in real IE8; for our purposes, refresh acts
//     as a "go home" action)
//
//   1. Props interface:
//
//        interface IEToolbarProps {
//          currentUrl: string
//          canGoBack: boolean
//          canGoForward: boolean
//          onBack: () => void
//          onForward: () => void
//          onRefresh: () => void
//        }
//
//      Note: onHome is gone — replaced by onRefresh which navigates to
//      about:home (same behavior, different label to match the visual).
//
//   2. Render structure:
//
//        <div className={styles.toolbar} role="toolbar" aria-label="Navigation">
//          <div className={styles.navButtons}>
//            <button
//              className={[styles.backBtn, !canGoBack && styles.disabled]
//                .filter(Boolean).join(' ')}
//              onClick={onBack}
//              disabled={!canGoBack}
//              aria-label="Back"
//              type="button"
//            >
//              <span className={styles.arrow} aria-hidden="true">◀</span>
//            </button>
//            <button
//              className={[styles.fwdBtn, !canGoForward && styles.disabled]
//                .filter(Boolean).join(' ')}
//              onClick={onForward}
//              disabled={!canGoForward}
//              aria-label="Forward"
//              type="button"
//            >
//              <span className={styles.arrow} aria-hidden="true">▶</span>
//            </button>
//          </div>
//
//          <div className={styles.addressBar}>
//            <img
//              className={styles.favicon}
//              src="/imgs/windows7/assets/internetexplorer_logo.png"
//              alt=""
//              aria-hidden="true"
//            />
//            <span className={styles.addressText}>{currentUrl}</span>
//            <button
//              className={styles.refreshBtn}
//              onClick={onRefresh}
//              aria-label="Home"
//              type="button"
//            >
//              <span aria-hidden="true">⟳</span>
//            </button>
//          </div>
//        </div>
//
//      The refresh button inside the address bar uses aria-label="Home"
//      because in our implementation it navigates to about:home. The visual
//      is a refresh icon (⟳) matching the reference, but the semantic
//      action is "go home." This keeps the test queries meaningful:
//      getByRole('button', { name: /home/i }).
//
//   3. Create IEToolbar.module.css:
//
//      .toolbar {
//        display: flex;
//        align-items: center;
//        gap: 6px;
//        padding: var(--ie-toolbar-padding);
//        height: var(--ie-toolbar-height);
//        background: var(--ie-toolbar-bg);
//        border-bottom: var(--ie-toolbar-border);
//      }
//
//      .navButtons {
//        display: flex;
//        align-items: center;
//        gap: 2px;
//        flex-shrink: 0;
//      }
//
//      /* ── Back button: large circular, blue gradient ── */
//
//      .backBtn {
//        width: var(--ie-back-btn-size);
//        height: var(--ie-back-btn-size);
//        border-radius: 50%;
//          ↑ circular, not rounded-rect — matches reference
//        border: var(--ie-back-btn-border);
//        background: var(--ie-back-btn-bg);
//        box-shadow: var(--ie-back-btn-shadow);
//        cursor: pointer;
//        display: flex;
//        align-items: center;
//        justify-content: center;
//        transition: background 0.1s ease;
//      }
//
//      .backBtn:hover:not(:disabled) {
//        background: var(--ie-back-btn-bg-hover);
//      }
//
//      .backBtn:disabled,
//      .backBtn.disabled {
//        background: var(--ie-back-btn-bg-disabled);
//        border-color: rgba(150, 160, 175, 0.4);
//        box-shadow: none;
//        cursor: default;
//      }
//
//      /* ── Forward button: smaller circular, same blue palette ── */
//
//      .fwdBtn {
//        width: var(--ie-fwd-btn-size);
//        height: var(--ie-fwd-btn-size);
//        border-radius: 50%;
//        border: var(--ie-fwd-btn-border);
//        background: var(--ie-fwd-btn-bg);
//        cursor: pointer;
//        display: flex;
//        align-items: center;
//        justify-content: center;
//        transition: background 0.1s ease;
//      }
//
//      .fwdBtn:hover:not(:disabled) {
//        background: var(--ie-fwd-btn-bg-hover);
//      }
//
//      .fwdBtn:disabled,
//      .fwdBtn.disabled {
//        background: var(--ie-fwd-btn-bg-disabled);
//        border-color: rgba(150, 160, 175, 0.4);
//        cursor: default;
//      }
//
//      /* ── Arrow glyphs inside nav buttons ── */
//
//      .arrow {
//        color: var(--ie-back-btn-arrow-color);
//        font-size: 10px;
//        line-height: 1;
//        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
//      }
//
//      .backBtn.disabled .arrow,
//      .fwdBtn.disabled .arrow {
//        color: rgba(255, 255, 255, 0.5);
//      }
//
//      /* ── Address bar ── */
//
//      .addressBar {
//        flex: 1;
//        display: flex;
//        align-items: center;
//        height: var(--ie-address-height);
//        background: var(--ie-address-bg);
//        border: var(--ie-address-border);
//        border-radius: var(--ie-address-radius);
//        padding: 0 2px;
//        overflow: hidden;
//      }
//
//      .favicon {
//        width: var(--ie-address-icon-size);
//        height: var(--ie-address-icon-size);
//        flex-shrink: 0;
//        margin: 0 4px;
//        object-fit: contain;
//      }
//
//      .addressText {
//        flex: 1;
//        font-size: 12px;
//        color: var(--ie-address-text);
//        white-space: nowrap;
//        overflow: hidden;
//        text-overflow: ellipsis;
//        user-select: all;
//      }
//
//      .refreshBtn {
//        width: var(--ie-refresh-size);
//        height: var(--ie-refresh-size);
//        flex-shrink: 0;
//        border: none;
//        background: transparent;
//        color: var(--ie-refresh-color);
//        cursor: pointer;
//        display: flex;
//        align-items: center;
//        justify-content: center;
//        font-size: 12px;
//        border-radius: 2px;
//        transition: color 0.1s ease;
//      }
//
//      .refreshBtn:hover {
//        color: var(--ie-refresh-color-hover);
//        background: rgba(0, 0, 0, 0.05);
//      }
```

### Step 5 — Favorites Bar component: `src/components/screens/desktop/InternetExplorer/IEFavoritesBar.tsx`

```tsx
// TODO: [Action Required: build the IE favorites bar matching the OG screenshot] - 15 min
//
//   Visual reference: the OG screenshot shows a thin secondary row below
//   the navigation toolbar with a ☆ icon and bookmark links (e.g. "Google").
//   This is the favorites/bookmarks bar — a signature IE8 visual element.
//
//   In our implementation, the favorites bar holds quick-link bookmarks
//   to the IE route registry entries: Resume, Projects, GitHub, LinkedIn,
//   Source Code. This makes navigation discoverable without requiring
//   users to visit the home page first.
//
//   1. Props interface:
//
//        interface IEFavoritesBarProps {
//          onNavigate: (url: string) => void
//        }
//
//   2. Build the bookmark entries from the route registry:
//
//        const bookmarks = Object.values(IE_ROUTES).filter(
//          (route) => route.url !== DEFAULT_ROUTE
//        )
//
//      This excludes about:home (users don't bookmark the home page).
//
//   3. Render structure:
//
//        <div className={styles.favoritesBar} role="toolbar" aria-label="Favorites">
//          <span className={styles.star} aria-hidden="true">★</span>
//          {bookmarks.map((route) => (
//            <button
//              key={route.url}
//              className={styles.bookmark}
//              onClick={() => onNavigate(route.url)}
//              type="button"
//            >
//              {route.title}
//            </button>
//          ))}
//        </div>
//
//   4. Create IEFavoritesBar.module.css:
//
//      .favoritesBar {
//        display: flex;
//        align-items: center;
//        gap: 2px;
//        height: var(--ie-favbar-height);
//        background: var(--ie-favbar-bg);
//        border-bottom: var(--ie-favbar-border);
//        padding: 0 6px;
//        overflow: hidden;
//      }
//
//      .star {
//        color: var(--ie-favbar-star-color);
//        font-size: 12px;
//        margin-right: 4px;
//        flex-shrink: 0;
//      }
//
//      .bookmark {
//        border: none;
//        background: transparent;
//        color: var(--ie-favbar-link-color);
//        font-size: 11px;
//        padding: 2px 6px;
//        cursor: pointer;
//        border-radius: var(--ie-favbar-link-radius);
//        white-space: nowrap;
//        transition: background 0.1s ease;
//      }
//
//      .bookmark:hover {
//        background: var(--ie-favbar-link-hover-bg);
//      }
```

### Step 6 — InternetExplorerWindow composition: `src/components/screens/desktop/InternetExplorer/InternetExplorerWindow.tsx`

```tsx
// TODO: [Action Required: compose the IE window content component] - 20 min
//
//   This is the content component rendered INSIDE <WindowWrapper> for
//   windows with kind === 'internet-explorer'. It owns the toolbar and
//   the content area, using the navigation hook for state.
//
//   1. Props interface:
//
//        export interface InternetExplorerWindowProps {
//          initialRoute?: string
//        }
//
//   2. Wire the navigation hook:
//
//        const nav = useIENavigation(initialRoute ?? DEFAULT_ROUTE)
//        const route = resolveRoute(nav.currentUrl)
//
//   3. Render the content based on route type:
//
//        function renderContent() {
//          if (!route) {
//            return <div>Page not found: {nav.currentUrl}</div>
//          }
//
//          if (route.type === 'external') {
//            return (
//              <ExternalLinkPage
//                title={route.title}
//                url={route.externalUrl!}
//              />
//            )
//          }
//
//          switch (nav.currentUrl) {
//            case 'about:home':
//              return <HomePage />
//            case 'portfolio://resume':
//              return <ResumePage />
//            case 'portfolio://projects':
//              return <ProjectsPage />
//            default:
//              return <div>Page not found: {nav.currentUrl}</div>
//          }
//        }
//
//   4. Compose (note: IEFavoritesBar added between toolbar and content):
//
//        return (
//          <div className={styles.ieWindow}>
//            <IEToolbar
//              currentUrl={nav.currentUrl}
//              canGoBack={nav.canGoBack}
//              canGoForward={nav.canGoForward}
//              onBack={nav.goBack}
//              onForward={nav.goForward}
//              onRefresh={() => nav.navigate(DEFAULT_ROUTE)}
//            />
//            <IEFavoritesBar onNavigate={nav.navigate} />
//            <div className={styles.content}>
//              {renderContent()}
//            </div>
//          </div>
//        )
//
//      The three-row layout matches the OG reference screenshot:
//        Row 1: IEToolbar   — nav buttons + address bar
//        Row 2: IEFavoritesBar — bookmark links
//        Row 3: Content     — page content (flex: 1, scrollable)
//
//   5. HomePage needs an onNavigate callback to make its quick-link
//      tiles work. Pass nav.navigate down via props or use a React
//      context. Props are simpler for this scope:
//
//        <HomePage onNavigate={nav.navigate} />
//
//   6. Create InternetExplorerWindow.module.css:
//
//      .ieWindow {
//        display: flex;
//        flex-direction: column;
//        height: 100%;
//        overflow: hidden;
//      }
//
//      .content {
//        flex: 1;
//        overflow-y: auto;
//        background: var(--ie-content-bg);
//      }
```

### Step 7 — Barrel export: `src/components/screens/desktop/InternetExplorer/index.ts`

```tsx
// TODO: [Action Required: create the barrel export] - 2 min
//
//   export { InternetExplorerWindow } from './InternetExplorerWindow'
//   export type { InternetExplorerWindowProps } from './InternetExplorerWindow'
//   export { IE_ROUTES, DEFAULT_ROUTE, resolveRoute, titleToRoute } from './ieRoutes'
```

### Step 8 — RTL tests: `src/components/screens/desktop/InternetExplorer/InternetExplorer.test.tsx`

```tsx
// TODO: [Action Required: write RTL tests for IE component] - 25 min
//
//   Use renderWithProviders from '@/test-utils'. The IE component does
//   NOT need Redux state (no window data) — it's a content component.
//   But renderWithProviders is still needed for the provider tree.
//
//   describe('InternetExplorerWindow')
//
//     it('renders the toolbar with navigation buttons')
//       - Render <InternetExplorerWindow />
//       - screen.getByRole('toolbar', { name: /navigation/i })
//       - screen.getByRole('button', { name: /back/i })
//       - screen.getByRole('button', { name: /forward/i })
//       - screen.getByRole('button', { name: /home/i }) (the refresh button)
//
//     it('renders the favorites bar with bookmark links')
//       - Render <InternetExplorerWindow />
//       - screen.getByRole('toolbar', { name: /favorites/i })
//       - Assert bookmark buttons: Resume, Projects, GitHub, LinkedIn, Source Code
//       - Assert no "about:home" bookmark (home page excluded from favorites)
//
//     it('renders the IE favicon in the address bar')
//       - Render <InternetExplorerWindow />
//       - Assert: img with src containing 'internetexplorer_logo.png' is present
//
//     it('back button is large circular (visual regression baseline)')
//       - Render <InternetExplorerWindow />
//       - Assert back button exists and forward button exists
//       - (Visual sizing verified in Storybook, not in jsdom RTL tests)
//
//     it('starts on about:home by default')
//       - Render <InternetExplorerWindow />
//       - screen.getByText('about:home') (in the address bar)
//
//     it('starts on the specified initialRoute')
//       - Render <InternetExplorerWindow initialRoute="portfolio://resume" />
//       - screen.getByText('portfolio://resume')
//
//     it('back button is disabled on initial page')
//       - Render <InternetExplorerWindow />
//       - expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
//
//     it('forward button is disabled when no forward history')
//       - Render <InternetExplorerWindow />
//       - expect(screen.getByRole('button', { name: /forward/i })).toBeDisabled()
//
//   describe('InternetExplorerWindow — navigation')
//
//     it('navigating enables the back button')
//       - Render <InternetExplorerWindow />
//       - Navigate to a page (click a link on the home page, or find
//         another way to trigger nav.navigate)
//       - expect(back button).not.toBeDisabled()
//
//     it('back button returns to previous page')
//       - Render with initialRoute, navigate to another page
//       - Click back
//       - Assert address bar shows the previous URL
//
//     it('forward button works after going back')
//       - Navigate forward, go back, then go forward
//       - Assert the address bar returns to the page you navigated to
//
//     it('refresh/home button navigates to about:home')
//       - Start on a non-home route (initialRoute="portfolio://resume")
//       - Click the refresh button (aria-label="Home")
//       - Assert address bar shows 'about:home'
//
//     it('clicking a favorites bar bookmark navigates to that route')
//       - Render <InternetExplorerWindow />
//       - Click the "Resume" bookmark button in the favorites bar
//       - Assert address bar shows 'portfolio://resume'
//       - Assert back button is now enabled
//
//   describe('InternetExplorerWindow — page rendering')
//
//     it('renders ExternalLinkPage for external routes')
//       - Render with an external route as initialRoute
//       - Assert: "Open in new tab" button is present
//
//     it('renders ResumePage for portfolio://resume')
//       - Render with initialRoute="portfolio://resume"
//       - Assert some resume-specific content is in the document
//
//     it('renders ProjectsPage for portfolio://projects')
//       - Render with initialRoute="portfolio://projects"
//       - Assert some projects-specific content is in the document
//
//   describe('useIENavigation')
//
//     Test the hook directly with renderHook:
//
//     it('initializes with the given route')
//     it('navigate pushes a new entry and truncates forward history')
//     it('goBack decrements index without modifying stack')
//     it('goForward increments index without modifying stack')
//     it('goBack is no-op at index 0')
//     it('goForward is no-op at end of stack')
```

### Step 9 — Storybook stories: `src/components/screens/desktop/InternetExplorer/InternetExplorer.stories.tsx`

```tsx
// TODO: [Action Required: write Storybook stories for IE window] - 15 min
//
//   Stories to cover (per task spec):
//
//   1. Home — default about:home page
//      Render <InternetExplorerWindow /> with no props.
//      Shows the home page with quick-link tiles.
//
//   2. Resume — starts on the resume route
//      Render <InternetExplorerWindow initialRoute="portfolio://resume" />
//      Shows the resume stub page.
//
//   3. Projects — starts on the projects route
//      Render <InternetExplorerWindow initialRoute="portfolio://projects" />
//      Shows the project card grid stub.
//
//   4. ExternalLink — shows an external link card
//      Render with an external route URL as initialRoute.
//      Shows the external link card with "Open in new tab."
//
//   5. BackDisabled — back button disabled on first page
//      Same as Home. The doc notes that back is disabled.
//
//   6. ForwardEnabled — demonstrates forward after back
//      Use a play function to navigate forward, then back,
//      showing that forward is now enabled:
//
//        play: async ({ canvasElement }) => {
//          // navigate to resume, then go back, showing forward is enabled
//        }
//
//   Meta setup:
//     - title: 'Desktop/InternetExplorer'
//     - component: InternetExplorerWindow
//     - parameters: { layout: 'centered' }
//     - Decorator: Provider with setupStore (IE doesn't read Redux
//       but needs the provider tree for renderWithProviders compat).
//       Wrap in a fixed-size container (e.g., 800x500) to simulate
//       the window body dimensions.
```

---

## File Inventory

| File                                                                                | Type                                                                   | New/Modified |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------ |
| `src/app/globals.css`                                                               | IE design tokens in `:root` (back/fwd/address/favbar/refresh)          | Modified     |
| `src/components/screens/desktop/InternetExplorer/ieRoutes.ts`                       | Typed route registry + helpers + IE_TITLE_SUFFIX                       | New          |
| `src/components/screens/desktop/InternetExplorer/useIENavigation.ts`                | Navigation history hook (useReducer)                                   | New          |
| `src/components/screens/desktop/InternetExplorer/IEToolbar.tsx`                     | Large circular back + small forward + address bar w/ favicon + refresh | New          |
| `src/components/screens/desktop/InternetExplorer/IEToolbar.module.css`              | Toolbar styles (asymmetric circular nav buttons, blue gradient)        | New          |
| `src/components/screens/desktop/InternetExplorer/IEFavoritesBar.tsx`                | Bookmark bar with route links                                          | New          |
| `src/components/screens/desktop/InternetExplorer/IEFavoritesBar.module.css`         | Favorites bar styles (star icon, bookmark buttons)                     | New          |
| `src/components/screens/desktop/InternetExplorer/pages/HomePage.tsx`                | about:home stub with quick links                                       | New          |
| `src/components/screens/desktop/InternetExplorer/pages/ResumePage.tsx`              | Resume placeholder (Phase 3 PDF)                                       | New          |
| `src/components/screens/desktop/InternetExplorer/pages/ProjectsPage.tsx`            | Projects stub card grid                                                | New          |
| `src/components/screens/desktop/InternetExplorer/pages/ExternalLinkPage.tsx`        | External link info card                                                | New          |
| `src/components/screens/desktop/InternetExplorer/pages/*.module.css`                | Page-level styles                                                      | New          |
| `src/components/screens/desktop/InternetExplorer/pages/index.ts`                    | Page barrel export                                                     | New          |
| `src/components/screens/desktop/InternetExplorer/InternetExplorerWindow.tsx`        | Composition: toolbar + favbar + content router                         | New          |
| `src/components/screens/desktop/InternetExplorer/InternetExplorerWindow.module.css` | IE window layout                                                       | New          |
| `src/components/screens/desktop/InternetExplorer/index.ts`                          | Barrel export                                                          | New          |
| `src/components/screens/desktop/InternetExplorer/InternetExplorer.test.tsx`         | RTL tests + hook tests                                                 | New          |
| `src/components/screens/desktop/InternetExplorer/InternetExplorer.stories.tsx`      | Storybook stories                                                      | New          |

---

## Validation Checklist

```
## Task 15 — Internet Explorer Component Validation Checklist

| #  | Gate                                                                              | Verified by       | Status     |
| -- | --------------------------------------------------------------------------------- | ----------------- | ---------- |
| 1  | IE design tokens in globals.css (back/fwd/address/favbar/refresh — no magic vals)| code review       | Pending |
| 2  | Route registry covers all 6 pseudo-URLs (home, resume, projects, 3 external)     | code review       | Pending |
| 3  | IE_TITLE_SUFFIX constant exported for "{title} - Windows Internet Explorer"      | code review       | Pending |
| 4  | titleToRoute maps window titles to initial routes                                | unit test         | Pending |
| 5  | resolveRoute returns undefined for unknown URLs                                  | unit test         | Pending |
| 6  | useIENavigation initializes with the given route                                 | unit test         | Pending |
| 7  | navigate pushes and truncates forward history                                    | unit test         | Pending |
| 8  | goBack/goForward respect bounds (no-op at edges)                                 | unit test         | Pending |
| 9  | Back button is large circular with blue gradient (matches OG reference)          | Storybook visual  | Pending |
| 10 | Forward button is smaller circular (asymmetric sizing vs back)                   | Storybook visual  | Pending |
| 11 | IE toolbar renders back, forward, refresh/home buttons                           | RTL test          | Pending |
| 12 | Back button disabled on initial page, enabled after navigation                   | RTL test          | Pending |
| 13 | Forward button disabled at end of stack, enabled after back                      | RTL test          | Pending |
| 14 | Address bar displays current pseudo-URL with IE favicon                          | RTL test          | Pending |
| 15 | IE favicon uses internetexplorer_logo.png from public/imgs                       | code review       | Pending |
| 16 | Refresh button at right edge of address bar navigates to about:home              | RTL test          | Pending |
| 17 | Favorites bar renders bookmark links for all non-home routes                     | RTL test          | Pending |
| 18 | Clicking a favorites bookmark navigates to that route                            | RTL test          | Pending |
| 19 | Internal routes render correct stub page (home, resume, projects)                | RTL test          | Pending |
| 20 | External routes render ExternalLinkPage with "Open in new tab"                   | RTL test          | Pending |
| 21 | ExternalLinkPage calls window.open with noopener                                | RTL test          | Pending |
| 22 | Storybook stories cover home / resume / projects / external / back / forward     | npm run storybook | Pending |
| 23 | No raw color/shadow/blur literals in CSS modules                                 | code review       | Pending |
| 24 | npx vitest run --project unit passes                                             | npx vitest        | Pending |
| 25 | npx eslint --max-warnings=0 clean                                                | npx eslint        | Pending |
| 26 | npm run build clean                                                              | npm run build     | Pending |

Validated by: __________
Validated on: __________
```

---

## Summary

- **Visual fidelity driven by reference screenshot.** The OG reference
  (`public/imgs/windows7/assets/internetexplorer_OG.png`) defines the IE8 chrome layout:
  large circular blue back button, smaller forward button, address bar with IE favicon
  (`internetexplorer_logo.png`) and embedded refresh, favorites bar with bookmark links.
  Every design token and CSS class maps to an observable element in the screenshot.
- **Three architectural layers: route registry, navigation hook, content router.** The route
  registry (`ieRoutes.ts`) is a typed allow-list of pseudo-URLs. The navigation hook
  (`useIENavigation`) manages a history stack with `useReducer` for stale-closure-safe
  state transitions. The content router (`InternetExplorerWindow`) maps the current URL
  to a stub page component via a switch statement.
- **`useReducer` over `useState` for navigation state.** The history stack and index must
  update atomically. With `useState`, rapid navigation calls capture stale `historyIndex`
  in their closures. `useReducer` always sees the latest state — the reducer function
  receives the current state as its first argument, not a closed-over snapshot.
- **Asymmetric nav buttons are the defining IE8 visual.** The back button is large (30px),
  circular, and uses a blue gradient — it's the most prominent toolbar element. The forward
  button is smaller (22px), visually paired but subordinate. Both degrade to a desaturated
  grey gradient when disabled. This asymmetry signals "back is the primary action" — a
  deliberate UX choice from the original IE8 design.
- **Favorites bar provides always-visible navigation.** The OG screenshot shows a secondary
  row with starred bookmark links. This is more discoverable than burying quick-links in
  the home page alone — users can navigate to Resume, Projects, or external links from any
  page without going home first.
- **Window title format: `{title} - Windows Internet Explorer`.** The OG screenshot shows
  "Google - Windows Internet Explorer" in the title bar. The `IE_TITLE_SUFFIX` constant
  standardizes this format; the compositor (Task 16) appends it.
- **External links render info cards, not iframes.** Opening `github.com` inside a fake
  browser would be confusing and insecure. External "routes" render a card with a
  `window.open(url, '_blank', 'noopener')` button. The `noopener` flag prevents the
  opened page from accessing `window.opener`.
- **Interview probe:** "Why not use React Router for IE navigation?" — React Router owns
  the browser's URL bar and history API. Multiple IE windows open simultaneously would
  fight over the same URL. Each IE instance needs its own independent history stack.
  A local `useReducer` gives each window isolated, predictable navigation state without
  conflicting with Next.js's App Router.
