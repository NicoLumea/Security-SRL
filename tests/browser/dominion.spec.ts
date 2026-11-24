import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const home = '/concepts/dominion/ro/';
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Dominion responsive layout and navigation at ${width}px`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(home);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.d-project')).toHaveCount(2);
    for (const section of ['.d-hero', '#services', '#about', '#projects', '#contact']) {
      await page.locator(section).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    if (width < 768) {
      await page.locator('.d-mobile-nav summary').click();
      await page.locator('.d-mobile-nav a[href="#services"]').click();
      await expect(page.locator('.d-mobile-nav')).not.toHaveAttribute('open');
    } else {
      await page.locator('.d-desktop-nav a[href="#services"]').click();
    }
    await expect(page).toHaveURL(/#services$/);
    await page.locator('.d-service details summary').first().click();
    await expect(page.locator('.d-service details').first()).toHaveAttribute('open');
    if (width === 390 || width === 1440) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(home);
      await page.evaluate(() => document.fonts.ready);
      await info.attach(`dominion-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    }
    expect(errors).toEqual([]);
  });
}
test('Dominion is selectable and both languages work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.concept-action[href]')).toHaveCount(4);
  await page.locator('.dominion .concept-action').click();
  await expect(page).toHaveURL(home);
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL('/concepts/dominion/en/');
  await expect(page.locator('h1')).toContainText('PRESENCE.');
  await page.getByRole('link', { name: 'Schimbă în română' }).click();
  await expect(page).toHaveURL(home);
  await page.locator('.concept-menu summary').click();
  await page.locator('.concept-menu a').filter({ hasText: '03 / Precision' }).click();
  await expect(page).toHaveURL('/concepts/precision/ro/');
});
test('Dominion demonstration form does not submit data', async ({ page }) => {
  await page.goto(home);
  const mutations: string[] = [];
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) mutations.push(request.url());
  });
  await page.getByRole('button', { name: 'Testează formularul' }).click();
  await expect(page.locator('.form-feedback')).toContainText('Verificați');
  await page.getByLabel('Nume', { exact: true }).fill('Demo Visitor');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Cum vă putem ajuta?').fill('This is a fictional demonstration inquiry.');
  await page.locator('[data-field="consent"]').check();
  await page.getByRole('button', { name: 'Testează formularul' }).click();
  await expect(page.locator('.form-feedback')).toContainText('nu a fost trimis');
  expect(mutations).toEqual([]);
});
test('Dominion accessibility, reduced motion and no-JS menu', async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const lang of ['ro', 'en']) {
    await page.goto(`/concepts/dominion/${lang}/`);
    await page.evaluate(() => document.fonts.ready);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 }, baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4321' });
  const noJs = await context.newPage();
  await noJs.goto(home);
  await noJs.locator('.d-mobile-nav summary').click();
  await noJs.locator('.d-mobile-nav a[href="#projects"]').click();
  await expect(noJs).toHaveURL(/#projects$/);
  await context.close();
});
