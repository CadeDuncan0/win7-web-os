import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Collapse } from './Collapse'

const meta = {
  title: 'Windows7/Collapse',
  component: Collapse,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Collapse>

export default meta

type Story = StoryObj<typeof meta>

export const Closed: Story = {
  args: { summary: 'Expand me to see something interesting', children: <p>Tadah!</p> },
}

export const Open: Story = {
  args: {
    open: true,
    summary: 'I open myself willingly',
    children: (
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    ),
  },
}
