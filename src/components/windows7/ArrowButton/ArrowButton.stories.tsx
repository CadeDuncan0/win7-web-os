import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ArrowButton } from './ArrowButton'

const meta = {
  title: 'Windows7/ArrowButton',
  component: ArrowButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          width: 80,
          height: 20,
          background: '#1d3a4e',
          color: '#fff',
          padding: 12,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArrowButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { disabled: false, 'aria-label': 'Submit' },
}
export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Submit' },
}
