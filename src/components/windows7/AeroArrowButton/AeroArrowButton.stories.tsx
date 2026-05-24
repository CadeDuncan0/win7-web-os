import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AeroArrowButton } from './AeroArrowButton'

const meta = {
  title: 'Windows7/AeroArrowButton',
  component: AeroArrowButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          width: 260,
          height: 80,
          background: '#1d3a4e',
          color: '#fff',
          padding: 12,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AeroArrowButton>

export default meta

type Story = StoryObj<typeof meta>

export const Right: Story = { args: { direction: 'right', 'aria-label': 'Submit' } }
export const Left: Story = { args: { direction: 'left', 'aria-label': 'Back' } }
export const Disabled: Story = {
  args: { direction: 'right', disabled: true, 'aria-label': 'Submit' },
}
