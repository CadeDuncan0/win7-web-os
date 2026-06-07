// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { gridCellToPixels } from '@/lib/gridMath'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { renderWithProviders } from '@/test-utils/renderWithProviders'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
import { IconGrid } from './IconGrid'

// TODO: [Action Required: implement all test cases below] - 20 min

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used after TODO implementation
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
  // Render with 2 icons, assert style.left/top match gridCellToPixels output
  it.todo('renders icons at their grid cell positions')

  // Render with 2 icons, assert store.getState().desktop.iconIds.length === 2
  it.todo('registers icons in Redux on mount')

  // Click icon 1 by aria-label, assert store selectedIconId === 'icon-1'
  it.todo('selects an icon on click')

  // Pre-seed selectedIconId, click grid background, assert selectedIconId === null
  it.todo('clears selection on grid background click')

  // Double-click icon, assert store.getState().window.ids.length === 1
  it.todo('opens a window on double-click')

  // Dispatch setIconPosition to (1,2), assert style matches new gridCellToPixels
  it.todo('reflects position changes from Redux')
})
