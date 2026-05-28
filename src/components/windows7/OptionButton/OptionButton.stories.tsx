import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { OptionButton } from './OptionButton'

const meta = {
  title: 'Windows7/OptionButton',
  component: OptionButton,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof OptionButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { id: 'rb-default', name: 'demo', label: 'Yes' } }
export const Selected: Story = {
  args: { id: 'rb-selected', name: 'demo2', label: 'Selected', defaultChecked: true },
}
export const Disabled: Story = {
  args: { id: 'rb-disabled', name: 'demo3', label: 'Disabled', disabled: true },
}
