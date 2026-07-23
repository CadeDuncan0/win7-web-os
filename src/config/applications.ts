/**
 * Application registry — the single fork edit point for everything launchable.
 */
import { internetExplorerApp } from '@/components/apps/InternetExplorer'
import type { WindowApp } from '@/components/apps/types'
import { welcomeApp } from '@/components/apps/WelcomeWindow'
import { assetPaths } from '@/lib/assetPaths'
import type { WindowKind } from '@/store/slices/windowSlice'

export interface Application {
  key: string
  title: string
  component?: WindowApp
  iconSrc?: string
  defaultSize?: { width: number; height: number }
  disabled?: boolean
  desktopIcon?: boolean
  startMenuShortcut?: boolean
  startMenuColumn?: 'left' | 'right'
  hideForAdmin?: boolean
  hideForGuest?: boolean
  ieRoute?: string
}

export const APPLICATIONS = [
  {
    key: 'internet-explorer',
    title: 'Internet Explorer',
    component: internetExplorerApp,
    iconSrc: assetPaths.desktopIcons.internetExplorer,
  },
  {
    key: 'welcome',
    title: 'Welcome',
    component: welcomeApp,
    iconSrc: assetPaths.desktopIcons.folderWithDocuments,
  },
  {
    key: 'getting-started',
    title: 'Getting Started',
    component: internetExplorerApp,
    iconSrc: assetPaths.desktopIcons.folderWithDocuments,
    ieRoute: 'about:getting-started',
  },
  {
    // Windowless application (no `component`): an external link. Launching it opens
    // the GitHub repository in a new tab through the same gate as every other
    // launcher; the destination URL lives on the 'about:source-code' redirect
    // entry in ieRoutes.ts, and disabling either side retires it everywhere.
    key: 'source-code',
    title: 'Source Code',
    desktopIcon: false,
    startMenuColumn: 'right',
    ieRoute: 'about:source-code',
  },
] as const satisfies readonly Application[]

/**
 * The single application id space, derived from the records above — adding a
 * record IS adding its key; launchers, notifications, and the launch gate all
 * type against this union, so a mistyped key is a compile error.
 */
export type WindowKey = (typeof APPLICATIONS)[number]['key']

/** Fallback launcher icon for records that omit `iconSrc`. */
export const DEFAULT_APP_ICON = assetPaths.desktopIcons.windowsExplorer

// ─── Derivations ────────────────────────────────────────────────────────────
// Everything below is computed from APPLICATIONS — forks edit the records
// above and never touch these.

// Widened, interface-typed view of the records for the helpers below (the
// literal record types exist only so WindowKey can derive from them).
const ALL_APPS: readonly Application[] = APPLICATIONS

const APPS_BY_KEY: Record<string, Application> = Object.fromEntries(
  ALL_APPS.map((app) => [app.key, app])
)

/** Resolve an application key (e.g. a window's stored `appKey`) to its record. */
export function applicationByKey(key: string): Application | undefined {
  return APPS_BY_KEY[key]
}

/** True when this app is invisible to the current role: retired site-wide via
 *  `disabled`, or hidden from the session's role. Guest is the complement of
 *  admin (assume guest whenever !isAdmin), so it needs no separate flag. */
export function isApplicationHidden(app: Application, isAdmin: boolean): boolean {
  return Boolean(app.disabled) || (isAdmin ? Boolean(app.hideForAdmin) : Boolean(app.hideForGuest))
}

/** Apps that render a desktop icon for this role, in registry order. */
export function desktopIconApps(isAdmin: boolean): Application[] {
  return ALL_APPS.filter((app) => app.desktopIcon !== false && !isApplicationHidden(app, isAdmin))
}

/** Apps that render a Start Menu shortcut for this role, in registry order.
 *  The menu splits them by `startMenuColumn` (default 'left'). */
export function startMenuApps(isAdmin: boolean): Application[] {
  return ALL_APPS.filter(
    (app) => app.startMenuShortcut !== false && !isApplicationHidden(app, isAdmin)
  )
}

/** Desktop-icon facet id scaffolded from the application key — the id the
 *  desktop slice tracks grid cells under. */
export function desktopIconId(key: string): string {
  return `desktop-icon-${key}`
}

/**
 * Taskbar grouping metadata. Open windows are grouped by their `kind`, so the
 * taskbar shows one square icon button per application — the modern-OS
 * "compacting" behavior. The first registry app of a kind provides the icon
 * and label; unknown kinds fall back to the Windows Explorer icon.
 */
export interface TaskbarAppMeta {
  icon: string
  label: string
}

const TASKBAR_FALLBACK: TaskbarAppMeta = {
  icon: DEFAULT_APP_ICON,
  label: 'Window',
}

export function taskbarAppMeta(kind: WindowKind): TaskbarAppMeta {
  const app = ALL_APPS.find((a) => a.component?.kind === kind)
  return app ? { icon: app.iconSrc ?? DEFAULT_APP_ICON, label: app.title } : TASKBAR_FALLBACK
}
