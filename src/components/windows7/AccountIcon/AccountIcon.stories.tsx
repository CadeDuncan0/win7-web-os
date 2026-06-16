import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { userEvent } from 'storybook/test'

import { AccountIcon } from './AccountIcon'
import { USER_ICONS, pickTwoDistinctIcons } from '@/lib/userIcons'

// Pick two distinct random icons at module-load time so each story shows a
// different avatar without repeating.
const [randomIcon1, randomIcon2] = pickTwoDistinctIcons()

const meta: Meta<typeof AccountIcon> = {
  title: 'Windows7/AccountIcon',
  component: AccountIcon,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'win7-login',
      values: [
        { name: 'win7-login', value: '#1c5a8a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AccountIcon>

// ─── Primary states ──────────────────────────────────────────────────────────

export const Guest: Story = {
  args: {
    iconSrc: randomIcon1,
    subtitle: 'Guest',
  },
}

export const Admin: Story = {
  args: {
    iconSrc: randomIcon2,
    subtitle: 'Cade Duncan',
  },
}

// ─── Selected state ──────────────────────────────────────────────────────────

// Focuses the button so the :has(:focus) rule reveals the selection outline.
// Reviewed against the win7-login background to confirm the inset glow blends
// with the wallpaper (compare to accountIconBorderOutlineShaded_OG.png).
export const Selected: Story = {
  args: {
    iconSrc: randomIcon1,
    subtitle: 'Guest',
    // eslint-disable-next-line no-console
    onClick: () => console.warn('AccountIcon clicked'),
  },
  play: async () => {
    await userEvent.tab()
  },
}

// ─── Variant states ──────────────────────────────────────────────────────────

export const NoSubtitle: Story = {
  args: {
    iconSrc: randomIcon1,
  },
}

export const Clickable: Story = {
  args: {
    iconSrc: randomIcon1,
    subtitle: 'Guest',
    // eslint-disable-next-line no-console
    onClick: () => console.warn('AccountIcon clicked'),
  },
}

// ─── All available user icons ────────────────────────────────────────────────

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px' }}>
      {USER_ICONS.map((src) => (
        <AccountIcon key={src} iconSrc={src} />
      ))}
    </div>
  ),
}
