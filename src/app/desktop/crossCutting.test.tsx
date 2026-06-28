// Task 7 — cross-cutting verification of the pre-content /desktop surface.
// Three concerns that live across components, not in one: ARIA roles + names,
// keyboard operability, and Guest/Admin parity. Queries are by role + accessible
// name only (never class/testid for the a11y assertions) so a failure means the
// same thing an assistive technology would experience.

import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import DesktopPage from './page'
import type { RootState } from '@/store'
import { renderWithProviders } from '@/test-utils'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/lib/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}))

const ICON_LABELS = ['Internet Explorer', 'Resume', 'Projects']

// An authenticated session for a given role — the only difference the parity
// pass varies.
function sessionState(role: 'guest' | 'admin'): Partial<RootState> {
  return {
    session: {
      role,
      authStatus: 'authenticated',
      jwt: 'test-token',
      startedAt: 0,
      avatar: null,
    },
  }
}

describe('Cross-cutting · accessible names (ARIA roles + labels)', () => {
  it('exposes role + accessible name for the desktop landmarks and icons', () => {
    renderWithProviders(<DesktopPage />)

    expect(screen.getByRole('main', { name: /desktop/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /taskbar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    for (const label of ICON_LABELS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('exposes accessible names for the IE window chrome once a window is open', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DesktopPage />)

    await act(async () => {
      await user.dblClick(screen.getByRole('button', { name: 'Internet Explorer' }))
    })

    const windowEl = screen.getByTestId('managed-window-win-1')
    expect(within(windowEl).getByRole('button', { name: 'Minimize' })).toBeInTheDocument()
    expect(within(windowEl).getByRole('button', { name: 'Maximize' })).toBeInTheDocument()
    expect(within(windowEl).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(within(windowEl).getByRole('combobox', { name: /address/i })).toBeInTheDocument()
  })
})

describe('Cross-cutting · keyboard operability', () => {
  it('opens an icon’s window when it is focused and Enter is pressed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DesktopPage />)

    const ieIcon = screen.getByRole('button', { name: 'Internet Explorer' })
    ieIcon.focus()
    expect(ieIcon).toHaveFocus()

    await act(async () => {
      await user.keyboard('{Enter}')
    })

    expect(screen.getByTestId('managed-window-win-1')).toBeInTheDocument()
  })

  it('moves focus onto an interactive control with Tab (no entry keyboard trap)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<DesktopPage />)

    await user.tab()

    expect(document.body).not.toHaveFocus()
    expect(document.activeElement?.tagName).toBe('BUTTON')
  })
})

describe('Cross-cutting · Guest/Admin parity (pre-content baseline)', () => {
  // Today every authenticated role sees the same desktop — there is no
  // role-filtered project content yet. Locking this equality makes Task 16's
  // intentional divergence (admin-only / WIP projects) a deliberate, reviewable
  // change instead of a silent regression.
  function iconLabelsFor(role: 'guest' | 'admin'): string[] {
    const { container, unmount } = renderWithProviders(<DesktopPage />, {
      preloadedState: sessionState(role),
    })
    const grid = within(container).getByTestId('icon-grid')
    const labels = within(grid)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? '')
      .sort()
    unmount()
    return labels
  }

  it('guest and admin see an identical icon surface', () => {
    expect(iconLabelsFor('guest')).toEqual(iconLabelsFor('admin'))
  })

  it('the shared surface is exactly the expected pre-content icon set', () => {
    expect(iconLabelsFor('guest')).toEqual([...ICON_LABELS].sort())
  })
})
