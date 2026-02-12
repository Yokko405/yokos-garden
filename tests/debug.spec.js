const { test, expect } = require('@playwright/test');

test('debug button adds coins', async ({ page }) => {
  await page.goto('/');

  // Initial coin check (starts at 0)
  const coinDisplay = page.locator('.stat-box').filter({ hasText: 'コイン' }).locator('.stat-value');
  await expect(coinDisplay).toHaveText('0');

  // Click debug button
  await page.click('button:has-text("💰 +1000")');

  // Verify coins increased
  await expect(coinDisplay).toHaveText('1000');
});
