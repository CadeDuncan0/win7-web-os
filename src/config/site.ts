/**
 * Fork configuration — the single place a fork personalizes the scaffold.
 *
 * Every identity value the OS surfaces (the display domain shown in Internet
 * Explorer's address bar, the external links in the Start Menu and IE home
 * page, the logon-screen branding subtitle) is read from here. Replace the
 * placeholder values below with your own; no other file needs to change.
 *
 * Content registries live next to the components that render them, but each
 * one is a plain data file you can extend the same way:
 *   - Desktop icons        → src/components/screens/desktop/desktopIcons.ts
 *   - Start Menu shortcuts → src/components/screens/desktop/StartMenu/startMenuItems.ts
 *   - IE pages             → src/components/screens/desktop/InternetExplorer/ieRoutes.ts
 */

export interface ExternalLink {
  title: string
  /** Destination opened directly in a new browser tab. */
  url: string
}

export const siteConfig = {
  /** Display-only base URL shown in IE's address bar for in-app pages. */
  siteUrl: 'https://www.example.com',

  /** Subtitle of the "Windows® 7" lockup on the logon and transition screens. */
  osBrandingSubtitle: 'Web OS',

  /** Links surfaced in the Start Menu's right column and the IE home page.
   *  These open in a real new browser tab, not an in-app window. */
  externalLinks: [
    { title: 'GitHub', url: 'https://github.com/your-username' },
    { title: 'LinkedIn', url: 'https://linkedin.com/in/your-profile' },
    { title: 'Source Code', url: 'https://github.com/your-username/win7-web-os' },
  ] as ExternalLink[],
} as const
