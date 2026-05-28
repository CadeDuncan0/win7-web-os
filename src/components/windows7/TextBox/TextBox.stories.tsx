import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TextBox } from './TextBox'

const meta = {
  title: 'Windows7/TextBox',
  component: TextBox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TextBox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { placeholder: 'Enter text' } }
export const Password: Story = { args: { type: 'password', placeholder: 'Password' } }
export const Disabled: Story = { args: { placeholder: 'Enter text', disabled: true } }
export const Multiline: Story = { args: { multiline: true, rows: 6, placeholder: 'Long text…' } }
