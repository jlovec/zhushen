import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData/**',
            ],
        },
        alias: {
            // Mock bun-pty for test environment (vitest runs in Node.js, not Bun)
            // bun-pty depends on bun:ffi which is not available in Node.js
            'bun-pty': resolve('./src/__mocks__/bun-pty.ts'),
        }
    },
    resolve: {
        alias: {
            '@': resolve('./src'),
        },
    },
})
