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
      kind: 'internet-explorer',
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
      { id: 'win-1', title: 'Resume', zIndex: 1 },
      { id: 'win-2', title: 'Projects', zIndex: 2 },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Two Internet Explorer windows compacted under one app button. The square selector marks the active app; hover the button to reveal the window list.',
      },
    },
  },
}

export const ManyWindows: Story = {
  args: {
    __windowState: makeWindowState([
      { id: 'win-1', title: 'Portfolio', zIndex: 1 },
      { id: 'win-2', title: 'Resume', zIndex: 2 },
      { id: 'win-3', title: 'Projects', zIndex: 3 },
      { id: 'win-4', title: 'GitHub', zIndex: 4 },
      { id: 'win-5', title: 'LinkedIn', zIndex: 5 },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Five Internet Explorer windows compacted into a single app button. Hover the button to reveal the full window list in the popup.',
      },
    },
  },
}

export const MinimizedWindow: Story = {
  args: {
    __windowState: makeWindowState([
      { id: 'win-1', title: 'Resume', zIndex: 1, isMinimized: true },
      { id: 'win-2', title: 'Projects', zIndex: 2 },
    ]),
  },
  parameters: {
    docs: {
      description: {
        story:
          'One window minimized, one active — both belong to the same Internet Explorer app button. Hover the button to see and restore each window.',
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
