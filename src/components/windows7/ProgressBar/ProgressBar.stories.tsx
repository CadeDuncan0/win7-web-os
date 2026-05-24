import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ProgressBar } from './ProgressBar'

const meta = {
  title: 'Windows7/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ProgressBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { value: 80 } }
export const Paused: Story = { args: { value: 50, paused: true } }
export const Indeterminate: Story = { args: { marquee: true } }
