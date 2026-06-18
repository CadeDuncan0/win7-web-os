/** Each story provides a pre-seeded Redux store with specific window state.
 *  The parent div needs position: relative since WindowWrapper uses absolute. */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AnimatePresence } from 'framer-motion'
import { Provider } from 'react-redux'

import { WindowWrapper } from './WindowWrapper'
import { setupStore } from '@/store'
import type { WindowInstance, WindowState } from '@/store/slices/windowSlice'

function makeWindowState(overrides: Partial<WindowInstance> = {}): WindowState {
  const instance: WindowInstance = {
    id: 'win-1',
    kind: 'internet-explorer',
    title: 'Welcome',
    position: { x: 100, y: 60 },
    size: { width: 480, height: 360 },
    zIndex: 1,
    isMinimized: false,
    isMaximized: false,
    prevGeometry: null,
    ...overrides,
  }
  return {
    byId: { [instance.id]: instance },
    ids: [instance.id],
    zCounter: 1,
    nextIdSeed: 1,
  }
}

const meta = {
  title: 'Desktop/WindowWrapper',
  component: WindowWrapper,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, context) => {
      const windowState =
        (context.args as Record<string, unknown>).__windowState ?? makeWindowState()
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
            <AnimatePresence>
              <Story />
            </AnimatePresence>
          </div>
        </Provider>
      )
    },
  ],
} satisfies Meta<typeof WindowWrapper>

export default meta

type Story = StoryObj<typeof meta>

export const Active: Story = {
  args: {
    windowId: 'win-1',
  },
}

export const Inactive: Story = {
  args: {
    windowId: 'win-1',
    // @ts-expect-error — __windowState is a story-only prop passed via decorator
    __windowState: {
      byId: {
        'win-1': {
          id: 'win-1',
          kind: 'internet-explorer',
          title: 'Background Window',
          position: { x: 80, y: 40 },
          size: { width: 480, height: 360 },
          zIndex: 1,
          isMinimized: false,
          isMaximized: false,
          prevGeometry: null,
        },
        'win-2': {
          id: 'win-2',
          kind: 'internet-explorer',
          title: 'Foreground Window',
          position: { x: 200, y: 100 },
          size: { width: 480, height: 360 },
          zIndex: 2,
          isMinimized: false,
          isMaximized: false,
          prevGeometry: null,
        },
      },
      ids: ['win-1', 'win-2'],
      zCounter: 2,
      nextIdSeed: 2,
    } satisfies WindowState,
  },
}

export const Maximized: Story = {
  args: {
    windowId: 'win-1',
    // @ts-expect-error — __windowState is a story-only prop passed via decorator
    __windowState: makeWindowState({
      isMaximized: true,
      position: { x: 0, y: 0 },
      size: { width: 1280, height: 680 },
      prevGeometry: { x: 100, y: 60, width: 480, height: 360 },
    }),
  },
}

export const WithContent: Story = {
  args: {
    windowId: 'win-1',
    children: (
      <div style={{ padding: 12 }}>
        <h2>Window Content</h2>
        <p>This content renders inside the window body below the title bar.</p>
      </div>
    ),
  },
}

export const Draggable: Story = {
  args: {
    windowId: 'win-1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Grab the title bar and drag. The window clamps to all four viewport edges and never escapes the canvas. Test: left, right, top, bottom edges.',
      },
    },
  },
}

export const DoubleClickMaximize: Story = {
  args: {
    windowId: 'win-1',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Double-click the title bar to maximize. Double-click again to restore to original size and position. The window should fill the viewport (minus the taskbar) when maximized and return exactly to its prior geometry on restore. Double-clicking control buttons should NOT maximize.',
      },
    },
  },
}

const threeWindowState: WindowState = {
  byId: {
    'win-1': {
      id: 'win-1',
      kind: 'internet-explorer',
      title: 'Window A',
      position: { x: 50, y: 30 },
      size: { width: 480, height: 360 },
      zIndex: 1,
      isMinimized: false,
      isMaximized: false,
      prevGeometry: null,
    },
    'win-2': {
      id: 'win-2',
      kind: 'internet-explorer',
      title: 'Window B',
      position: { x: 180, y: 80 },
      size: { width: 480, height: 360 },
      zIndex: 2,
      isMinimized: false,
      isMaximized: false,
      prevGeometry: null,
    },
    'win-3': {
      id: 'win-3',
      kind: 'internet-explorer',
      title: 'Window C',
      position: { x: 310, y: 130 },
      size: { width: 480, height: 360 },
      zIndex: 3,
      isMinimized: false,
      isMaximized: false,
      prevGeometry: null,
    },
  },
  ids: ['win-1', 'win-2', 'win-3'],
  zCounter: 3,
  nextIdSeed: 3,
}

export const ZIndexStacking: Story = {
  args: {
    windowId: 'win-1',
  },
  decorators: [
    () => {
      const store = setupStore({ window: threeWindowState })
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
            <AnimatePresence>
              <WindowWrapper windowId="win-1" key="win-1" />
              <WindowWrapper windowId="win-2" key="win-2" />
              <WindowWrapper windowId="win-3" key="win-3" />
            </AnimatePresence>
          </div>
        </Provider>
      )
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Three overlapping windows. Click any window to bring it to the front. Only the focused window should show active title-bar chrome (blue gradient). The other two should show inactive chrome (grey). Verify: click each window in turn and confirm exactly one active title bar.',
      },
    },
  },
}
