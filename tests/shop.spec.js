const { test, expect } = require('@playwright/test');

test('shop displays new animal skins and accessories', async ({ page }) => {
  await page.goto('/');

  // 1. Get Coins for testing (Need ~3000+ for all items)
  await page.click('button:has-text("💰 +1000")');
  await page.click('button:has-text("💰 +1000")');
  await page.click('button:has-text("💰 +1000")');
  await page.click('button:has-text("💰 +1000")'); // 4000 coins just in case

  // Navigate to shop tab
  await page.click('button:has-text("ショップ")');

  // --- Verify Rabbit Flow ---
  // Buy Rabbit Skin (Auto-equips)
  await page.click('.shop-item:has-text("うさぎの着ぐるみ")');
  await expect(page.locator('.shop-item:has-text("うさぎの着ぐるみ")')).toContainText('変身中');

  // Verify Rabbit Accessories are visible
  await expect(page.locator('.shop-item:has-text("人参")')).toBeVisible();
  await expect(page.locator('.shop-item:has-text("リボン")')).toBeVisible();
  await expect(page.locator('.shop-item:has-text("サングラス")')).toBeVisible();

  // --- Verify Panda Flow ---
  // Buy Panda Skin (Auto-equips)
  await page.click('.shop-item:has-text("パンダスーツ")');
  await expect(page.locator('.shop-item:has-text("パンダスーツ")')).toContainText('変身中');

  // Verify Panda Accessories are visible
  await expect(page.locator('.shop-item:has-text("笹")')).toBeVisible();
  await expect(page.locator('.shop-item:has-text("リンゴ")')).toBeVisible();
  await expect(page.locator('.shop-item:has-text("ボール")')).toBeVisible();

  // --- Verify Cat Flow ---
  // Buy Cat Skin (Auto-equips)
  await page.click('.shop-item:has-text("黒猫パーカー")');
  await expect(page.locator('.shop-item:has-text("黒猫パーカー")')).toContainText('変身中');

  // Verify Cat Accessories are visible
  await expect(page.locator('.shop-item:has-text("鈴")')).toBeVisible();
  await expect(page.locator('.shop-item:has-text("魚")')).toBeVisible();
  await expect(page.locator('.shop-item:has-text("毛糸玉")')).toBeVisible();
});
