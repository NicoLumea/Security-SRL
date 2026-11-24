import { test, expect } from '@playwright/test';
const routes = ['/concepts/vanguard/ro/', '/concepts/vanguard/en/'];

async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function serviceMotion(page: import('@playwright/test').Page) {
  return page.locator('.v-service').first().evaluate(element => ({
    opacity: Number(getComputedStyle(element).opacity),
    y: Number(new DOMMatrixReadOnly(getComputedStyle(element).transform).m42),
  }));
}
for (const route of routes) {
  test(`Vanguard scroll choreography is reversible: ${route}`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route);
    await expect(page.locator('.v-hero h1')).toBeVisible();
    await expect(page.locator('.v-hero-media img')).toBeVisible();
    const serviceTop = await page.locator('.v-service').first().evaluate(element => element.getBoundingClientRect().top + window.scrollY);
    // Approach, enter and reverse across the same scroll region.
    const positions = [serviceTop - 940, serviceTop - 810, serviceTop - 610, serviceTop - 810];
    const samples = [];
    for (const top of positions) {
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), top);
      await settle(page);
      samples.push(await serviceMotion(page));
    }
    expect(samples[0].y).toBeGreaterThan(samples[2].y + 5);
    expect(samples[2].opacity).toBeGreaterThan(samples[0].opacity);
    expect(samples[3].y).toBeGreaterThan(samples[2].y + 5);
    expect(Math.abs(samples[3].y - samples[1].y)).toBeLessThan(2);
    // Rapid direction changes must restore the same progress without jumping.
    await page.evaluate(y => {
      window.scrollTo({ top: y + 100, behavior: 'instant' });
      window.scrollTo({ top: y, behavior: 'instant' });
    }, positions[1]);
    await settle(page);
    const restored = await serviceMotion(page);
    expect(Math.abs(restored.y - samples[1].y)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await info.attach(`vanguard-motion-${route.includes('/ro/') ? 'ro' : 'en'}`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: 'image/png',
    });
  });
}
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Vanguard animation has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(routes[0]);
    for (const selector of ['#services', '#projects', '#about', '#contact', '.v-hero']) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await settle(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator(selector)).toBeVisible();
    }
    const img = page.locator('.v-project-image img').first();
    await expect.poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    expect(await img.evaluate((element: HTMLImageElement) => getComputedStyle(element).objectFit)).toBe('cover');
  });
}
test('reduced motion changes stop all motion without hiding content', async ({ page }) => {
  await page.goto(routes[0]);
  await page.locator('#services').scrollIntoViewIfNeeded();
  await settle(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect(await page.locator('.v-service').first().evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  expect(await page.locator('.v-service').first().evaluate(e => getComputedStyle(e).transform)).toBe('none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await settle(page);
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-v-motion-active'))).toBe(false);
  // The class is on the body, not documentElement.
  expect(await page.locator('body').getAttribute('data-v-motion-active')).not.toBeNull();
});
test('keyboard focus and demonstration form remain stable while scrolling', async ({ page }) => {
  await page.goto(routes[0]);
  await page.getByLabel('Nume', { exact: true }).fill('Test Person');
  await page.getByLabel('Email', { exact: true }).fill('test@example.com');
  await page.getByLabel('Cum vă putem ajuta?').fill('An example demonstration message.');
  await page.locator('[data-field=consent]').check();
  await page.getByLabel('Email', { exact: true }).focus();
  const before = await page.locator('.v-form-panel').boundingBox();
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
  await settle(page);
  const after = await page.locator('.v-form-panel').boundingBox();
  expect(before?.width).toEqual(after?.width);
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('test@example.com');
  await page.getByRole('button', { name: 'Testează formularul' }).click();
  await expect(page.locator('.form-feedback')).toContainText('nu a fost trimis');
});
