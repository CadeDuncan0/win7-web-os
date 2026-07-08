import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Provider } from 'react-redux'
import { userEvent, within } from 'storybook/test'

import { InternetExplorerWindow } from './InternetExplorerWindow'
import { setupStore } from '@/store'

// IE composes its own WindowWrapper, so a matching window must exist in the
// store for geometry/focus. The decorator box is the positioning context.
const preloadedState = {
  window: {
    byId: {
      'ie-1': {
        id: 'ie-1',
        kind: 'internet-explorer' as const,
        title: 'Internet Explorer',
        position: { x: 0, y: 0 },
        size: { width: 800, height: 500 },
        zIndex: 1,
        isMinimized: false,
        isMaximized: false,
        prevGeometry: null,
      },
    },
    ids: ['ie-1'],
    zCounter: 1,
    nextIdSeed: 1,
  },
}

const meta: Meta<typeof InternetExplorerWindow> = {
  title: 'Desktop/InternetExplorer',
  component: InternetExplorerWindow,
  args: { windowId: 'ie-1' },
  decorators: [
    (Story) => {
      const store = setupStore(preloadedState)
      return (
        <Provider store={store}>
          <div style={{ position: 'relative', width: 800, height: 500, overflow: 'hidden' }}>
            <Story />
          </div>
        </Provider>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof InternetExplorerWindow>

export const Home: Story = {
  args: { initialRoute: 'about:home' },
}

export const GettingStarted: Story = {
  args: { initialRoute: 'about:getting-started' },
}

export const BackDisabled: Story = {
  args: { initialRoute: 'about:home' },
  parameters: {
    docs: {
      description: { story: 'Back and Forward are disabled on the initial page.' },
    },
  },
}

export const ForwardEnabled: Story = {
  args: { initialRoute: 'about:home' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const links = within(canvas.getByRole('navigation', { name: /pages/i }))
    await userEvent.click(links.getByRole('button', { name: 'Getting Started' }))
    await userEvent.click(canvas.getByRole('button', { name: /back/i }))
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigate to Getting Started then go Back — the Forward button becomes enabled.',
      },
    },
  },
}

export const AddressDropdown: Story = {
  args: { initialRoute: 'about:home' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: /address/i }))
  },
  parameters: {
    docs: {
      description: {
        story: 'Clicking the address bar opens the autocomplete list of in-app pages.',
      },
    },
  },
}
