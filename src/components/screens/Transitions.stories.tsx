import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Transition } from './Transition'

const meta = {
  title: 'Screens/Login/Welcome',
  component: Transition,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Transition>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { message: 'Welcome' } }
export const CustomMessage: Story = { args: { message: 'Signing you in…' } }
