import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SubmitButton } from './SubmitButton'

const meta = {
  title: 'Windows7/SubmitButton',
  component: SubmitButton,
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
} satisfies Meta<typeof SubmitButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { disabled: false, 'aria-label': 'Submit' },
}
export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Submit' },
}
