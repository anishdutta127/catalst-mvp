import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
  },
  snapshotDir: './tests/visual/snapshots',
  updateSnapshots: 'missing',
});
