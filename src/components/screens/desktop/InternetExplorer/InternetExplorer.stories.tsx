import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Provider } from 'react-redux'
import { userEvent, within } from 'storybook/test'

import { InternetExplorerWindow } from './InternetExplorerWindow'
import { setupStore } from '@/store'

const meta: Meta<typeof InternetExplorerWindow> = {
  title: 'Desktop/InternetExplorer',
  component: InternetExplorerWindow,
  decorators: [
    (Story) => {
      const store = setupStore()
      return (
        <Provider store={store}>
          <div
            style={{
              width: 800,
              height: 500,
              border: '1px solid #999',
              overflow: 'hidden',
            }}
          >
            <Story />
          </div>
        </Provider>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof InternetExplorerWindow>

export const Home: Story = {
  args: {},
}

export const Resume: Story = {
  args: { initialRoute: 'portfolio://resume' },
}

export const Projects: Story = {
  args: { initialRoute: 'portfolio://projects' },
}

export const ExternalLink: Story = {
  args: { initialRoute: 'https://github.com/CadeDuncan' },
}

export const BackDisabled: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Back button is disabled on the initial page.',
      },
    },
  },
}

export const ForwardEnabled: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const resumeBtn = canvas.getByRole('button', { name: 'Resume' })
    await userEvent.click(resumeBtn)
    const backBtn = canvas.getByRole('button', { name: /back/i })
    await userEvent.click(backBtn)
  },
  parameters: {
    docs: {
      description: {
        story: 'Navigate to Resume then go Back — forward button becomes enabled.',
      },
    },
  },
}
