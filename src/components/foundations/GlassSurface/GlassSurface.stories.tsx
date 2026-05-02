import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { GlassSurface } from './GlassSurface'

const meta = {
  title: 'Foundations/GlassSurface',
  component: GlassSurface,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof GlassSurface>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Aero glass smoke test',
  },
}
