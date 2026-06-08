import { DndContext } from '@dnd-kit/core'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Provider } from 'react-redux'
import { userEvent, within } from 'storybook/test'

import { DesktopIcon } from './DesktopIcon'
import { setupStore } from '@/store'
import { registerIcon, setSelectedIcon } from '@/store/slices/desktopSlice'

const MOCK_ICON_ID = 'icon-test'
const MOCK_LONG_ID = 'icon-long'

function createSeededStore(options?: { selected?: boolean; iconId?: string }) {
  const id = options?.iconId ?? MOCK_ICON_ID
  const s = setupStore()
  s.dispatch(
    registerIcon({
      id,
      position: { column: 0, row: 0 },
      defaultPosition: { column: 0, row: 0 },
    })
  )
  if (options?.selected) {
    s.dispatch(
      setSelectedIcon({
        id,
        position: { column: 0, row: 0 },
        defaultPosition: { column: 0, row: 0 },
      })
    )
  }
  return s
}

const meta = {
  title: 'Desktop/DesktopIcon',
  component: DesktopIcon,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story, context) => {
      const iconId = (context.args as Record<string, unknown>).id as string
      const isSelected = context.name === 'Selected'
      const store = createSeededStore({ selected: isSelected, iconId })
      return (
        <Provider store={store}>
          <DndContext>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--desktop-backdrop) center / cover no-repeat',
                padding: 'var(--dsk-grid-padding)',
              }}
            >
              <Story />
            </div>
          </DndContext>
        </Provider>
      )
    },
  ],
} satisfies Meta<typeof DesktopIcon>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => {}

export const Idle: Story = {
  args: {
    id: MOCK_ICON_ID,
    label: 'My Computer',
    iconSrc: '/imgs/desktop/icons/computer.png',
    onOpen: noop,
  },
}

export const Selected: Story = {
  args: {
    id: MOCK_ICON_ID,
    label: 'My Computer',
    iconSrc: '/imgs/desktop/icons/computer.png',
    onOpen: noop,
  },
}

export const Focused: Story = {
  args: {
    id: MOCK_ICON_ID,
    label: 'My Computer',
    iconSrc: '/imgs/desktop/icons/computer.png',
    onOpen: noop,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const icon = canvas.getByRole('button', { name: 'My Computer' })
    await userEvent.tab()
    icon.focus()
  },
}

export const LongLabel: Story = {
  args: {
    id: MOCK_LONG_ID,
    label: 'Windows Media Player with a Very Long Name',
    iconSrc: '/imgs/desktop/icons/computer.png',
    onOpen: noop,
  },
  decorators: [
    (Story) => {
      const store = createSeededStore({ iconId: MOCK_LONG_ID })
      return (
        <Provider store={store}>
          <DndContext>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--desktop-backdrop) center / cover no-repeat',
                padding: 'var(--dsk-grid-padding)',
              }}
            >
              <Story />
            </div>
          </DndContext>
        </Provider>
      )
    },
  ],
}
