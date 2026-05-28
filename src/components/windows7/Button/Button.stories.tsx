import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from './Button'

const meta = {
  title: 'Windows7/Button',
  component: Button,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: 'Click me' } }
export const FormDefault: Story = { args: { children: 'I am the one!', variant: 'default' } }
export const Disabled: Story = { args: { children: 'I cannot be clicked', disabled: true } }
