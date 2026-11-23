import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
import ts from 'typescript';
const parsed = ts.parseConfigFileTextToJson(
  'wrangler.jsonc',
  readFileSync('wrangler.jsonc', 'utf8'),
);
assert.equal(parsed.error, undefined);
const config = parsed.config;
function runtime(t: TestContext, bindings: Record<string, string>) {
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      scriptPath: resolve('.wrangler/dry-run/index.js'),
      compatibilityDate: config.compatibility_date,
      bindings,
      assets: {
        directory: resolve(config.assets.directory),
        binding: config.assets.binding,
        run_worker_first: config.assets.run_worker_first,
        routerConfig: { has_user_worker: Boolean(config.main) },
        assetConfig: { not_found_handling: config.assets.not_found_handling },
      },
      host: '127.0.0.1',
      log: new Log(LogLevel.NONE),
    }),
  );
  t.after(() => mf.dispose());
  return mf;
}
for (const [name, bindings] of Object.entries({
  production: config.vars ?? {},
  preview: config.previews.vars,
  legacy: {
    ENVIRONMENT: 'locked',
    DEPLOYMENT_LOCKED: 'true',
    PREVIEW_USER: 'obsolete',
    PREVIEW_PASSWORD: 'obsolete',
    PRODUCTION_USER: 'obsolete',
    PRODUCTION_PASSWORD: 'obsolete',
  },
})) {
  test(`workerd: ${name} serves pages, images and exact video without credentials`, async (t) => {
    const mf = runtime(t, bindings as Record<string, string>);
    for (const path of [
      '/',
      '/en/',
      '/concepts/vanguard/ro/',
      '/concepts/vanguard/en/',
      '/concepts/precision/ro/',
      '/concepts/precision/en/',
      '/concepts/sentinel/ro/',
      '/concepts/sentinel/en/',
      '/concepts/sentinel/ro/proiecte/',
      '/concepts/sentinel/ro/contact/',
    ]) {
      const r = await mf.dispatchFetch(`https://website.example${path}`);
      assert.equal(r.status, 200, path);
      assert.equal(r.headers.get('WWW-Authenticate'), null);
      const html = await r.text();
      assert.match(html, /<html/);
      assert.doesNotMatch(html, /Deployment is locked|Authorization required/);
      if (path === '/concepts/sentinel/ro/' || path === '/concepts/vanguard/ro/') {
        const image = html.match(/<img[^>]*src="([^"]+)"/);
        assert.ok(image);
        const img = await mf.dispatchFetch(`https://website.example${image[1]}`);
        assert.equal(img.status, 200);
        assert.match(img.headers.get('content-type') ?? '', /^image\//);
        await img.arrayBuffer();
      }
    }
    const media = await mf.dispatchFetch(
      'https://website.example/media/sentinel-hero-security-camera.mp4',
    );
    assert.equal(media.status, 200);
    assert.equal(media.headers.get('WWW-Authenticate'), null);
    assert.deepEqual(
      Buffer.from(await media.arrayBuffer()),
      readFileSync('public/media/sentinel-hero-security-camera.mp4'),
    );
    const head = await mf.dispatchFetch('https://website.example/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const malformed = await mf.dispatchFetch('https://website.example/', {
      headers: { Authorization: 'Basic %%%' },
    });
    assert.equal(malformed.status, 200);
    await malformed.text();
  });
  test(`workerd: ${name} still blocks staff, API and mutations`, async (t) => {
    const mf = runtime(t, bindings as Record<string, string>);
    for (const path of [
      '/admin/',
      '/api/contact',
      '/concepts/sentinel/ro/dashboard/',
      '/%61dmin/',
    ]) {
      const response = await mf.dispatchFetch(`https://website.example${path}`);
      assert.equal(response.status, 403);
      await response.text();
    }
    const mutation = await mf.dispatchFetch('https://website.example/', { method: 'POST' });
    assert.equal(mutation.status, 405);
    await mutation.text();
    const missing = await mf.dispatchFetch('https://website.example/not-a-page/');
    assert.equal(missing.status, 404);
    assert.equal(missing.headers.get('WWW-Authenticate'), null);
    await missing.text();
    assert.match(missing.headers.get('Content-Security-Policy') ?? '', /frame-ancestors 'none'/);
  });
}
