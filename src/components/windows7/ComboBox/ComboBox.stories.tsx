import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComboBox } from './ComboBox'

const meta = {
  title: 'Windows7/ComboBox',
  component: ComboBox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ComboBox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    listId: 'combo-company',
    placeholder: 'Pick a company',
    options: (
      <>
        <li role="option" aria-selected={false}>
          Facebook
        </li>
        <li role="option" aria-selected={false}>
          Amazon
        </li>
        <li role="option" aria-selected={false}>
          Apple
        </li>
        <li role="option" aria-selected={false}>
          Netflix
        </li>
      </>
    ),
  },
}
