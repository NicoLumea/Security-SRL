import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
const ro = '/concepts/sentinel/ro/';
const en = '/concepts/sentinel/en/';
const asset = '/media/sentinel-hero-security-camera.mp4';
for (const langPath of [ro, en]) {
  test(`direct server-rendered MP4 in ${langPath}`, async ({ request, page }) => {
    const response = await request.get(langPath);
    const html = await response.text();
    expect(response.status()).toBe(200);
    expect(html).toMatch(/<video[^>]*data-sentinel-hero-video/);
    expect(html).toContain('<source src="/media/sentinel-hero-security-camera.mp4" type="video/mp4"');
    expect(html).not.toContain('data-sentinel-hero-template');
    expect(html).not.toContain('class="hero-image"');
    await page.goto(langPath);
    const video = page.locator('.hero video.sentinel-camera-video');
    await expect(video).toHaveCount(1);
    const attrs = await video.evaluate((v: HTMLVideoElement) => ({
      muted: v.muted, loop: v.loop, autoplay: v.autoplay,
      playsInline: v.playsInline, controls: v.controls, rate: v.playbackRate,
      src: new URL(v.querySelector('source')!.src).pathname,
      fit: getComputedStyle(v).objectFit, filter: getComputedStyle(v).filter,
      position: getComputedStyle(v).position,
    }));
    expect(attrs).toEqual({
      muted: true, loop: true, autoplay: true, playsInline: true,
      controls: false, rate: 1, src: asset, fit: 'cover',
      filter: 'none', position: 'absolute'
    });
    expect(await page.evaluate(() => {
      const video = document.querySelector('.sentinel-camera-video')!;
      const shade = document.querySelector('.hero-shade')!;
      const content = document.querySelector('.hero-content')!;
      return Number(getComputedStyle(video).zIndex) < Number(getComputedStyle(shade).zIndex) &&
        Number(getComputedStyle(shade).zIndex) < Number(getComputedStyle(content).zIndex);
    })).toBe(true);
  });
}
for (const width of [320, 390, 768, 1024, 1440]) {
  test(`Sentinel video playback and layout at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ro);
    const video = page.locator('.sentinel-camera-video');
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
    await expect(page.locator('.hero h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await page.locator('.hero').boundingBox();
    await video.evaluate((v: HTMLVideoElement) => { v.currentTime = Math.max(0, v.duration - .2); });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeLessThan(2);
    expect(await page.locator('.hero').boundingBox()).toEqual(box);
    if (width === 390 || width === 1440) {
      await info.attach(`sentinel-video-${width}`, { body: await page.locator('.hero').screenshot(), contentType: 'image/png' });
    }
  });
}
test('reduced motion pauses video, keeps it in DOM, and offers manual play', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(ro);
  const video = page.locator('.sentinel-camera-video');
  await expect(video).toHaveCount(1);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await expect(video).toHaveCSS('visibility', 'hidden');
  const button = page.getByRole('button', { name: 'Redă videoclipul' });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  await expect(video).toHaveCSS('visibility', 'visible');
  await expect(button).toBeHidden();
});
test('when autoplay is rejected the visitor can manually play video', async ({ page }) => {
  await page.addInitScript(() => {
    const nativePlay = HTMLMediaElement.prototype.play;
    let blocked = false;
    HTMLMediaElement.prototype.play = function () {
      if (!blocked) {
        blocked = true;
        return Promise.reject(new DOMException('Autoplay denied', 'NotAllowedError'));
      }
      return nativePlay.call(this);
    };
  });
  await page.goto(en);
  const button = page.getByRole('button', { name: 'Play background video' });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.locator('.sentinel-camera-video').evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
  await expect(button).toBeHidden();
});
test('failed MP4 shows error rather than old image, hero links still work', async ({ page }) => {
  await page.route('**' + asset, route => route.abort());
  await page.goto(ro);
  const video = page.locator('.sentinel-camera-video');
  await expect(video).toHaveCount(1);
  await expect(page.locator('.hero-image')).toHaveCount(0);
  await expect(page.locator('[data-sentinel-video-error]')).toBeVisible();
  await page.locator('.hero .actions a').first().click();
  await expect(page).toHaveURL(/proiecte/);
});
test('CSP stays intact, video bytes unchanged, and other concepts render', async ({ page, request }) => {
  const res = await request.get(ro);
  expect(res.headers()['content-security-policy']).toContain("script-src 'self'");
  const media = await request.get(asset);
  expect(media.status()).toBe(200);
  expect(media.headers()['content-type']).toContain('video/mp4');
  expect(await media.body()).toEqual(readFileSync('public/media/sentinel-hero-security-camera.mp4'));
  const violations: string[] = [];
  page.on('console', message => { if (message.text().includes('Content Security Policy')) violations.push(message.text()); });
  for (const url of ['/concepts/sentinel/en/', '/concepts/vanguard/ro/', '/concepts/precision/ro/', '/concepts/dominion/ro/']) {
    await page.goto(url);
    await expect(page.locator('h1')).toHaveCount(1);
  }
  expect(violations).toEqual([]);
});
