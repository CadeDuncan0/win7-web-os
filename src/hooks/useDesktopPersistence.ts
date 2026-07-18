import { useEffect } from 'react'

import {
  readHiddenIcons,
  readIconPositions,
  readOpenNotification,
  readWindowPositions,
  readWindowSizes,
  writeHiddenIcons,
  writeIconPositions,
  writeOpenNotification,
  writeRemovedNotifications,
  writeWindowPositions,
  writeWindowSizes,
} from '@/lib/desktopPersistence'
import { useAppStore } from '@/store/hooks'
import {
  hydrateHiddenIcons,
  hydrateIconPositions,
  selectHiddenIconIds,
  selectIconsById,
} from '@/store/slices/desktopSlice'
import {
  hydrateOpenNotification,
  selectOpenNotificationId,
  selectRemovedNotificationIds,
} from '@/store/slices/notificationSlice'
import {
  hydrateWindowPositions,
  hydrateWindowSizes,
  selectWindowPositions,
  selectWindowSizes,
} from '@/store/slices/windowSlice'

/**
 * Desktop-layout persistence. On desktop boot, hydrates the per-kind window
 * sizes, the per-kind window positions, the icon grid positions, the hidden
 * icons, the removed notifications, and the open balloon from their
 * sessionStorage markers, then subscribes to the store and mirrors every later
 * change back. Change detection is by reference identity — Immer replaces
 * exactly the objects a reducer touched, so a stale reference means nothing to
 * write.
 *
 * Removed notifications are the one exception: they persist only for admins.
 * Guest removals are deliberately kept out of sessionStorage so a reload
 * restores every notification (they reset per page load, not per sign-out).
 */
export function useDesktopPersistence(isAdmin: boolean): void {
  const store = useAppStore()

  useEffect(() => {
    const savedSizes = readWindowSizes()
    if (savedSizes) {
      store.dispatch(hydrateWindowSizes(savedSizes))
    }
    const savedWindowPositions = readWindowPositions()
    if (savedWindowPositions) {
      store.dispatch(hydrateWindowPositions(savedWindowPositions))
    }
    const savedPositions = readIconPositions()
    if (savedPositions) {
      store.dispatch(hydrateIconPositions(savedPositions))
    }
    const savedHidden = readHiddenIcons()
    if (savedHidden) {
      store.dispatch(hydrateHiddenIcons(savedHidden))
    }
    // sets notification persistence (notifications don't reappear on reloads)
    // if (isAdmin) {
    //   const savedRemoved = readRemovedNotifications()
    //   if (savedRemoved) {
    //     store.dispatch(hydrateRemovedNotifications(savedRemoved))
    //   }
    // }
    // After the removed set, so the open hydrator's since-removed guard sees it.
    const savedOpen = readOpenNotification()
    if (savedOpen) {
      store.dispatch(hydrateOpenNotification(savedOpen))
    }

    let lastSizes = selectWindowSizes(store.getState())
    let lastWindowPositions = selectWindowPositions(store.getState())
    let lastIcons = selectIconsById(store.getState())
    let lastHidden = selectHiddenIconIds(store.getState())
    let lastRemoved = selectRemovedNotificationIds(store.getState())
    let lastOpen = selectOpenNotificationId(store.getState())
    return store.subscribe(() => {
      const sizes = selectWindowSizes(store.getState())
      if (sizes !== lastSizes) {
        lastSizes = sizes
        writeWindowSizes(sizes)
      }
      const windowPositions = selectWindowPositions(store.getState())
      if (windowPositions !== lastWindowPositions) {
        lastWindowPositions = windowPositions
        writeWindowPositions(windowPositions)
      }
      const icons = selectIconsById(store.getState())
      if (icons !== lastIcons) {
        lastIcons = icons
        writeIconPositions(
          Object.fromEntries(Object.values(icons).map((icon) => [icon.id, icon.position]))
        )
      }
      const hidden = selectHiddenIconIds(store.getState())
      if (hidden !== lastHidden) {
        lastHidden = hidden
        writeHiddenIcons(hidden)
      }
      if (isAdmin) {
        const removed = selectRemovedNotificationIds(store.getState())
        if (removed !== lastRemoved) {
          lastRemoved = removed
          writeRemovedNotifications(removed)
        }
      }
      const openId = selectOpenNotificationId(store.getState())
      if (openId !== lastOpen) {
        lastOpen = openId
        writeOpenNotification(openId)
      }
    })
  }, [store, isAdmin])
}
