import { test, expect } from '@playwright/test';
const ro = '/concepts/precision/ro/';
const en = '/concepts/precision/en/';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('security-srl-consent-v1', JSON.stringify({
      version: 1, at: Date.now(), analytics: false, marketing: false,
    }));
  });
});
const selected = (page: import('@playwright/test').Page) =>
  page.locator('[data-p-card] [aria-pressed="true"]');
for (const path of [ro, en]) {
  test(`Precision categories automatically rotate and loop in ${path}`, async ({ page }) => {
    await page.clock.install();
    await page.goto(path);
    const cards = page.locator('[data-p-card]');
    await expect(cards).toHaveCount(4);
    await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '0');
    await expect(page.locator('[data-p-detail] h3')).toHaveText(await cards.first().getAttribute('data-title') || '');
    // Clock advances one five-second step at a time, without waiting in real time.
    for (let i = 1; i <= 4; i++) {
      await page.clock.fastForward(5100);
      await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', String(i % 4));
      await page.clock.fastForward(400);
      const card = cards.nth(i % 4);
      await expect(page.locator('[data-p-title]')).toHaveText(await card.getAttribute('data-title') || '');
      await expect(page.locator('[data-p-description]')).toHaveText(await card.getAttribute('data-detail') || '');
      await expect(selected(page)).toHaveCount(1);
    }
  });
}
test('Precision interaction stops autoplay until explicitly resumed', async ({ page }) => {
  await page.clock.install();
  await page.goto(ro);
  await page.locator('[data-p-next]').click();
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '1');
  await page.clock.fastForward(15000);
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '1');
  await page.locator('[data-p-select]').nth(2).click();
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '2');
  await page.locator('[data-p-toggle]').click();
  await page.locator('.p-hero h1').click();
  await page.clock.fastForward(5200);
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '3');
  await page.locator('[data-p-prev]').click();
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '2');
});
test('Precision hover and focus suspend automatic cycling', async ({ page }) => {
  await page.clock.install();
  await page.goto(en);
  const widget = page.locator('[data-p-carousel]');
  await widget.hover();
  await page.clock.fastForward(12000);
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '0');
  await page.mouse.move(0, 0);
  await page.clock.fastForward(5100);
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '1');
  await page.locator('[data-p-toggle]').focus();
  await expect(page.locator('[data-p-toggle]')).toBeFocused();
  const index = await page.locator('[data-p-card][data-slot="center"]').getAttribute('data-index');
  await page.clock.fastForward(12000);
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', index || '');
});
test('Reduced motion disables cycling but preserves all manual controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto(ro);
  await expect(page.locator('[data-p-toggle]')).toBeDisabled();
  await page.clock.fastForward(22000);
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '0');
  await page.locator('[data-p-next]').click();
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '1');
  await expect(page.locator('[data-p-detail]')).not.toHaveClass(/is-changing/);
  await expect(page.locator('[data-p-description]')).toHaveText(await page.locator('[data-p-card]').nth(1).getAttribute('data-detail') || '');
});
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Precision carousel is responsive at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ro);
    await expect(page.locator('[data-p-card]')).toHaveCount(4);
    await expect(page.locator('[data-p-card][data-slot="center"]')).toBeVisible();
    await page.locator('[data-p-next]').click();
    await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const h = await page.locator('.p-category-viewport').boundingBox();
    await page.locator('[data-p-prev]').click();
    expect((await page.locator('.p-category-viewport').boundingBox())?.height).toBe(h?.height);
    if (width === 390 || width === 1440)
      await info.attach(`precision-categories-${width}`, { body: await page.locator('#services').screenshot(), contentType: 'image/png' });
  });
}
test('Without JS, every category description remains available', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4321' });
  const page = await context.newPage();
  await page.goto(ro);
  await expect(page.locator('[data-p-card]')).toHaveCount(4);
  await expect(page.locator('.p-category-carousel')).not.toHaveClass(/is-ready/);
  await expect(page.locator('.p-category-nojs-description').first()).toBeVisible();
  await expect(page.locator('.p-category-nojs-description')).toHaveCount(4);
  await context.close();
});
test('Keyboard selection and accessible labels', async ({ page }) => {
  await page.goto(en);
  await page.locator('[data-p-select]').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '1');
  await expect(page.locator('[data-p-select]').nth(1)).toBeFocused();
  await expect(page.locator('[data-p-select]').nth(1)).toHaveAttribute('aria-describedby', 'p-category-description-1');
  await expect(page.locator('[data-p-toggle]')).toHaveAttribute('aria-pressed', 'false');
});
