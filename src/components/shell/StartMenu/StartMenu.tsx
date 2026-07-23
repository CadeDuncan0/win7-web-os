'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import styles from './StartMenu.module.css'
import { StartMenuItem } from './StartMenuItem'
import { Button } from '@/components/ui/Button/index'
import { startMenuApps } from '@/config/applications'
import { withBasePath } from '@/lib/assetPaths'
import { signOut } from '@/lib/auth'
import { launchApplication } from '@/lib/launchApplication'
import { DEFAULT_USER_ICON } from '@/lib/userIcons'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearSession, selectAvatar, selectIsAdmin } from '@/store/slices/sessionSlice'

/** Aero glass Start Menu panel. Controlled by parent via isOpen/onClose — the Taskbar owns the toggle state.
 *  Search filters the left column only; right column shortcuts remain fixed. */

export interface StartMenuProps {
  isOpen: boolean
  onClose: () => void
  avatarSrc?: string // Optional override (stories); defaults to the session avatar
}

export function StartMenu({ isOpen, onClose, avatarSrc }: StartMenuProps) {
  const dispatch = useAppDispatch()
  const sessionAvatar = useAppSelector(selectAvatar)
  // Shortcuts flagged hideForGuest are dropped entirely for guest sessions —
  // guests cannot see or open them. The menu mounts on click, well after the
  // session rehydrates, so reading the store role here cannot flash.
  const isAdmin = useAppSelector(selectIsAdmin)
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Resets search state before closing so the menu opens clean next time
  const handleClose = useCallback(() => {
    setSearchQuery('')
    onClose()
  }, [onClose])

  // Shortcuts split by their registry column: left is the white programs
  // list, right is the glass quick-links column (e.g. external-link apps).
  const visibleApps = useMemo(() => startMenuApps(isAdmin), [isAdmin])
  const visibleLeft = useMemo(
    () => visibleApps.filter((app) => (app.startMenuColumn ?? 'left') === 'left'),
    [visibleApps]
  )
  const visibleRight = useMemo(
    () => visibleApps.filter((app) => app.startMenuColumn === 'right'),
    [visibleApps]
  )

  const filteredLeft = useMemo(() => {
    if (!searchQuery.trim()) {
      return visibleLeft
    }
    const q = searchQuery.toLowerCase()
    return visibleLeft.filter((app) => app.title.toLowerCase().includes(q))
  }, [searchQuery, visibleLeft])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, handleClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  // Deferred focus — requestAnimationFrame lets Framer Motion mount the panel first
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => searchRef.current?.focus())
    }
  }, [isOpen])

  // WAI-ARIA roving tabindex: Arrow keys cycle focus through menuitems
  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const items = panelRef.current?.querySelectorAll('[role="menuitem"]')
    if (!items?.length) {
      return
    }

    const focusedIndex = Array.from(items).indexOf(document.activeElement as Element)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0
      ;(items[next] as HTMLElement).focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (focusedIndex > 0) {
        ;(items[focusedIndex - 1] as HTMLElement).focus()
      } else {
        searchRef.current?.focus()
      }
    }
    if (e.key === 'Home') {
      e.preventDefault()
      ;(items[0] as HTMLElement).focus()
    }
    if (e.key === 'End') {
      e.preventDefault()
      ;(items[items.length - 1] as HTMLElement).focus()
    }
  }

  // Windowed apps open their window; windowless link apps open their external
  // destination — the launch gate decides, so both columns share this handler.
  function handleLaunch(key: string) {
    handleClose()
    dispatch(launchApplication(key))
  }

  async function handleSignOut() {
    handleClose()
    await signOut()
    dispatch(clearSession())
    // Cookies are gone — refresh so the server re-renders this same URL as
    // the logon screen (at /win7/desktop the proxy redirects to /win7).
    router.refresh()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className={styles.panel}
          role="menu"
          aria-label="Start menu"
          onKeyDown={handleMenuKeyDown}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className={styles.leftColumn}>
            <ul className={styles.shortcutList}>
              {filteredLeft.map((app) => (
                <StartMenuItem
                  key={app.key}
                  iconSrc={app.iconSrc}
                  label={app.title}
                  onClick={() => handleLaunch(app.key)}
                />
              ))}
              {filteredLeft.length === 0 && <li className={styles.emptyMessage}>No matches</li>}
            </ul>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.avatarHeader}>
              <div className={styles.avatarFrame}>
                {/* unoptimized bypasses the basePath-aware image loader, so
                    the subpath prefix must be applied to the raw src by hand. */}
                <Image
                  className={styles.avatarImage}
                  src={withBasePath(avatarSrc ?? sessionAvatar ?? DEFAULT_USER_ICON)}
                  alt="User avatar"
                  width={48}
                  height={48}
                  unoptimized
                />
              </div>
            </div>

            <ul className={styles.shortcutList}>
              {visibleRight.map((app) => (
                <StartMenuItem
                  key={app.key}
                  label={app.title}
                  onClick={() => handleLaunch(app.key)}
                />
              ))}
            </ul>

            <Button
              aria-label="Sign Out"
              className={styles.signOut}
              // Sign Out is an action inside role="menu" — expose it as a
              // menuitem (with roving tabindex) so it matches the shortcuts and
              // is reachable by the arrow-key handler, not orphaned as a button.
              role="menuitem"
              tabIndex={-1}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>

          <div className={styles.searchBar}>
            <input
              ref={searchRef}
              className={styles.searchInput}
              type="text"
              placeholder="Search programs and files"
              aria-label="Search programs and files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  e.stopPropagation() // Prevent panel's handleMenuKeyDown from double-advancing
                  const firstItem = panelRef.current?.querySelector(
                    '[role="menuitem"]'
                  ) as HTMLElement
                  firstItem?.focus()
                }
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
