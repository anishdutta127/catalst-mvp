import { test, expect } from '@playwright/test';

/**
 * Full Path A happy path — S00 through S11.
 * Uses data-testid selectors for reliable element targeting.
 */
test('complete Path A journey', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('http://localhost:3000/journey');
  await page.waitForLoadState('networkidle');

  // S00: Enter name
  const nameInput = page.locator('[data-testid="name-input"]');
  await expect(nameInput).toBeVisible({ timeout: 3000 });
  await nameInput.fill('Anish');
  await page.waitForTimeout(300);

  // CTA should appear
  const s00Cta = page.locator('[data-testid="s00-cta"]');
  await expect(s00Cta).toBeVisible({ timeout: 2000 });
  await s00Cta.click();
  await page.waitForTimeout(800);

  // S01: Choose Path A
  const pathA = page.locator('[data-testid="path-a-card"]');
  await expect(pathA).toBeVisible({ timeout: 3000 });
  await pathA.click();
  await page.waitForTimeout(800);

  // S02: Complete 3 blots (click first option each time)
  for (let i = 0; i < 3; i++) {
    const option = page.locator('[data-testid="blot-option-0"]');
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
    await page.waitForTimeout(600);
  }

  // S03: Complete 3 words (click left choice each time)
  for (let i = 0; i < 3; i++) {
    const leftChoice = page.locator('[data-testid="word-left"]');
    await expect(leftChoice).toBeVisible({ timeout: 5000 });
    await leftChoice.click();
    await page.waitForTimeout(600);
  }

  // S04: Keep 2 industries via dispatchEvent (bypasses viewport/stability checks)
  await page.waitForTimeout(800);
  for (let k = 0; k < 2; k++) {
    const cards = page.locator('[data-testid^="industry-card-"]');
    await cards.nth(k).dispatchEvent('click');
    await page.waitForTimeout(500);
    await page.locator('[data-testid="keep-btn"]').dispatchEvent('click');
    await page.waitForTimeout(500);
  }
  const continueBtn = page.locator('[data-testid="continue-btn"]');
  await continueBtn.dispatchEvent('click');
  await page.waitForTimeout(800);

  // S06: Select 3 orbs
  for (const orbId of ['Grit', 'Vision', 'Craft']) {
    const orb = page.locator(`[data-testid="orb-${orbId}"]`);
    await expect(orb).toBeVisible({ timeout: 5000 });
    await orb.click();
    await page.waitForTimeout(300);
  }
  const confirmCrystal = page.locator('[data-testid="confirm-crystal"]');
  await expect(confirmCrystal).toBeVisible({ timeout: 2000 });
  await confirmCrystal.click();
  await page.waitForTimeout(800);

  // S07: Select headline + constraints
  const headline = page.locator('[data-testid="headline-card-0"]');
  await expect(headline).toBeVisible({ timeout: 5000 });
  await headline.click();
  await page.waitForTimeout(600);

  // Time budget
  const timePill = page.locator('[data-testid="time-15-30h"]');
  await expect(timePill).toBeVisible({ timeout: 3000 });
  await timePill.click();

  // Resource level
  const resPill = page.locator('[data-testid="resource-Small budget ($1-10K)"]');
  await expect(resPill).toBeVisible({ timeout: 3000 });
  await resPill.click();
  await page.waitForTimeout(300);

  // Reveal
  const revealBtn = page.locator('[data-testid="reveal-btn"]');
  await expect(revealBtn).toBeVisible({ timeout: 2000 });
  await revealBtn.click();
  await page.waitForTimeout(1000);

  // S08: Wait for forge to complete (max 35s)
  // Forge should show crystal animation then auto-advance
  const forgePhase = page.locator('[data-testid="forge-phase"]');
  await expect(forgePhase).toBeVisible({ timeout: 5000 });

  // Wait for S09 — idea cards should appear
  const nestCard = page.locator('[data-testid="idea-card-nest"]');
  await expect(nestCard).toBeVisible({ timeout: 35000 });

  // S09: Verify 3 ideas loaded — NEVER blank
  await expect(page.locator('[data-testid="idea-card-nest"]')).toBeVisible();
  await expect(page.locator('[data-testid="idea-card-spark"]')).toBeVisible();
  await expect(page.locator('[data-testid="idea-card-wildvine"]')).toBeVisible();

  // Crown the nest idea
  await nestCard.click();
  await page.waitForTimeout(500);

  // CTA should appear
  const crownCta = page.locator('[data-testid="crown-cta"]');
  await expect(crownCta).toBeVisible({ timeout: 3000 });
  await crownCta.click();
  await page.waitForTimeout(1500);

  // S10: Wait for sorting ceremony → auto-advances to S11 (no CTA button)
  const houseWinner = page.locator('[data-testid="house-winner"]');
  await expect(houseWinner).toBeVisible({ timeout: 10000 });

  // S10 auto-advances after ceremony completes (~12s total)
  // Wait for S11 founder card to appear
  const founderCard = page.locator('[data-testid="founder-card"]');
  await expect(founderCard).toBeVisible({ timeout: 20000 });

  const downloadBtn = page.locator('[data-testid="download-btn"]');
  await expect(downloadBtn).toBeVisible();

  // Verify consultation trigger exists
  const consultTrigger = page.locator('[data-testid="consultation-trigger"]');
  await expect(consultTrigger).toBeVisible();

  // Take final screenshot
  await page.screenshot({ path: 'test-results/e2e-path-a-complete.png', fullPage: true });
});
