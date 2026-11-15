import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const home = '/concepts/vanguard/ro/';
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Vanguard layout, images and navigation at ${width}px`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(home);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.v-hero-media img')).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
    for (const section of ['.v-hero', '#services', '#projects', '#about', '#contact']) {
      await page.locator(section).scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          page
            .locator(section)
            .locator('img')
            .evaluateAll((images) =>
              images.every(
                (img) =>
                  (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.locator('.v-hero').scrollIntoViewIfNeeded();
    if (width === 390 || width === 1440) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await info.attach(`vanguard-${width}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
    if (width < 768) {
      await page.locator('.v-mobile-menu summary').click();
      await page.locator('.v-mobile-menu a[href="#services"]').click();
      await expect(page.locator('.v-mobile-menu')).not.toHaveAttribute('open');
    } else {
      await page.locator('.v-desktop-nav a[href="#services"]').click();
    }
    await expect(page).toHaveURL(/#services$/);
    await page.locator('.v-service details summary').first().click();
    await expect(page.locator('.v-service details').first()).toHaveAttribute('open');
    expect(errors).toEqual([]);
  });
}
test('Vanguard gallery switching, localization, project details and demo form', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('.vanguard .concept-action').click();
  await expect(page).toHaveURL(home);
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page).toHaveURL('/concepts/vanguard/en/');
  await expect(page.locator('h1')).toContainText('Security');
  await page.locator('.v-project details summary').first().click();
  await expect(page.locator('.v-project details').first()).toContainText(
    'does not represent a real installation',
  );
  await page.getByRole('link', { name: 'Schimbă în română' }).click();
  const mutations: string[] = [];
  page.on('request', (r) => {
    if (!['GET', 'HEAD'].includes(r.method())) mutations.push(r.url());
  });
  await page.getByLabel('Nume', { exact: true }).fill('Demo Person');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Cum vă putem ajuta?').fill('Fictional demonstration inquiry.');
  await page.locator('[data-field="consent"]').check();
  await page.getByRole('button', { name: 'Testează formularul' }).click();
  await expect(page.locator('.form-feedback')).toContainText('nu a fost trimis');
  expect(mutations).toEqual([]);
  await page.locator('.concept-menu summary').click();
  await expect(page.locator('.concept-menu [aria-current]')).toHaveText('02 / Vanguard');
  await page.locator('.concept-menu a').filter({ hasText: '01 / Sentinel' }).click();
  await expect(page).toHaveURL('/concepts/sentinel/ro/');
});
test('Vanguard reduced motion and accessibility in both languages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const lang of ['ro', 'en']) {
    await page.goto(`/concepts/vanguard/${lang}/`);
    await page.locator('#about').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    expect(
      await page
        .locator('[data-v-enter]')
        .evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1')),
    ).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
});
test('Vanguard content and mobile navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4321',
  });
  const page = await context.newPage();
  await page.goto(home);
  await page.locator('.v-mobile-menu summary').click();
  await page.locator('.v-mobile-menu a[href="#projects"]').click();
  await expect(page).toHaveURL(/#projects$/);
  await page.locator('.v-mobile-menu summary').click();
  await page.locator('.v-project details summary').first().click();
  await expect(page.locator('.v-project details').first()).toHaveAttribute('open');
  await expect(page.locator('#contact noscript')).toBeVisible();
  await context.close();
});
