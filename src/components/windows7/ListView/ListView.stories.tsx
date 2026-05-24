import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ListView } from './ListView'

const meta = {
  title: 'Windows7/ListView',
  component: ListView,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ListView>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date Taken</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sunset</td>
            <td>6/24/2005</td>
          </tr>
          <tr>
            <td>Cabin Trip</td>
            <td>8/12/2005</td>
          </tr>
        </tbody>
      </>
    ),
  },
}
