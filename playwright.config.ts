import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
  },
  snapshotDir: './tests/visual/snapshots',
  updateSnapshots: 'missing',
  timeout: 60000,
});
