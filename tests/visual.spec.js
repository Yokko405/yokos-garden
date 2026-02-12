const { test, expect } = require('@playwright/test');

test('homepage has title and critical elements', async ({ page }) => {
  await page.goto('/');

  // Title check
  await expect(page).toHaveTitle(/HabiTora/);

  // Check for main elements
  await expect(page.locator('.tiger-box')).toBeVisible();
  await expect(page.locator('.header')).toBeVisible();

  // Check default tiger state
  const tigerBox = page.locator('.tiger-box');
  await expect(tigerBox).toBeVisible();

  // Verify default skin is normal
  await expect(tigerBox).toHaveClass(/skin-normal/);
});
