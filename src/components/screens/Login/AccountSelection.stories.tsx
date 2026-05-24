import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { AccountSelection, type AccountId } from './AccountSelection'

const SAMPLE_ACCOUNTS = [
  { id: 'guest' as AccountId, label: 'Guest', avatarSrc: '/imgs/windows7/user-icons/guest.bmp' },
  { id: 'admin' as AccountId, label: 'Admin', avatarSrc: '/imgs/windows7/user-icons/user.bmp' },
]

const meta = {
  title: 'Screens/Login/AccountSelection',
  component: AccountSelection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AccountSelection>

export default meta

type Story = StoryObj<typeof meta>

export const Guest: Story = {
  args: {
    accounts: SAMPLE_ACCOUNTS,
    currentId: 'guest',
    onSwitch: () => {},
    onSelect: () => {},
    disabled: false,
  },
}

export const Admin: Story = {
  args: {
    accounts: SAMPLE_ACCOUNTS,
    currentId: 'admin',
    onSwitch: () => {},
    onSelect: () => {},
    disabled: false,
  },
}

export const Interactive: Story = {
  args: {
    accounts: SAMPLE_ACCOUNTS,
    currentId: 'guest',
    onSwitch: () => {},
    onSelect: () => {},
  },
  render: (args) => {
    const [currentId, setCurrentId] = useState<AccountId>('guest')
    return (
      <AccountSelection
        {...args}
        currentId={currentId}
        onSwitch={() => setCurrentId((c) => (c === 'guest' ? 'admin' : 'guest'))}
      />
    )
  },
}

export const Disabled: Story = {
  args: {
    accounts: SAMPLE_ACCOUNTS,
    currentId: 'guest',
    onSwitch: () => {},
    onSelect: () => {},
    disabled: true,
  },
}
