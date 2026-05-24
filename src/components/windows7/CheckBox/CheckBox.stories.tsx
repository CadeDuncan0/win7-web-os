import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CheckBox } from './CheckBox'

const meta = {
  title: 'Windows7/CheckBox',
  component: CheckBox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CheckBox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { id: 'cb-default', label: 'This is a checkbox' } }
export const Checked: Story = {
  args: { id: 'cb-checked', label: 'I am checked', defaultChecked: true },
}
export const Disabled: Story = {
  args: { id: 'cb-disabled', label: 'Cannot toggle', disabled: true },
}
