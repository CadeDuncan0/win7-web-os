import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { StatusBar } from '../StatusBar'
import { Window } from './Window'

const meta = {
  title: 'Windows7/Window',
  component: Window,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Window>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    title: 'A complete window',
    style: { maxWidth: 300 },
    controls: (
      <>
        <button aria-label="Minimize" />
        <button aria-label="Close" />
      </>
    ),
    children: <p>Content here</p>,
  },
}

export const Inactive: Story = {
  args: { ...Basic.args, active: false },
}

export const Glass: Story = {
  args: { ...Basic.args, glass: true, style: { maxWidth: 320 } },
}

export const WithStatusBar: Story = {
  args: {
    ...Basic.args,
    statusBar: (
      <StatusBar>
        <StatusBar.Field>Press F1 for help</StatusBar.Field>
        <StatusBar.Field>Slide 1</StatusBar.Field>
        <StatusBar.Field>CPU Usage: 14%</StatusBar.Field>
      </StatusBar>
    ),
  },
}

export const Dialog: Story = {
  args: {
    title: 'Problem Diagnostics',
    role: 'dialog',
    'aria-labelledby': 'dialog-title',
    bright: true,
    style: { maxWidth: 360 },
    children: <p>A diagnostic dialog content goes here.</p>,
  },
}
