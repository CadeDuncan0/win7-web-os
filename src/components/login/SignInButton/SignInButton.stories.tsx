import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within } from 'storybook/test'

import { SignInButton } from './SignInButton'

const meta = {
  title: 'Login/SignInButton',
  component: SignInButton,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SignInButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onClick: () => {},
    disabled: undefined,
    ariaLabel: undefined,
  },
}

export const Focused: Story = {
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }))
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
}
