import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StatusBar } from './StatusBar'

const meta = {
  title: 'Windows7/StatusBar',
  component: StatusBar,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof StatusBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <StatusBar.Field>Press F1 for help</StatusBar.Field>
        <StatusBar.Field>Slide 1</StatusBar.Field>
        <StatusBar.Field>CPU Usage: 14%</StatusBar.Field>
      </>
    ),
  },
}
