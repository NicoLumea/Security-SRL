import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const home = '/concepts/sentinel/ro/';
test('gallery, switcher, language and project detail navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.concept-card')).toHaveCount(4);
  await expect(page.locator('.concept-action[href]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Explorează conceptul' }).click();
  await expect(page).toHaveURL(new RegExp(home));
  await page.locator('.concept-menu summary').click();
  await expect(page.locator('.concept-menu [aria-disabled=true]')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Switch to English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /Security begins\s*with trust\./,
  );
  await page.getByRole('link', { name: 'Discover the projects', exact: true }).click();
  await page.locator('.project-card a').first().click();
  await expect(page.locator('.detail-cover img')).toBeVisible();
  await page.getByRole('link', { name: 'Schimbă în română' }).click();
  await expect(page).toHaveURL(/exemplu-spatiu-comercial/);
});
for (const width of [320, 390, 768, 1024, 1440])
  test(`layout and images at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', home, home + 'proiecte/', home + 'servicii/', home + 'contact/']) {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      expect(
        await page
          .locator('img')
          .evaluateAll((imgs) =>
            imgs
              .filter((i) => i.getAttribute('loading') !== 'lazy')
              .every(
                (i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0,
              ),
          ),
      ).toBe(true);
    }
  });
test('mobile menu, form validation and no data transmission', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(home);
  await page.getByLabel('Meniu', { exact: true }).first().click();
  await page.locator('.mobile-menu nav').getByRole('link', { name: 'Contact' }).click();
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') requests.push(r.url());
  });
  await page.getByRole('button', { name: 'Testează formularul' }).click();
  await expect(page.locator('.form-feedback')).toContainText('Verificați');
  await page.getByLabel('Nume', { exact: true }).fill('Demo Person');
  await page.getByLabel('Email', { exact: true }).fill('demo@example.com');
  await page.getByLabel('Cum vă putem ajuta?').fill('Fictional demonstration inquiry.');
  await page.locator('[data-field=consent]').check();
  await page.getByRole('button', { name: 'Testează formularul' }).click();
  await expect(page.locator('.form-feedback')).toContainText('nu a fost trimis');
  expect(requests).toEqual([]);
});
test('filters and cookie preference persistence', async ({ page }) => {
  await page.goto(home + 'proiecte/');
  await page.locator('[data-project-search]').fill('inexistent');
  await expect(page.locator('[data-empty]')).toBeVisible();
  await page.locator('[data-project-search]').fill('');
  await page.getByRole('button', { name: 'Soluții integrate', exact: true }).click();
  await expect(page.locator('[data-project]:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Preferințe cookie' }).click();
  await page.getByRole('button', { name: 'Doar necesare' }).click();
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('security-srl-consent-v1') || '{}').analytics,
    ),
  ).toBe(false);
});
test('reduced motion, fallback and no-JS navigation', async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(home);
  await expect(page.locator('.hero-image')).toBeVisible();
  await expect(page.locator('video')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    'auto',
  );
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4321',
  });
  const plain = await context.newPage();
  await plain.goto(home);
  await plain.getByRole('link', { name: 'Descoperă proiectele', exact: true }).click();
  await expect(plain).toHaveURL(/proiecte/);
  await context.close();
});
test('primary pages have no serious accessibility violations', async ({ page }) => {
  // Scan fully visible content, not a transient frame of the scroll reveal fade.
  // Other browser tests retain normal motion; no axe rules or content are excluded.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', home, home + 'contact/', home + 'proiecte/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
