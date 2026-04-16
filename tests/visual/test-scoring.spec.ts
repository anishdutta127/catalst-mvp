import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 360, height: 780 },
  { name: 'tablet', width: 720, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const vp of viewports) {
  test(`test-scoring @ ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/journey/test-scoring');
    await page.waitForLoadState('networkidle');

    // Wait for scoring results to render (useMemo runs on mount)
    await page.waitForSelector('text=SPREAD');

    await expect(page).toHaveScreenshot(
      `test-scoring-${vp.name}.png`,
      { fullPage: true, threshold: 0.05 }
    );
  });
}
