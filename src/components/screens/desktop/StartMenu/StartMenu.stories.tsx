import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Provider } from 'react-redux'
import { fn, userEvent, within } from 'storybook/test'

import { StartMenu } from './StartMenu'
import { setupStore } from '@/store'

// Each story wraps in a fresh Redux store + desktop wallpaper backdrop
// to render the fixed-position panel in realistic context.
const meta = {
  title: 'Desktop/StartMenu',
  component: StartMenu,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      const store = setupStore()
      return (
        <Provider store={store}>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--desktop-backdrop) center / cover no-repeat',
            }}
          >
            <Story />
          </div>
        </Provider>
      )
    },
  ],
} satisfies Meta<typeof StartMenu>

export default meta

type Story = StoryObj<typeof meta>

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: fn(),
  },
}

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
}

export const OpenWithSearchActive: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const search = canvas.getByRole('textbox', { name: /search/i })
    await userEvent.type(search, 'res')
  },
}

export const OpenWithAvatar: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    avatarSrc: '/imgs/windows7/user-icons/user.bmp',
  },
}
