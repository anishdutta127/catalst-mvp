import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 360, height: 780 },
  { name: 'tablet', width: 720, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const routes = [
  { name: 's00-gateway', path: '/journey' },
];

for (const vp of viewports) {
  for (const route of routes) {
    test(`${route.name} @ ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:3000${route.path}`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(
        `${route.name}-${vp.name}.png`,
        { fullPage: true, threshold: 0.05 }
      );
    });
  }
}
