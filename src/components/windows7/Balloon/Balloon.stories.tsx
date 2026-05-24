import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Balloon } from './Balloon'

const meta = {
  title: 'Windows7/Balloon',
  component: Balloon,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Balloon>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: 'A balloon tooltip' } }
export const BottomLeft: Story = {
  args: { position: 'bottom-left', children: 'Bottom-left tail' },
}
