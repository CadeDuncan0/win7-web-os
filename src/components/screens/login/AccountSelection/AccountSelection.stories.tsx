import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AccountSelection, type AccountId } from './AccountSelection'
import { assetPaths } from '@/lib/assetPaths'

const SAMPLE_ACCOUNTS = [
  { id: 'guest' as AccountId, label: 'Guest', avatarSrc: assetPaths.accountIcons.guest },
  { id: 'admin' as AccountId, label: 'Admin', avatarSrc: assetPaths.accountIcons.user },
]

const meta = {
  title: 'Screens/login/AccountSelection',
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
