'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import styles from './TrayNotifications.module.css'
import { ContextMenu } from '@/components/shell/ContextMenu'
import { Balloon } from '@/components/ui/Balloon'
import { ENABLED_NOTIFICATIONS, type NotificationDefinition } from '@/config/notifications'
import { assetPaths, withBasePath } from '@/lib/assetPaths'
import { launchApplication } from '@/lib/launchApplication'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  closeNotification,
  openNotification,
  removeNotification,
  seedNotifications,
  selectOpenNotification,
  selectTrayNotifications,
  type TrayNotification,
} from '@/store/slices/notificationSlice'

/** The OS notification channel: one persistent tray icon per registry
 *  notification, rendered beside the clock. Clicking an icon opens its Win7
 *  balloon above the tray; nothing auto-opens and nothing auto-dismisses —
 *  the balloon closes on ✕, the action link, another notification, or an
 *  outside click, and the icon survives closing. Right-click offers "Remove
 *  notification", which retires the icon (persisted for the session). */

const DEFAULT_ICON = assetPaths.systemIcons.info

function toTrayNotification(definition: NotificationDefinition): TrayNotification {
  return {
    id: definition.id,
    title: definition.title,
    message: definition.message,
    iconSrc: definition.iconSrc,
    actionLabel: definition.action?.label,
    actionAppKey: definition.action?.appKey,
  }
}

export function TrayNotifications() {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(selectTrayNotifications)
  const open = useAppSelector(selectOpenNotification)
  const containerRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null)

  // Seed the registry once at boot (the reducer dedupes by id, so a
  // StrictMode double-mount cannot double-seed).
  useEffect(() => {
    dispatch(seedNotifications(ENABLED_NOTIFICATIONS.map(toTrayNotification)))
  }, [dispatch])

  // Outside click closes the open balloon. The container wraps both the tray
  // icons and the balloon, so clicks on either never count as outside.
  useEffect(() => {
    if (!open) {
      return
    }
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        dispatch(closeNotification())
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open, dispatch])

  function handleAction(notification: TrayNotification) {
    if (notification.actionAppKey) {
      dispatch(launchApplication(notification.actionAppKey))
    }
    dispatch(closeNotification())
  }

  return (
    <div className={styles.tray} ref={containerRef}>
      {notifications.map((notification) => {
        const isOpen = open?.id === notification.id
        return (
          // Relative wrapper so the balloon anchors directly above this icon.
          <div key={notification.id} className={styles.iconWrap}>
            <button
              className={isOpen ? `${styles.trayIcon} ${styles.open}` : styles.trayIcon}
              onClick={() =>
                dispatch(isOpen ? closeNotification() : openNotification({ id: notification.id }))
              }
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ x: e.clientX, y: e.clientY, id: notification.id })
              }}
              aria-label={notification.title}
              aria-expanded={isOpen}
              title={notification.title}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.trayIconImage}
                src={withBasePath(notification.iconSrc ?? DEFAULT_ICON)}
                alt=""
                width={16}
                height={16}
                draggable={false}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  className={styles.balloonAnchor}
                  aria-live="polite"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {/* Balloon above the tray icon → tail at its bottom-right
                      ("top-left" positions the 7.css tail: is-top = tail on the
                      bottom edge, is-left = tail on the right side). */}
                  <Balloon position="top-left" className={styles.balloon}>
                    <button
                      className={styles.close}
                      onClick={() => dispatch(closeNotification())}
                      aria-label="Close notification"
                      title="Close"
                      type="button"
                    >
                      ✕
                    </button>
                    <div className={styles.header}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.headerIcon}
                        src={withBasePath(notification.iconSrc ?? DEFAULT_ICON)}
                        alt=""
                        width={16}
                        height={16}
                        draggable={false}
                      />
                      <span className={styles.title}>{notification.title}</span>
                    </div>
                    <p className={styles.message}>{notification.message}</p>
                    {notification.actionLabel && notification.actionAppKey && (
                      <button
                        className={styles.link}
                        onClick={() => handleAction(notification)}
                        type="button"
                      >
                        {notification.actionLabel}
                      </button>
                    )}
                  </Balloon>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {contextMenu && (
        <ContextMenu
          items={[
            {
              label: 'Remove notification',
              onSelect: () => dispatch(removeNotification({ id: contextMenu.id })),
            },
          ]}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          ariaLabel="Notification context menu"
        />
      )}
    </div>
  )
}
