import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Provider } from 'react-redux'

import { setupStore } from '@/store'

import { IconGrid } from './IconGrid'

const meta = {
  title: 'Desktop/IconGrid',
  component: IconGrid,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => {
      const store = setupStore()
      return (
        <Provider store={store}>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--desktop-backdrop) center / cover no-repeat',
              padding: 'var(--dsk-grid-padding)',
            }}
          >
            <Story />
          </div>
        </Provider>
      )
    },
  ],
} satisfies Meta<typeof IconGrid>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultLayout: Story = {
  args: {
    icons: [
      {
        id: 'icon-1',
        label: 'My Computer',
        iconSrc: '/imgs/desktop/icons/computer.png',
        windowKind: 'welcome',
        windowTitle: 'My Computer',
      },
      {
        id: 'icon-2',
        label: 'Recycle Bin',
        iconSrc: '/imgs/desktop/icons/recycle-bin.png',
        windowKind: 'welcome',
        windowTitle: 'Recycle Bin',
      },
      {
        id: 'icon-3',
        label: 'Internet Explorer',
        iconSrc: '/imgs/desktop/icons/ie.png',
        windowKind: 'welcome',
        windowTitle: 'Internet Explorer',
      },
    ],
  },
}

export const WithSelectedIcon: Story = {
  args: {
    icons: [
      {
        id: 'icon-1',
        label: 'My Computer',
        iconSrc: '/imgs/desktop/icons/computer.png',
        windowKind: 'welcome',
        windowTitle: 'My Computer',
      },
      {
        id: 'icon-2',
        label: 'Recycle Bin',
        iconSrc: '/imgs/desktop/icons/recycle-bin.png',
        windowKind: 'welcome',
        windowTitle: 'Recycle Bin',
      },
      {
        id: 'icon-3',
        label: 'Internet Explorer',
        iconSrc: '/imgs/desktop/icons/ie.png',
        windowKind: 'welcome',
        windowTitle: 'Internet Explorer',
      },
    ],
  },
}

export const ManyIcons: Story = {
  args: {
    icons: [
      {
        id: 'icon-1',
        label: 'My Computer',
        iconSrc: '/imgs/desktop/icons/computer.png',
        windowKind: 'welcome',
        windowTitle: 'My Computer',
      },
      {
        id: 'icon-2',
        label: 'Recycle Bin',
        iconSrc: '/imgs/desktop/icons/recycle-bin.png',
        windowKind: 'welcome',
        windowTitle: 'Recycle Bin',
      },
      {
        id: 'icon-3',
        label: 'Internet Explorer',
        iconSrc: '/imgs/desktop/icons/ie.png',
        windowKind: 'welcome',
        windowTitle: 'Internet Explorer',
      },
      {
        id: 'icon-4',
        label: 'Projects',
        iconSrc: '/imgs/desktop/icons/folder.png',
        windowKind: 'welcome',
        windowTitle: 'Projects',
      },
      {
        id: 'icon-5',
        label: 'Resume',
        iconSrc: '/imgs/desktop/icons/document.png',
        windowKind: 'welcome',
        windowTitle: 'Resume',
      },
      {
        id: 'icon-6',
        label: 'Control Panel',
        iconSrc: '/imgs/desktop/icons/settings.png',
        windowKind: 'welcome',
        windowTitle: 'Control Panel',
      },
      {
        id: 'icon-7',
        label: 'Network',
        iconSrc: '/imgs/desktop/icons/network.png',
        windowKind: 'welcome',
        windowTitle: 'Network',
      },
      {
        id: 'icon-8',
        label: 'Notepad',
        iconSrc: '/imgs/desktop/icons/notepad.png',
        windowKind: 'welcome',
        windowTitle: 'Notepad',
      },
    ],
  },
}
