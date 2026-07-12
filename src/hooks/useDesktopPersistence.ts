import { useEffect } from 'react'

import {
  readIconPositions,
  readWindowSizes,
  writeIconPositions,
  writeWindowSizes,
} from '@/lib/desktopPersistence'
import { useAppStore } from '@/store/hooks'
import { hydrateIconPositions, selectIconsById } from '@/store/slices/desktopSlice'
import { hydrateWindowSizes, selectWindowSizes } from '@/store/slices/windowSlice'

/**
 * Desktop-layout persistence. On desktop boot, hydrates the per-kind window
 * sizes and the icon grid positions from their sessionStorage markers, then
 * subscribes to the store and mirrors every later change back. Change
 * detection is by reference identity — Immer replaces exactly the objects a
 * reducer touched, so a stale reference means nothing to write.
 */
export function useDesktopPersistence(): void {
  const store = useAppStore()

  useEffect(() => {
    const savedSizes = readWindowSizes()
    if (savedSizes) {
      store.dispatch(hydrateWindowSizes(savedSizes))
    }
    const savedPositions = readIconPositions()
    if (savedPositions) {
      store.dispatch(hydrateIconPositions(savedPositions))
    }

    let lastSizes = selectWindowSizes(store.getState())
    let lastIcons = selectIconsById(store.getState())
    return store.subscribe(() => {
      const sizes = selectWindowSizes(store.getState())
      if (sizes !== lastSizes) {
        lastSizes = sizes
        writeWindowSizes(sizes)
      }
      const icons = selectIconsById(store.getState())
      if (icons !== lastIcons) {
        lastIcons = icons
        writeIconPositions(
          Object.fromEntries(Object.values(icons).map((icon) => [icon.id, icon.position]))
        )
      }
    })
  }, [store])
}
