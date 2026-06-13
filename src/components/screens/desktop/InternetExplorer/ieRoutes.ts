export type IERouteType = 'internal' | 'external'

export interface IERoute {
  url: string
  title: string
  type: IERouteType
  externalUrl?: string
}

export const IE_TITLE_SUFFIX = ' - Windows Internet Explorer'

export const IE_ROUTES: Record<string, IERoute> = {
  'about:home': {
    url: 'about:home',
    title: 'Internet Explorer',
    type: 'internal',
  },
  'portfolio://resume': {
    url: 'portfolio://resume',
    title: 'Resume',
    type: 'internal',
  },
  'portfolio://projects': {
    url: 'portfolio://projects',
    title: 'Projects',
    type: 'internal',
  },
  'https://github.com/CadeDuncan': {
    url: 'https://github.com/CadeDuncan',
    title: 'GitHub',
    type: 'external',
    externalUrl: 'https://github.com/CadeDuncan',
  },
  'https://linkedin.com/in/cade-duncan': {
    url: 'https://linkedin.com/in/cade-duncan',
    title: 'LinkedIn',
    type: 'external',
    externalUrl: 'https://linkedin.com/in/cade-duncan',
  },
  'https://github.com/CadeDuncan/PortfolioWebsite-Windows7': {
    url: 'https://github.com/CadeDuncan/PortfolioWebsite-Windows7',
    title: 'Source Code',
    type: 'external',
    externalUrl: 'https://github.com/CadeDuncan/PortfolioWebsite-Windows7',
  },
}

export const DEFAULT_ROUTE = 'about:home'

export function resolveRoute(url: string): IERoute | undefined {
  return IE_ROUTES[url]
}

export function titleToRoute(title: string): string {
  const match = Object.values(IE_ROUTES).find((r) => r.title === title)
  return match?.url ?? DEFAULT_ROUTE
}
