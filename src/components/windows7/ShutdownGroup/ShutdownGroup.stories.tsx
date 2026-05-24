import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ShutdownGroup } from './ShutdownGroup'

const meta = {
  title: 'Windows7/ShutdownGroup',
  component: ShutdownGroup,
  parameters: {
    backgrounds: { default: 'login', values: [{ name: 'login', value: '#1d3a4e' }] },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100%', height: '40vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ShutdownGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: {} }
