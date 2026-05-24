import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { OsBranding } from './OsBranding'

const meta = {
  title: 'Windows7/OsBranding',
  component: OsBranding,
  parameters: {
    backgrounds: { default: 'login', values: [{ name: 'login', value: '#1d3a4e' }] },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: '40vh' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OsBranding>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: {} }
export const Simulator: Story = { args: { subtitle: 'Simulator' } }
export const HomePremium: Story = { args: { subtitle: 'Home Premium' } }
