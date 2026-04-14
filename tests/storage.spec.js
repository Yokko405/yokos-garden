const { test, expect } = require('@playwright/test');

test('homepage recovers from broken localStorage data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('yokosGarden', '{broken-json');
  });

  await page.goto('/');

  await expect(page.locator('.header')).toBeVisible();
  await expect(page.locator('.tiger-message')).toContainText('バックアップ');
});
