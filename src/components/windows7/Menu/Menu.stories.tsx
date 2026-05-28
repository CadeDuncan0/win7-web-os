import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Menu } from './Menu'

const meta = {
  title: 'Windows7/Menu',
  component: Menu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Menu>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    style: { width: 200 },
    children: (
      <>
        <Menu.Item>View</Menu.Item>
        <Menu.Item>Sort by</Menu.Item>
        <Menu.Item>Refresh</Menu.Item>
        <Menu.Item disabled>Paste</Menu.Item>
      </>
    ),
  },
}
