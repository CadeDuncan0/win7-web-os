import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { within } from 'storybook/test'

import { PasswordInput } from './PasswordInput'

const meta = {
  title: 'Login/PasswordInput',
  component: PasswordInput,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof PasswordInput>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: '',
    onChange: () => {},
    placeholder: 'Password',
    error: undefined,
    disabled: false,
    ref: undefined,
  },
  argTypes: {
    onChange: { action: 'onChange' },
  },
}

export const Focused: Story = {
  args: {
    ...Default.args,
  },
  argTypes: {
    onChange: { action: 'onChange' },
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByLabelText('Password'))
  },
}

export const Error: Story = {
  args: {
    ...Default.args,
    value: 'wrongpw',
    error: 'Incorrect password',
  },
  argTypes: {
    onChange: { action: 'onChange' },
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
  argTypes: {
    onChange: { action: 'onChange' },
  },
}
