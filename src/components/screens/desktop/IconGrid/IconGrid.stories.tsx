// Each story provides a fresh Redux store; icons self-register on mount.

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Provider } from 'react-redux'

import { IconGrid } from './IconGrid'
import { assetPaths } from '@/lib/assetPaths'
import { setupStore } from '@/store'

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
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'My Computer',
      },
      {
        id: 'icon-2',
        label: 'Recycle Bin',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Recycle Bin',
      },
      {
        id: 'icon-3',
        label: 'Internet Explorer',
        iconSrc: assetPaths.desktopIcons.internetExplorer,
        windowKind: 'internet-explorer',
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
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'My Computer',
      },
      {
        id: 'icon-2',
        label: 'Recycle Bin',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Recycle Bin',
      },
      {
        id: 'icon-3',
        label: 'Internet Explorer',
        iconSrc: assetPaths.desktopIcons.internetExplorer,
        windowKind: 'internet-explorer',
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
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'My Computer',
      },
      {
        id: 'icon-2',
        label: 'Recycle Bin',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Recycle Bin',
      },
      {
        id: 'icon-3',
        label: 'Internet Explorer',
        iconSrc: assetPaths.desktopIcons.internetExplorer,
        windowKind: 'internet-explorer',
        windowTitle: 'Internet Explorer',
      },
      {
        id: 'icon-4',
        label: 'Getting Started',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Getting Started',
      },
      {
        id: 'icon-5',
        label: 'Welcome',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Welcome',
      },
      {
        id: 'icon-6',
        label: 'Control Panel',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Control Panel',
      },
      {
        id: 'icon-7',
        label: 'Network',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Network',
      },
      {
        id: 'icon-8',
        label: 'Notepad',
        iconSrc: assetPaths.branding.windowsLogoPng,
        windowKind: 'internet-explorer',
        windowTitle: 'Notepad',
      },
    ],
  },
}
