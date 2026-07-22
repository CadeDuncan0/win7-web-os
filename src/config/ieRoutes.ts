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
  nickname: string // id
  url: string
  title: string // search dropdown label
  redirect?: boolean // opens in new tab
  disabled?: boolean
}

const SITE = 'www.win7webos.com'

export const IE_PAGES: IEPage[] = [
  { nickname: 'about:home', url: `${SITE}/home`, title: 'Home', redirect: false },
  {
    nickname: 'about:getting-started',
    url: `${SITE}/getting-started`,
    title: 'Getting Started',
    redirect: false,
  },
  {
    nickname: 'about:source-code',
    url: `https://github.com/CadeDuncan0/win7-web-os`,
    title: 'Source Code',
    redirect: true,
    disabled: false,
  },
]

/** Pages a user can actually reach — disabled routes are filtered out once here
 *  so every downstream lookup (resolver, links, tiles, address bar) excludes
 *  them and a disabled route can never be navigated to or rendered. */
export const IE_ENABLED_PAGES: IEPage[] = IE_PAGES.filter((page) => !page.disabled)

/** Top-level enabled pages only — nested nicknames (subpages, e.g.
 *  `about:projects/…`) stay out of the page-links row and the Home tiles. */
export const IE_TOP_PAGES: IEPage[] = IE_ENABLED_PAGES.filter(
  (page) => !page.nickname.includes('/')
)

/** The page IE opens on by default (its nickname). */
export const DEFAULT_ROUTE = IE_ENABLED_PAGES[0].nickname

const PAGES_BY_NICKNAME: Record<string, IEPage> = Object.fromEntries(
  IE_ENABLED_PAGES.map((page) => [page.nickname, page])
)

/** Resolve a nickname (history-stack value) to its page, if any. */
export function resolvePage(nickname: string): IEPage | undefined {
  return PAGES_BY_NICKNAME[nickname]
}

/** Full address-bar URL for a nickname; falls back to the nickname itself. */
export function pageUrl(nickname: string): string {
  return resolvePage(nickname)?.url ?? nickname
}

/** Filter pages for the address-bar dropdown. */
export function filterPages(query: string): IEPage[] {
  const q = query.trim().toLowerCase()
  // list all pages
  if (!q) {
    return IE_ENABLED_PAGES
  }
  return IE_ENABLED_PAGES.filter(
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
  const exact = IE_ENABLED_PAGES.find(
    (page) => page.url.toLowerCase() === lower || page.title.toLowerCase() === lower
  )
  if (exact) {
    return exact.nickname
  }
  return filterPages(raw)[0]?.nickname
}
