// Tests verify grid rendering, icon registration, selection, deselection,
// window opening on double-click, and position reactivity from Redux.

import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { IconGrid } from './IconGrid'
import { gridCellToPixels } from '@/lib/gridMath'
import { setupStore } from '@/store'
import { registerIcon, setIconPosition, setSelectedIcon } from '@/store/slices/desktopSlice'
import { renderWithProviders } from '@/test-utils/renderWithProviders'

const MOCK_ICONS = [
  {
    id: 'icon-1',
    label: 'My Computer',
    iconSrc: '/imgs/desktop/icons/computer.png',
    windowKind: 'welcome' as const,
    windowTitle: 'My Computer',
  },
  {
    id: 'icon-2',
    label: 'Recycle Bin',
    iconSrc: '/imgs/desktop/icons/recycle-bin.png',
    windowKind: 'welcome' as const,
    windowTitle: 'Recycle Bin',
  },
]

describe('IconGrid', () => {
  it('renders icons at their grid cell positions', () => {
    renderWithProviders(<IconGrid icons={MOCK_ICONS} />)

    const pos0 = gridCellToPixels({ column: 0, row: 0 })
    const pos1 = gridCellToPixels({ column: 0, row: 1 })

    const icon1 = screen.getByRole('button', { name: 'My Computer' })
    const icon2 = screen.getByRole('button', { name: 'Recycle Bin' })

    expect(icon1.style.left).toBe(`${pos0.x}px`)
    expect(icon1.style.top).toBe(`${pos0.y}px`)
    expect(icon2.style.left).toBe(`${pos1.x}px`)
    expect(icon2.style.top).toBe(`${pos1.y}px`)
  })

  it('registers icons in Redux on mount', () => {
    const { store } = renderWithProviders(<IconGrid icons={MOCK_ICONS} />)

    expect(store.getState().desktop.iconIds).toHaveLength(2)
    expect(store.getState().desktop.iconIds).toContain('icon-1')
    expect(store.getState().desktop.iconIds).toContain('icon-2')
  })

  it('selects an icon on click', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<IconGrid icons={MOCK_ICONS} />)

    const icon1 = screen.getByRole('button', { name: 'My Computer' })
    await user.click(icon1)

    expect(store.getState().desktop.selectedIconId).toBe('icon-1')
  })

  it('clears selection on grid background click', async () => {
    const user = userEvent.setup()
    const store = setupStore()
    store.dispatch(
      registerIcon({
        id: 'icon-1',
        position: { column: 0, row: 0 },
        defaultPosition: { column: 0, row: 0 },
      })
    )
    store.dispatch(setSelectedIcon({ id: 'icon-1' }))

    renderWithProviders(<IconGrid icons={MOCK_ICONS} />, { store })

    expect(store.getState().desktop.selectedIconId).toBe('icon-1')

    const grid = screen.getByTestId('icon-grid')
    await user.click(grid)

    expect(store.getState().desktop.selectedIconId).toBeNull()
  })

  it('opens a window on double-click', async () => {
    const user = userEvent.setup()
    const { store } = renderWithProviders(<IconGrid icons={MOCK_ICONS} />)

    const icon1 = screen.getByRole('button', { name: 'My Computer' })
    await user.dblClick(icon1)

    expect(store.getState().window.ids).toHaveLength(1)
  })

  it('reflects position changes from Redux', () => {
    const { store } = renderWithProviders(<IconGrid icons={MOCK_ICONS} />)

    const newPos = { column: 1, row: 2 }
    const expectedPixels = gridCellToPixels(newPos)

    act(() => {
      store.dispatch(setIconPosition({ id: 'icon-1', position: newPos }))
    })

    const icon1 = screen.getByRole('button', { name: 'My Computer' })
    expect(icon1.style.left).toBe(`${expectedPixels.x}px`)
    expect(icon1.style.top).toBe(`${expectedPixels.y}px`)
  })
})
