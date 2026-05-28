import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Spinner } from './Spinner'

const meta = {
  title: 'Windows7/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

export const Spinning: Story = { args: { variant: 'spinner', 'aria-label': 'Spinning' } }
export const Loader: Story = { args: { variant: 'loader', 'aria-label': 'Loading' } }
export const LoaderAnimated: Story = { args: { variant: 'loading', 'aria-label': 'Processing' } }
