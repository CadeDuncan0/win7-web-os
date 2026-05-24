import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { OptionButton } from '../OptionButton'

import { GroupBox } from './GroupBox'

const meta = {
  title: 'Windows7/GroupBox',
  component: GroupBox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof GroupBox>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    legend: "Today's mood",
    children: (
      <>
        <div>
          <OptionButton id="mood-good" name="mood" label="Good" />
        </div>
        <div>
          <OptionButton id="mood-bad" name="mood" label="Bad" />
        </div>
      </>
    ),
  },
}
