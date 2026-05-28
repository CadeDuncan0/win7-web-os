import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ListBox } from './ListBox'

const meta = {
  title: 'Windows7/ListBox',
  component: ListBox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ListBox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    style: { width: 200 },
    children: (
      <>
        <ListBox.Item>Facebook</ListBox.Item>
        <ListBox.Item selected>Amazon</ListBox.Item>
        <ListBox.Item>Apple</ListBox.Item>
        <ListBox.Item>Netflix</ListBox.Item>
      </>
    ),
  },
}
