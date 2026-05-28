import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TreeView } from './TreeView'

const meta = {
  title: 'Windows7/TreeView',
  component: TreeView,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TreeView>

export default meta

type Story = StoryObj<typeof meta>

export const Flat: Story = {
  args: {
    container: true,
    children: (
      <>
        <li>We can put</li>
        <li>Whatever we want</li>
        <li>In here</li>
      </>
    ),
  },
}

export const Nested: Story = {
  args: {
    container: true,
    collapseButtons: true,
    connectors: true,
    children: (
      <details open>
        <summary>JavaScript</summary>
        <ul>
          <li>Variables</li>
          <li>Functions</li>
        </ul>
      </details>
    ),
  },
}
