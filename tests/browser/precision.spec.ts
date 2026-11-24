import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const home = '/concepts/precision/ro/';
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Precision layout and navigation at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(home);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.p-project')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 768) {
      await page.locator('.p-mobile-menu summary').click();
      await page.locator('.p-mobile-menu a[href="#services"]').click();
    } else {
      await page.locator('.p-desktop-nav a[href="#services"]').click();
    }
    await expect(page).toHaveURL(/#services$/);
    await page.locator('[data-p-next]').click();
    await expect(page.locator('[data-p-card][data-slot="center"]')).toHaveAttribute('data-index', '1');
    if (width === 390 || width === 1440) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(home);
      await page.evaluate(() => document.fonts.ready);
      await info.attach(`precision-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    }
  });
}
test('Precision gallery, localization, demonstration-only form', async ({ page }) => {
  await page.goto('/');
  await page.locator('.precision .concept-action').click();
  await expect(page).toHaveURL(home);
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL('/concepts/precision/en/');
  await expect(page.locator('h1')).toContainText('Protection');
  await page.getByRole('link', { name: 'Schimbă în română' }).click();
  const mutations: string[] = [];
  page.on('request', r => { if (!['GET', 'HEAD'].includes(r.method())) mutations.push(r.url()); });
  await page.getByLabel('Nume', { exact: true }).fill('Demo User');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Cum vă putem ajuta?').fill('Demonstration example only.');
  await page.locator('[data-field="consent"]').check();
  await page.getByRole('button', { name: 'Testează formularul' }).click();
  await expect(page.locator('.form-feedback')).toContainText('nu a fost trimis');
  expect(mutations).toEqual([]);
  await page.locator('.concept-menu summary').click();
  await page.locator('.concept-menu a').filter({ hasText: '02 / Vanguard' }).click();
  await expect(page).toHaveURL('/concepts/vanguard/ro/');
});
test('Precision accessibility both languages and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const lang of ['ro', 'en']) {
    await page.goto(`/concepts/precision/${lang}/`);
    await page.evaluate(() => document.fonts.ready);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  }
});
test('Precision mobile navigation works without JS', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 }, baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4321' });
  const page = await context.newPage();
  await page.goto(home);
  await page.locator('.p-mobile-menu summary').click();
  await page.locator('.p-mobile-menu a[href="#projects"]').click();
  await expect(page).toHaveURL(/#projects$/);
  await context.close();
});
