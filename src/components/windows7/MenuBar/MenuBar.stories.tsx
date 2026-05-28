import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { MenuBar } from './MenuBar'

const meta = {
  title: 'Windows7/MenuBar',
  component: MenuBar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MenuBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <MenuBar.Item>File</MenuBar.Item>
        <MenuBar.Item>Edit</MenuBar.Item>
        <MenuBar.Item>View</MenuBar.Item>
        <MenuBar.Item>Help</MenuBar.Item>
      </>
    ),
  },
}
