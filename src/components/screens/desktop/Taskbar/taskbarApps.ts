import { assetPaths } from '@/lib/assetPaths'
import type { WindowKind } from '@/store/slices/windowSlice'

/**
 * Taskbar grouping metadata. Open windows are grouped by their `kind`, so the
 * taskbar shows one square icon button per application — the modern-OS
 * "compacting" behavior. Each kind maps to the icon and label that button uses.
 */
export interface TaskbarAppMeta {
  icon: string
  label: string
}

// Folders / unknown kinds fall back to the Windows Explorer icon.
const FALLBACK: TaskbarAppMeta = {
  icon: assetPaths.desktopIcons.windowsExplorer,
  label: 'Window',
}

const KIND_META: Record<WindowKind, TaskbarAppMeta> = {
  'internet-explorer': {
    icon: assetPaths.desktopIcons.internetExplorer,
    label: 'Internet Explorer',
  },
  welcome: {
    icon: assetPaths.desktopIcons.folderWithDocuments,
    label: 'Welcome',
  },
}

export function taskbarAppMeta(kind: WindowKind): TaskbarAppMeta {
  return KIND_META[kind] ?? FALLBACK
}
