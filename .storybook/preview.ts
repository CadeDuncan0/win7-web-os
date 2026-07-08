import type { Preview } from '@storybook/nextjs-vite'

import '../src/app/globals.css'

/* ─── Aero Wallpaper backdrop ─────────────────────────────────────────────
   Mirrors the radial bloom used in the temporary src/app/page.tsx demo so
   glass stories preview against the same backdrop the production desktop
   will paint. backdrop-filter renders nothing without something behind it
   to sample — this gradient IS that something. Lives at the iframe body
   level (root compositing layer) rather than inside each story wrapper,
   so blur sampling is not flattened by an intermediate stacking context.
   ─────────────────────────────────────────────────────────────────────── */
const aeroWallpaper = `
  radial-gradient(ellipse 55% 40% at 30% 30%, rgba(180, 220, 255, 0.7) 0%, transparent 60%),
  radial-gradient(ellipse 70% 50% at 75% 75%, rgba(94, 174, 253, 0.5) 0%, transparent 65%),
  radial-gradient(circle at 50% 50%, #0078d7 0%, #003399 90%)
`

const preview: Preview = {
  parameters: {
    // Mount the App Router context so components that call useRouter() from
    // next/navigation (StartMenu sign-out, Taskbar) render in Storybook instead
    // of throwing "expected app router to be mounted". Auto-mocks next/navigation.
    nextjs: {
      appDirectory: true,
    },

    backgrounds: {
      options: {
        aero: { name: 'Aero Wallpaper', value: aeroWallpaper },
        light: { name: 'Light', value: '#ffffff' },
        neutral: { name: 'Neutral Dark', value: '#2a2f36' },
      },
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      //
      // Phase 3 enforces STRUCTURAL a11y (roles, accessible names, keyboard) via
      // the unit-project RTL sweep (src/app/win7/desktop/crossCutting.test.tsx).
      // Flipping this to 'error' makes axe a per-story CI gate — that is the
      // Phase 4 formal accessibility audit (it surfaces outstanding non-contrast
      // violations across the component stories that the product owner must
      // triage). Kept at 'todo' so Phase 3 does not turn that audit into a
      // ship-blocker.
      test: 'todo',
      // Color contrast is bound to the authentic Win7 Aero palette (a fixed,
      // product-owner-controlled design constraint); it is owned by the Phase 4
      // audit, not a Phase 3 ship-blocker. axe RunOptions per addon-a11y 10.
      options: {
        rules: {
          'color-contrast': { enabled: false },
        },
      },
    },
  },

  /* Storybook 9+/10 globals API — preferred over the deprecated
     `parameters.backgrounds.default`. Sets the initial selection without
     locking individual stories out of overriding via their own meta. */
  initialGlobals: {
    backgrounds: { value: 'aero' },
  },
}

export default preview
