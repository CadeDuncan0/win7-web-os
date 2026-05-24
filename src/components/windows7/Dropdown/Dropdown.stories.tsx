import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Dropdown } from './Dropdown'

const meta = {
  title: 'Windows7/Dropdown',
  component: Dropdown,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dropdown>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: '3',
    children: (
      <>
        <option value="5">5 - Incredible!</option>
        <option value="4">4 - Great!</option>
        <option value="3">3 - Pretty good</option>
      </>
    ),
  },
}
