import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Provider } from 'react-redux'
import { userEvent, within } from 'storybook/test'

import { Taskbar } from './Taskbar'
import { setupStore } from '@/store'
import type { WindowState } from '@/store/slices/windowSlice'

function makeWindowState(
  windows: Array<{
    id: string
    title: string
    zIndex: number
    isMinimized?: boolean
  }>
): WindowState {
  const byId: WindowState['byId'] = {}
  const ids: string[] = []

  for (const win of windows) {
    byId[win.id] = {
      id: win.id,
      kind: 'welcome',
      title: win.title,
      position: { x: 80, y: 80 },
      size: { width: 640, height: 440 },
      zIndex: win.zIndex,
      isMinimized: win.isMinimized ?? false,
      isMaximized: false,
      prevGeometry: null,
    }
    ids.push(win.id)
  }

  return {
    byId,
    ids,
    zCounter: windows.length,
    nextIdSeed: windows.length,
  }
}

const meta = {
  title: 'Desktop/Taskbar',
  component: Taskbar,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, context) => {
      const windowState =
        (context.args as Record<string, unknown>).__windowState ?? makeWindowState([])
      const store = setupStore({ window: windowState as WindowState })
      return (
        <Provider store={store}>
          <div
            style={{
              position: 'relative',
              width: '100vw',
              height: '100vh',
              background: 'var(--desktop-backdrop) center / cover no-repeat',
            }}
          >
            <Story />
          </div>
        </Provider>
      )
    },
  ],
} satisfies Meta<typeof Taskbar>

export default meta

type Story = StoryObj<typeof meta>

export const Idle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Taskbar with no open windows. Shows Start orb, empty button group, and system tray clock.',
      },
    },
  },
}

export const WithWindows: Story = {
  args: {
    __windowState: makeWindowState([
      { id: 'win-1', title: 'Welcome', zIndex: 1 },
      { id: 'win-2', title: 'Internet Explorer', zIndex: 2 },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Two open windows. The second window is active (higher zIndex). Click buttons to switch focus or minimize.',
      },
    },
  },
}

export const WithManyWindows: Story = {
  args: {
    __windowState: makeWindowState([
      { id: 'win-1', title: 'Welcome', zIndex: 1 },
      { id: 'win-2', title: 'Internet Explorer - Portfolio', zIndex: 2 },
      { id: 'win-3', title: 'About This PC', zIndex: 3 },
      { id: 'win-4', title: 'Projects - All Categories', zIndex: 4 },
      { id: 'win-5', title: 'Resume - Cade Duncan', zIndex: 5 },
      { id: 'win-6', title: 'File Explorer - Documents', zIndex: 6 },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Six open windows. Buttons share space equally and truncate long titles with ellipsis.',
      },
    },
  },
}

export const MinimizedWindow: Story = {
  args: {
    __windowState: makeWindowState([
      { id: 'win-1', title: 'Welcome', zIndex: 1, isMinimized: true },
      { id: 'win-2', title: 'Internet Explorer', zIndex: 2 },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          'One window minimized, one active. The minimized window button has de-emphasized styling (lower opacity). Click it to restore.',
      },
    },
  },
}

export const StartMenuOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /start/i }))
  },
  parameters: {
    docs: {
      description: {
        story:
          'Start Menu opened via the Start orb. Click the orb again to close, or click outside the menu.',
      },
    },
  },
}
