import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'vitest/config';
import path from 'path';

loadEnvConfig(process.cwd());

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 120000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
