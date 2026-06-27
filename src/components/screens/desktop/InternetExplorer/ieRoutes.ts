/**
 * Internet Explorer route registry.
 *
 * Two kinds of destinations live here:
 *
 * - **Pages** — in-app browser pages rendered inside the IE window. Each page
 *   has a short `nickname` (the value stored in the navigation history stack and
 *   the alias a user can type, e.g. `about:home`), a full `url` shown in the
 *   address bar (`https://www.cadeduncan.com/home`), and a condensed `title`
 *   used in the address dropdown and the page-links row (`Home`).
 * - **External links** — GitHub / LinkedIn / Source Code. These are *not*
 *   navigable IE pages; clicking one opens a new browser tab straight to its
 *   `url`. They have no in-app route and never appear in the address bar.
 */

export interface IEPage {
  /** Stored in the history stack and accepted as a typed alias, e.g. `about:home`. */
  nickname: string
  /** Full URL displayed in the address bar, e.g. `https://www.cadeduncan.com/home`. */
  url: string
  /** Condensed label for the address dropdown + page-links row, e.g. `Home`. */
  title: string
}

export interface IEExternalLink {
  title: string
  /** Destination opened directly in a new browser tab. */
  url: string
}

const SITE = 'https://www.cadeduncan.com'

export const IE_PAGES: IEPage[] = [
  { nickname: 'about:home', url: `${SITE}/home`, title: 'Home' },
  { nickname: 'portfolio://projects', url: `${SITE}/portfolio/projects`, title: 'Projects' },
  { nickname: 'portfolio://resume', url: `${SITE}/portfolio/resume`, title: 'Resume' },
]

export const IE_EXTERNAL_LINKS: IEExternalLink[] = [
  { title: 'GitHub', url: 'https://github.com/CadeDuncan' },
  { title: 'LinkedIn', url: 'https://linkedin.com/in/cade-duncan' },
  { title: 'Source Code', url: 'https://github.com/CadeDuncan/PortfolioWebsite-Windows7' },
]

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
 * Map a window title (`Home` / `Projects` / `Resume`, or the app label
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
