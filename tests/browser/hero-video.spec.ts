import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
const home = '/concepts/sentinel/ro/';
const asset = '/media/sentinel-hero-security-camera.mp4';
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`hero video plays without changing layout at ${width}px`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
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
      await info.attach(`hero-video-${width}`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
      if (width === 1440) {
        await info.attach('hero-camera-detail', {
          body: await page.locator('.hero').screenshot(),
          contentType: 'image/png',
        });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(video).toHaveCount(0);
    await expect(page.locator('.hero-image')).toBeVisible();
    expect(await page.locator('.hero').boundingBox()).toEqual(before);
    if (width === 390 || width === 1440) {
      await info.attach(`hero-original-image-${width}`, {
        body: await page.screenshot(),
        contentType: 'image/png',
      });
    }
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

test('Worker CSP permits visible Sentinel playback after switching from Vanguard', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const state = window as typeof window & { cspViolations: string[] };
    state.cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      state.cspViolations.push(`${event.violatedDirective}: ${event.blockedURI}`);
    });
  });
  await page.goto('/concepts/vanguard/ro/');
  await expect(page.locator('.v-hero h1')).toBeVisible();
  await page.locator('.concept-menu summary').click();
  const navigation = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === home && response.request().isNavigationRequest(),
  );
  await page.locator('.concept-menu a').filter({ hasText: '01 / Sentinel' }).click();
  const response = await navigation;
  expect(response.headers()['content-security-policy']).toContain("script-src 'self'");
  const video = page.locator('video.sentinel-camera-video');
  await expect(video).toHaveClass(/is-playing/);
  await expect(video).toBeVisible();
  await expect(video).toHaveCSS('opacity', '1');
  const start = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).not.toBe(start);
  expect(
    await video.evaluate((v: HTMLVideoElement) => ({
      paused: v.paused,
      error: v.error,
      src: new URL(v.currentSrc).pathname,
    })),
  ).toEqual({ paused: false, error: null, src: asset });
  expect(
    await page.evaluate(() => {
      const elements = ['.hero-image', '.sentinel-camera-video', '.hero-shade'].map((selector) =>
        document.querySelector(selector)!,
      );
      const z = elements.map((element) => Number(getComputedStyle(element).zIndex));
      return z[0] < z[1] && z[1] < z[2];
    }),
  ).toBe(true);
  // Observe an actual loop, without seeking the media timeline.
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime > v.duration - 0.6), {
      timeout: 8000,
      intervals: [100],
    })
    .toBe(true);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 3000,
      intervals: [100],
    })
    .toBeLessThan(1.5);
  await expect(video).toHaveCSS('opacity', '1');
  const media = await request.get(asset);
  expect(media.status()).toBe(200);
  expect(media.headers()['content-type']).toContain('video/mp4');
  expect(await media.body()).toEqual(
    readFileSync('public/media/sentinel-hero-security-camera.mp4'),
  );
  expect(
    await page.evaluate(
      () => (window as typeof window & { cspViolations: string[] }).cspViolations,
    ),
  ).toEqual([]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(video).toHaveCount(0);
  await expect(page.locator('.hero-image')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('video.sentinel-camera-video')).toHaveCSS('opacity', '1');
});
