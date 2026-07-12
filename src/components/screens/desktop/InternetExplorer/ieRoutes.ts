/**
 * Internet Explorer route registry.
 *
 * Two kinds of entries live here, distinguished by the `redirect` flag:
 *
 * - **Pages** (`redirect: false`) — in-app browser pages rendered inside the IE
 *   window. Each page has a short `nickname` (the value stored in the navigation
 *   history stack and the alias a user can type, e.g. `about:home`), a full
 *   `url` shown in the address bar, and a condensed `title` used in the address
 *   dropdown and the page-links row (`Home`).
 * - **Redirects** (`redirect: true`) — external destinations. Selecting one
 *   opens its real `url` in a new browser tab (via `onOpentab`) while IE itself
 *   navigates to an in-app redirect page (spinner + manual fallback link).
 */

export interface IEPage {
  /** Stored in the history stack and accepted as a typed alias, e.g. `about:home`. */
  nickname: string
  /** Full URL displayed in the address bar, e.g. `https://www.example.com/home`. */
  url: string
  /** Condensed label for the address dropdown + page-links row, e.g. `Home`. */
  title: string
  /** When true, selecting this entry opens `url` in a new browser tab and IE
   *  shows the redirect page instead of rendering in-app content. */
  redirect?: boolean
}

const SITE = 'www.win7webos.com'

export const IE_PAGES: IEPage[] = [
  { nickname: 'about:home', url: `${SITE}/home`, title: 'Home', redirect: false },
  {
    nickname: 'about:source-code',
    url: `https://github.com/CadeDuncan0/win7-web-os`,
    title: 'Source Code',
    redirect: true,
  },
  {
    nickname: 'about:getting-started',
    url: `${SITE}/getting-started`,
    title: 'Getting Started',
    redirect: false,
  },
]

/** Top-level pages only — nested nicknames (subpages, e.g. `about:projects/…`)
 *  stay out of the page-links row and the Home tiles. */
export const IE_TOP_PAGES: IEPage[] = IE_PAGES.filter((page) => !page.nickname.includes('/'))

/** The page IE opens on by default (its nickname). */
export const DEFAULT_ROUTE = IE_PAGES[0].nickname

const PAGES_BY_NICKNAME: Record<string, IEPage> = Object.fromEntries(
  IE_PAGES.map((page) => [page.nickname, page])
)

/** Resolve a nickname (history-stack value) to its page, if any. */
export function resolvePage(nickname: string): IEPage | undefined {
  return PAGES_BY_NICKNAME[nickname]
}

/** Full address-bar URL for a nickname; falls back to the nickname itself. */
export function pageUrl(nickname: string): string {
  return resolvePage(nickname)?.url ?? nickname
}

/**
 * Map a window title (`Home` / `Getting Started`, or the app label
 * `Internet Explorer`) to the nickname IE should open on. Unknown titles open
 * the default page.
 */
export function titleToRoute(title: string): string {
  const match = IE_PAGES.find((page) => page.title === title)
  return match?.nickname ?? DEFAULT_ROUTE
}

/**
 * Filter pages for the address-bar dropdown. An empty query lists every page;
 * otherwise matches against the condensed title, the full URL, or the nickname.
 */
export function filterPages(query: string): IEPage[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return IE_PAGES
  }
  return IE_PAGES.filter(
    (page) =>
      page.title.toLowerCase().includes(q) ||
      page.url.toLowerCase().includes(q) ||
      page.nickname.toLowerCase().includes(q)
  )
}

/**
 * Resolve free-typed address-bar input to a nickname to navigate to. Accepts an
 * exact nickname, an exact full URL, or a case-insensitive title; otherwise
 * returns the first page whose title/url/nickname contains the query, or
 * `undefined` when nothing matches.
 */
export function inputToRoute(input: string): string | undefined {
  const raw = input.trim()
  if (!raw) {
    return undefined
  }
  if (PAGES_BY_NICKNAME[raw]) {
    return raw
  }
  const lower = raw.toLowerCase()
  const exact = IE_PAGES.find(
    (page) => page.url.toLowerCase() === lower || page.title.toLowerCase() === lower
  )
  if (exact) {
    return exact.nickname
  }
  return filterPages(raw)[0]?.nickname
}
