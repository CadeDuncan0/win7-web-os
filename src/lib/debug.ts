const isDev = process.env.NODE_ENV === 'development'

export const debug = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[debug]', ...args) // eslint-disable-line no-console
    }
  },
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error('[debug]', ...args) // eslint-disable-line no-console
    }
  },
}
