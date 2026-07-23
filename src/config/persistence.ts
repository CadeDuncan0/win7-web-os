/**
 * Per-role persistence options — the single fork edit point for what a session
 * remembers. Each flag gates one category of session-stored data for one role
 * (guest vs. admin); all live in sessionStorage, namespaced `win7.<role>.*`, and
 * flow through useDesktopPersistence. Flip a flag to false to make that category
 * ephemeral for that role (nothing written, nothing restored on sign-in).
 *
 * Categories:
 *   • WindowData        — per-kind window sizes + positions (a reopened window restores them).
 *   • OpenWindows       — which windows reopen after a same-role sign-in (session restore).
 *   • DesktopIconData   — icon grid positions + which icons are hidden.
 *   • NotificationData  — removed tray items + the open balloon.
 *
 */

export const saveGuestWindowData = true
export const saveAdminWindowData = true

export const saveGuestOpenWindows = true
export const saveAdminOpenWindows = true

export const saveGuestDesktopIconData = true
export const saveAdminDesktopIconData = true

export const saveGuestNotificationData = false
export const saveAdminNotificationData = false

export const persistWindowData = (isAdmin: boolean): boolean =>
  isAdmin ? saveAdminWindowData : saveGuestWindowData

export const persistOpenWindows = (isAdmin: boolean): boolean =>
  isAdmin ? saveAdminOpenWindows : saveGuestOpenWindows

export const persistDesktopIconData = (isAdmin: boolean): boolean =>
  isAdmin ? saveAdminDesktopIconData : saveGuestDesktopIconData

export const persistNotificationData = (isAdmin: boolean): boolean =>
  isAdmin ? saveAdminNotificationData : saveGuestNotificationData
