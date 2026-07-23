import { useEffect } from 'react'

import {
  persistDesktopIconData,
  persistNotificationData,
  persistOpenWindows,
  persistWindowData,
} from '@/config/persistence'
import {
  type SessionRole,
  readHiddenIcons,
  readIconPositions,
  readOpenNotification,
  readOpenWindows,
  readWindowPositions,
  readWindowSizes,
  readRemovedNotifications,
  writeHiddenIcons,
  writeIconPositions,
  writeOpenNotification,
  writeOpenWindows,
  writeWindowPositions,
  writeWindowSizes,
  writeRemovedNotifications,
} from '@/lib/desktopPersistence'
import { TASKBAR_RESERVE } from '@/lib/gridMath'
import { useAppStore } from '@/store/hooks'
import {
  hydrateHiddenIcons,
  hydrateIconPositions,
  selectHiddenIconIds,
  selectIconsById,
} from '@/store/slices/desktopSlice'
import {
  hydrateOpenNotification,
  hydrateRemovedNotifications,
  selectOpenNotificationId,
  selectRemovedNotificationIds,
} from '@/store/slices/notificationSlice'
import { selectAuthStatus } from '@/store/slices/sessionSlice'
import {
  hydrateOpenWindows,
  hydrateWindowPositions,
  hydrateWindowSizes,
  selectPersistableWindows,
  selectWindowPositions,
  selectWindowSizes,
} from '@/store/slices/windowSlice'

/** The maximize-restore viewport — matches WindowWrapper.getViewport and
 *  gridMath's taskbar-reserve subtraction. Read once at boot for hydration. */
function desktopViewport(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight - TASKBAR_RESERVE }
}

/**
 * Desktop-layout persistence. On desktop boot, hydrates each category of
 * session-stored data — per-kind window sizes/positions, the open-window set,
 * the icon grid positions and hidden icons, and the removed notifications plus
 * open balloon — from its role-scoped sessionStorage markers, then subscribes to
 * the store and mirrors every later change back. Change detection is by
 * reference identity — Immer replaces exactly the objects a reducer touched, so
 * a stale reference means nothing to write.
 *
 * Every category is gated by its per-role flag in config/persistence.ts: a
 * category whose flag is off for the active role is neither hydrated nor
 * written, so it resets each sign-in (clearSession already cleared the slice).
 */
export function useDesktopPersistence(isAdmin: boolean): void {
  const store = useAppStore()

  useEffect(() => {
    const role: SessionRole = isAdmin ? 'admin' : 'guest'

    if (persistWindowData(isAdmin)) {
      const savedSizes = readWindowSizes(role)
      if (savedSizes) {
        store.dispatch(hydrateWindowSizes(savedSizes))
      }
      const savedWindowPositions = readWindowPositions(role)
      if (savedWindowPositions) {
        store.dispatch(hydrateWindowPositions(savedWindowPositions))
      }
    }
    if (persistDesktopIconData(isAdmin)) {
      const savedPositions = readIconPositions(role)
      if (savedPositions) {
        store.dispatch(hydrateIconPositions(savedPositions))
      }
      const savedHidden = readHiddenIcons(role)
      if (savedHidden) {
        store.dispatch(hydrateHiddenIcons(savedHidden))
      }
    }
    if (persistNotificationData(isAdmin)) {
      const savedRemoved = readRemovedNotifications(role)
      if (savedRemoved) {
        store.dispatch(hydrateRemovedNotifications(savedRemoved))
      }
      // After the removed set, so the open hydrator's since-removed guard sees it.
      const savedOpen = readOpenNotification(role)
      if (savedOpen) {
        store.dispatch(hydrateOpenNotification(savedOpen))
      }
    }
    // Last: reopened windows read the size/position maps hydrated above.
    if (persistOpenWindows(isAdmin)) {
      const savedOpenWindows = readOpenWindows(role)
      if (savedOpenWindows && savedOpenWindows.length > 0) {
        store.dispatch(
          hydrateOpenWindows({ windows: savedOpenWindows, viewport: desktopViewport() })
        )
      }
    }

    let lastSizes = selectWindowSizes(store.getState())
    let lastWindowPositions = selectWindowPositions(store.getState())
    let lastOpenWindows = selectPersistableWindows(store.getState())
    let lastIcons = selectIconsById(store.getState())
    let lastHidden = selectHiddenIconIds(store.getState())
    let lastRemoved = selectRemovedNotificationIds(store.getState())
    let lastOpen = selectOpenNotificationId(store.getState())
    return store.subscribe(() => {
      // Only mirror an authenticated session's layout. Sign-out dispatches
      // clearSession — which resets every layout slice AND flips authStatus to
      // 'unauthenticated' in the same tick — while this desktop is still mounted
      // (router.refresh unmounts it only afterward). Without this guard the
      // subscriber would write the reset ({}, []) back over the role's markers,
      // wiping the very layout the next same-role sign-in is meant to restore.
      if (selectAuthStatus(store.getState()) !== 'authenticated') {
        return
      }
      if (persistWindowData(isAdmin)) {
        const sizes = selectWindowSizes(store.getState())
        if (sizes !== lastSizes) {
          lastSizes = sizes
          writeWindowSizes(role, sizes)
        }
        const windowPositions = selectWindowPositions(store.getState())
        if (windowPositions !== lastWindowPositions) {
          lastWindowPositions = windowPositions
          writeWindowPositions(role, windowPositions)
        }
      }
      if (persistOpenWindows(isAdmin)) {
        const openWindows = selectPersistableWindows(store.getState())
        if (openWindows !== lastOpenWindows) {
          lastOpenWindows = openWindows
          writeOpenWindows(role, openWindows)
        }
      }
      if (persistDesktopIconData(isAdmin)) {
        const icons = selectIconsById(store.getState())
        if (icons !== lastIcons) {
          lastIcons = icons
          writeIconPositions(
            role,
            Object.fromEntries(Object.values(icons).map((icon) => [icon.id, icon.position]))
          )
        }
        const hidden = selectHiddenIconIds(store.getState())
        if (hidden !== lastHidden) {
          lastHidden = hidden
          writeHiddenIcons(role, hidden)
        }
      }
      if (persistNotificationData(isAdmin)) {
        const removed = selectRemovedNotificationIds(store.getState())
        if (removed !== lastRemoved) {
          lastRemoved = removed
          writeRemovedNotifications(role, removed)
        }
        const openId = selectOpenNotificationId(store.getState())
        if (openId !== lastOpen) {
          lastOpen = openId
          writeOpenNotification(role, openId)
        }
      }
    })
  }, [store, isAdmin])
}
