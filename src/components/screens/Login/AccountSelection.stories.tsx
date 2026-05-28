import type { Meta, StoryObj } from '@storybook/nextjs-vite'

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

export const Interactive: Story = {
  args: {
    accounts: SAMPLE_ACCOUNTS,
    onSelect: () => {},
  },
  render: (args) => {
    return <AccountSelection {...args} />
  },
}

export const Disabled: Story = {
  args: {
    accounts: SAMPLE_ACCOUNTS,
    onSelect: () => {},
  },
}
