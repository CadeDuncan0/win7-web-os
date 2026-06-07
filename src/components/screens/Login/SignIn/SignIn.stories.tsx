import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { SignIn } from './SignIn'

const ADMIN_AVATAR = '/imgs/windows7/user-icons/user.bmp'

const meta = {
  title: 'Screens/login/SignIn',
  component: SignIn,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SignIn>

export default meta

type Story = StoryObj<typeof meta>

export const Idle: Story = {
  args: {
    accountLabel: 'Admin',
    avatarSrc: ADMIN_AVATAR,
    password: '',
    onPasswordChange: () => {},
    onSubmit: (e) => e.preventDefault(),
    onBack: () => {},
  },
}

export const Interactive: Story = {
  args: {
    accountLabel: 'Admin',
    avatarSrc: ADMIN_AVATAR,
    password: '',
    onPasswordChange: () => {},
    onSubmit: (e) => e.preventDefault(),
    onBack: () => {},
  },
  render: (args) => {
    const [password, setPassword] = useState('')
    return (
      <SignIn
        {...args}
        password={password}
        onPasswordChange={setPassword}
        onBack={() => setPassword('')}
      />
    )
  },
}

export const WithError: Story = {
  args: {
    accountLabel: 'Admin',
    avatarSrc: ADMIN_AVATAR,
    password: '',
    error: 'Incorrect password',
    onPasswordChange: () => {},
    onSubmit: (e) => e.preventDefault(),
    onBack: () => {},
  },
}

export const Submitting: Story = {
  args: {
    accountLabel: 'Admin',
    avatarSrc: ADMIN_AVATAR,
    password: '••••••',
    submitting: true,
    onPasswordChange: () => {},
    onSubmit: (e) => e.preventDefault(),
    onBack: () => {},
  },
}
