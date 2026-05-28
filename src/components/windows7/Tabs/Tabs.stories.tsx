import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Tabs } from './Tabs'

const meta = {
  title: 'Windows7/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    ariaLabel: 'Sample Tabs',
    style: { maxWidth: 500 },
    items: [
      { id: 'tab-A', label: 'Tab A', content: 'Tab A content' },
      { id: 'tab-B', label: 'Tab B', content: 'Tab B content' },
      { id: 'tab-C', label: 'Tab C', content: 'Tab C content' },
    ],
  },
}
