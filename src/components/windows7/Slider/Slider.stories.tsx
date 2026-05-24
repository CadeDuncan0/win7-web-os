import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Slider } from './Slider'

const meta = {
  title: 'Windows7/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

export const Horizontal: Story = { args: { min: 1, max: 11, defaultValue: 5 } }
export const Vertical: Story = {
  args: { vertical: true, min: 1, max: 3, step: 1, defaultValue: 2, boxIndicator: true },
}
