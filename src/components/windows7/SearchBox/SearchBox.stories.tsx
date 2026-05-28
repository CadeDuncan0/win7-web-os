import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SearchBox } from './SearchBox'

const meta = {
  title: 'Windows7/SearchBox',
  component: SearchBox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SearchBox>

export default meta

type Story = StoryObj<typeof meta>

export const Bare: Story = { args: { placeholder: 'Search' } }
export const WithButton: Story = { args: { placeholder: 'Search', withButton: true } }
