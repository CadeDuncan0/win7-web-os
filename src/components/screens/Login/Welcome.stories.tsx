import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Welcome } from './Welcome'

const meta = {
  title: 'Screens/Login/Welcome',
  component: Welcome,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Welcome>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: {} }
export const CustomMessage: Story = { args: { message: 'Signing you in…' } }
