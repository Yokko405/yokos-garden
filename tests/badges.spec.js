const { test, expect } = require('@playwright/test');

test('badges tab displays new accumulation goals', async ({ page }) => {
  await page.goto('/');

  // Navigate to badges tab
  await page.click('button:has-text("バッジ")');

  // Verify new Streak badges
  await expect(page.locator('.badge-name:has-text("2週間")')).toBeVisible();
  await expect(page.locator('.badge-name:has-text("3週間")')).toBeVisible();

  // Verify new Total badges
  await expect(page.locator('.badge-name:has-text("10回達成")')).toBeVisible();
  await expect(page.locator('.badge-name:has-text("30回達成")')).toBeVisible();
});
