import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true, // Enables global variables like `expect` and `test`
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
})
