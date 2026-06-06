import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: false,
    allowCypressEnv: false,
    setupNodeEvents(_on, config) {
      return config
    },
  },
})
