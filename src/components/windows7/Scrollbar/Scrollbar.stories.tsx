import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Scrollbar } from './Scrollbar'

const meta = {
  title: 'Windows7/Scrollbar',
  component: Scrollbar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Scrollbar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    style: { width: 240, height: 120, border: '1px solid #8e8f8f', padding: 8 },
    children: (
      <div>
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i}>Line {i + 1}</p>
        ))}
      </div>
    ),
  },
}
