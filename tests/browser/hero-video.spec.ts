import { test, expect } from '@playwright/test';
const home = '/concepts/sentinel/ro/';
const asset = '/media/sentinel-hero-security-camera.mp4';
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`hero video plays without changing layout at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(home);
    const video = page.locator('video.sentinel-camera-video');
    await expect(video).toHaveClass(/is-playing/);
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(0);
    expect(
      await video.evaluate((v: HTMLVideoElement) => ({
        muted: v.muted,
        loop: v.loop,
        autoplay: v.autoplay,
        inline: v.playsInline,
        controls: v.controls,
        rate: v.playbackRate,
        src: new URL(v.currentSrc).pathname,
        fit: getComputedStyle(v).objectFit,
        filter: getComputedStyle(v).filter,
      })),
    ).toEqual({
      muted: true,
      loop: true,
      autoplay: true,
      inline: true,
      controls: false,
      rate: 1,
      src: asset,
      fit: 'cover',
      filter: 'none',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero .actions a')).toHaveCount(2);
    const before = await page.locator('.hero').boundingBox();
    await video.evaluate((v: HTMLVideoElement) => {
      v.currentTime = v.duration - 0.2;
    });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeLessThan(2);
    expect(await page.locator('.hero').boundingBox()).toEqual(before);
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `docs/hero-video-${width}.png` });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(video).toHaveCount(0);
    await expect(page.locator('.hero-image')).toBeVisible();
    expect(await page.locator('.hero').boundingBox()).toEqual(before);
    expect(errors).toEqual([]);
  });
}
test('reduced motion avoids video requests; English and gallery remain static', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('.mp4')) requests.push(r.url());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(home);
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('.hero-image')).toBeVisible();
  expect(requests).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('video')).toHaveClass(/is-playing/);
  for (const path of ['/concepts/sentinel/en/', '/']) {
    await page.goto(path);
    await expect(page.locator('video, [data-sentinel-hero-template]')).toHaveCount(0);
  }
});
test('failed media retains static fallback and working hero links', async ({ page }) => {
  await page.route('**' + asset, (route) => route.abort());
  await page.goto(home);
  await expect(page.locator('.hero-image')).toBeVisible();
  await expect(page.locator('video')).toHaveCSS('opacity', '0');
  await page.locator('.hero .actions a').first().click();
  await expect(page).toHaveURL(/proiecte/);
});
