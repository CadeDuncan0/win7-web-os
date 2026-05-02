import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AccountTile } from './AccountTile'

const meta = {
  title: 'Login/AccountTile',
  component: AccountTile,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSelect: { action: 'onSelect' },
  },
} satisfies Meta<typeof AccountTile>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Guest',
    glyph: '👤',
    selected: false,
    disabled: false,
    onSelect: () => {},
  },
}

export const Selected: Story = {
  args: {
    ...Default.args,
    selected: true,
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
}
