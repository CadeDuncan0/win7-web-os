'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

import { signInAsAdmin, signOut } from '@/lib/auth'
import { debug } from '@/lib/debug'
import { useAppDispatch } from '@/store/hooks'
import { setSession, clearSession } from '@/store/slices/sessionSlice'

export default function Home() {
  const dispatch = useAppDispatch()

  const TEST_QUERY = gql`
    query Get_Projects {
      projectsCollection(first: 1) {
        edges {
          node {
            title
          }
        }
      }
    }
  `
  const { loading, error, data } = useQuery(TEST_QUERY, { fetchPolicy: 'network-only' })

  debug.log('Pages.tsx:useQuery', { loading, error, data })

  const goGuest = () => dispatch(setSession({ role: 'guest', jwt: null, startedAt: Date.now() }))

  const goAdmin = async () => {
    const password = prompt('Admin password')
    if (password) {
      await signInAsAdmin(password)
    }
  }

  const goSignOut = async () => {
    await signOut()
    dispatch(clearSession())
  }

  // Iconic Aero "Harmony" wallpaper — bright radial bloom on the canonical
  // #0078D7 base. Uses raw rgba/hex because this is a temporary demo
  // surface; the production desktop will live in a CSS Module that
  // consumes a future --surface-desktop-wallpaper semantic token.
  const wallpaper = `
    radial-gradient(ellipse 55% 40% at 30% 30%, rgba(180, 220, 255, 0.7) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 75% 75%, rgba(94, 174, 253, 0.5) 0%, transparent 65%),
    radial-gradient(circle at 50% 50%, #0078d7 0%, #003399 90%)
  `

  // Text-shadow lifted from the reference — required for white labels on
  // photo wallpaper to remain legible without a background fill.
  const desktopLabelShadow = '1px 1px 2px rgba(0, 0, 0, 0.8)'

  return (
    <main
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: wallpaper,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ────── Desktop Icons (static) ────── */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-5)',
          left: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {[
          { label: 'About Me', glyph: '💻' },
          { label: 'Portfolio', glyph: '📁' },
          { label: 'Resume.txt', glyph: '📄' },
        ].map(({ label, glyph }) => (
          <div
            key={label}
            style={{
              width: 85,
              height: 95,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid transparent',
              color: 'var(--color-neutral-0)',
              font: 'var(--text-body)',
              textAlign: 'center',
              textShadow: desktopLabelShadow,
            }}
          >
            <span style={{ fontSize: 42, lineHeight: 1 }}>{glyph}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* ────── Open Window ────── */}
      <section
        aria-label="Portfolio window"
        style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(640px, calc(100% - var(--space-7)))',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-window-focused)',
          overflow: 'hidden',
          border: '1px solid var(--surface-glass-border)',
        }}
      >
        {/* Title bar — glass aero chrome */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-2) var(--space-3)',
            background: 'var(--surface-glass-tint)',
            backdropFilter: 'blur(var(--surface-glass-blur))',
            WebkitBackdropFilter: 'blur(var(--surface-glass-blur))',
            borderBottom: '1px solid var(--surface-glass-border)',
            boxShadow: 'inset 0 1px 0 var(--surface-glass-highlight)',
            font: 'var(--text-heading)',
            color: 'var(--color-neutral-900)',
          }}
        >
          <span style={{ textShadow: '0 1px 0 rgba(255, 255, 255, 0.6)' }}>
            Portfolio.exe — Welcome
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <button
              type="button"
              aria-label="Minimize"
              style={{
                width: 36,
                height: 22,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.30)',
                border: '1px solid var(--surface-glass-border)',
                color: 'var(--color-neutral-900)',
              }}
            >
              −
            </button>
            <button
              type="button"
              aria-label="Maximize"
              style={{
                width: 36,
                height: 22,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.30)',
                border: '1px solid var(--surface-glass-border)',
                color: 'var(--color-neutral-900)',
              }}
            >
              □
            </button>
            <button
              type="button"
              aria-label="Close"
              style={{
                width: 36,
                height: 22,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(220, 50, 50, 0.65)',
                border: '1px solid rgba(180, 30, 30, 0.7)',
                color: 'var(--color-neutral-0)',
              }}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Window body — opaque white per Aero convention */}
        <div style={{ display: 'flex', height: 360, background: '#ffffff' }}>
          {/* Sidebar — light gray gradient lifted from reference */}
          <aside
            style={{
              width: 180,
              background: 'linear-gradient(to right, #f0f0f0, #e0e0e0)',
              borderRight: '1px solid #b1b1b1',
              padding: 'var(--space-3) 0',
              font: 'var(--text-body)',
            }}
          >
            <ul>
              <li
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: '#cce8ff',
                  fontWeight: 'bold',
                  boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.05)',
                  color: 'var(--color-aero-700)',
                }}
              >
                Overview
              </li>
              <li style={{ padding: 'var(--space-2) var(--space-4)' }}>Skill Set</li>
              <li style={{ padding: 'var(--space-2) var(--space-4)' }}>Contact Details</li>
            </ul>
          </aside>

          {/* Content area */}
          <div
            style={{
              flexGrow: 1,
              padding: 'var(--space-6)',
              overflow: 'auto',
              color: 'var(--color-neutral-900)',
              font: 'var(--text-body)',
            }}
          >
            <h1 style={{ margin: 0, marginBottom: 'var(--space-3)', font: 'var(--text-title)' }}>
              Full Stack Web Developer
            </h1>
            <p style={{ margin: 0, marginBottom: 'var(--space-4)' }}>
              Static Aero Glass smoke test. The window <strong>chrome</strong> is glass
              (backdrop-filter + tint + bevel highlight); the window <strong>body</strong> is opaque
              white per real Win7 convention. Every chrome surface resolves through the semantic
              token layer in <code>globals.css</code>.
            </p>

            <h2 style={{ margin: 0, marginBottom: 'var(--space-2)', font: 'var(--text-heading)' }}>
              Auth Test Controls
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={goGuest}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(to bottom, #fdfdfd, #e6e6e6)',
                  border: '1px solid #b1b1b1',
                  color: 'var(--color-neutral-900)',
                  font: 'var(--text-body)',
                }}
              >
                → Guest
              </button>
              <button
                type="button"
                onClick={goAdmin}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(to bottom, #fdfdfd, #e6e6e6)',
                  border: '1px solid #b1b1b1',
                  color: 'var(--color-neutral-900)',
                  font: 'var(--text-body)',
                }}
              >
                → Admin
              </button>
              <button
                type="button"
                onClick={goSignOut}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(to bottom, #fdfdfd, #e6e6e6)',
                  border: '1px solid #b1b1b1',
                  color: 'var(--color-neutral-900)',
                  font: 'var(--text-body)',
                }}
              >
                → Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ────── Taskbar ────── */}
      <footer
        aria-label="Taskbar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-2)',
          gap: 'var(--space-2)',
          background:
            'linear-gradient(to bottom, rgba(60, 100, 150, 0.80), rgba(20, 40, 70, 0.90))',
          backdropFilter: 'blur(var(--blur-md))',
          WebkitBackdropFilter: 'blur(var(--blur-md))',
          borderTop: '1px solid var(--surface-glass-highlight)',
          color: 'var(--color-neutral-0)',
          font: 'var(--text-body)',
          zIndex: 400, // mirrors --z-taskbar; semantic z-tokens are reserved for the Phase 2 window manager
        }}
      >
        {/* Start orb placeholder */}
        <div
          aria-label="Start"
          style={{
            width: 45,
            height: 36,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, var(--color-aero-300), var(--color-aero-700))`,
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 0 8px rgba(94, 174, 253, 0.6)',
          }}
        />

        {/* Active app indicator */}
        <div
          style={{
            width: 50,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.30)',
            border: '1px solid rgba(255, 255, 255, 0.50)',
            boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.40)',
          }}
        >
          📁
        </div>

        {/* Spacer */}
        <div style={{ flexGrow: 1 }} />

        {/* System tray clock */}
        <div
          style={{
            padding: '0 var(--space-3)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.20)',
            textAlign: 'right',
            lineHeight: 1.2,
          }}
        >
          <div style={{ fontWeight: 'bold' }}>12:00 PM</div>
          <div style={{ fontSize: '10px' }}>04/26/2026</div>
        </div>
      </footer>
    </main>
  )
}
