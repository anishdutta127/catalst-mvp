import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 360, height: 780 },
  { name: 'tablet', width: 720, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const vp of viewports) {
  test(`test-messages @ ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/journey/test-messages');
    await page.waitForLoadState('networkidle');

    // Wait 2s: msg 1 (Cedric, T=0) and msg 2 (Pip, T=1.5s) both visible
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot(
      `test-messages-${vp.name}.png`,
      { fullPage: true, threshold: 0.05 }
    );
  });
}
