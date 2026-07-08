/** Stories exercise the Desktop shell's three stacking layers
 *  (icons, windows, overlay) using inline mock components. */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Desktop } from './Desktop'
import { Window } from '@/components/windows7/Window'

const meta = {
  title: 'Desktop/Desktop',
  component: Desktop,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Desktop>

export default meta

type Story = StoryObj<typeof meta>

function MockIconGrid() {
  const icons = ['My Computer', 'Recycle Bin', 'Internet Explorer', 'Getting Started']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {icons.map((label) => (
        <div
          key={label}
          style={{
            width: 75,
            height: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 4,
              background: 'rgba(100, 160, 220, 0.6)',
            }}
          />
          <span
            style={{
              color: '#fff',
              fontSize: 11,
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              textAlign: 'center',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

function MockWindow() {
  return (
    <div style={{ position: 'absolute', top: 60, left: 120, pointerEvents: 'auto' }}>
      <Window title="Test Window" style={{ width: 400, height: 300 }}>
        <p>Window content renders above the icon layer.</p>
      </Window>
    </div>
  )
}

function MockContextMenu() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 200,
        left: 300,
        pointerEvents: 'auto',
        background: '#f0f0f0',
        border: '1px solid #999',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.3)',
        padding: '4px 0',
        minWidth: 180,
        fontSize: 12,
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      {['View', 'Sort by', 'Refresh', 'Paste', 'Personalize'].map((item) => (
        <div key={item} style={{ padding: '4px 24px', cursor: 'default' }}>
          {item}
        </div>
      ))}
    </div>
  )
}

export const Empty: Story = {
  args: {},
}

export const WithIcons: Story = {
  args: {
    iconGrid: <MockIconGrid />,
  },
}

export const WithActiveWindow: Story = {
  args: {
    iconGrid: <MockIconGrid />,
    windowLayer: <MockWindow />,
  },
}

export const WithContextMenu: Story = {
  args: {
    iconGrid: <MockIconGrid />,
    windowLayer: <MockWindow />,
    overlay: <MockContextMenu />,
  },
}
