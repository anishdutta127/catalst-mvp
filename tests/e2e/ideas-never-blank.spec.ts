import { test, expect } from '@playwright/test';

/**
 * Verify S09 NEVER shows blank — the triple fallback guarantee.
 *
 * Approach: Navigate the full journey quickly using data-testid selectors.
 * After S08 completes (max 35s), verify exactly 3 idea cards are visible.
 */
test('S09 always shows 3 ideas after full journey', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('http://localhost:3000/journey');
  await page.waitForLoadState('networkidle');

  // S00
  await page.locator('[data-testid="name-input"]').fill('Test');
  await page.locator('[data-testid="s00-cta"]').click({ timeout: 3000 });
  await page.waitForTimeout(600);

  // S01
  await page.locator('[data-testid="path-a-card"]').click({ timeout: 3000 });
  await page.waitForTimeout(600);

  // S02: 3 blots
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-testid="blot-option-0"]').click({ timeout: 5000 });
    await page.waitForTimeout(600);
  }

  // S03: 3 words
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-testid="word-left"]').click({ timeout: 5000 });
    await page.waitForTimeout(600);
  }

  // S04: keep 2 industries via dispatchEvent (bypasses viewport/stability checks)
  await page.waitForTimeout(800);
  for (let k = 0; k < 2; k++) {
    const cards = page.locator('[data-testid^="industry-card-"]');
    await cards.nth(k).dispatchEvent('click');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="keep-btn"]').dispatchEvent('click');
    await page.waitForTimeout(500);
  }
  await page.locator('[data-testid="continue-btn"]').dispatchEvent('click');
  await page.waitForTimeout(800);

  // S06: 3 orbs
  for (const id of ['Grit', 'Vision', 'Craft']) {
    await page.locator(`[data-testid="orb-${id}"]`).click({ timeout: 5000 });
    await page.waitForTimeout(200);
  }
  await page.locator('[data-testid="confirm-crystal"]').click({ timeout: 3000 });
  await page.waitForTimeout(600);

  // S07: headline + constraints
  await page.locator('[data-testid="headline-card-0"]').click({ timeout: 5000 });
  await page.waitForTimeout(400);
  await page.locator('[data-testid="time-15-30h"]').click({ timeout: 3000 });
  await page.locator('[data-testid="resource-Small budget ($1-10K)"]').click({ timeout: 3000 });
  await page.waitForTimeout(200);
  await page.locator('[data-testid="reveal-btn"]').click({ timeout: 3000 });
  await page.waitForTimeout(1000);

  // S08: Wait for forge to complete and advance to S09
  // The forge should auto-advance after 8s animation + engine result
  const nestCard = page.locator('[data-testid="idea-card-nest"]');
  await expect(nestCard).toBeVisible({ timeout: 35000 });

  // THE CRITICAL ASSERTION: all 3 idea cards visible, never blank
  await expect(page.locator('[data-testid="idea-card-nest"]')).toBeVisible();
  await expect(page.locator('[data-testid="idea-card-spark"]')).toBeVisible();
  await expect(page.locator('[data-testid="idea-card-wildvine"]')).toBeVisible();

  // Verify cards have actual content (not empty)
  const nestText = await nestCard.textContent();
  expect(nestText).toBeTruthy();
  expect(nestText!.length).toBeGreaterThan(10);
});
