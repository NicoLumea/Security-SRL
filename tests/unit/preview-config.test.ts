import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import worker from '../../worker/index.ts';

const parsed = ts.parseConfigFileTextToJson(
  'wrangler.jsonc',
  readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'),
);
assert.equal(parsed.error, undefined, 'Wrangler JSONC must parse');
const config = parsed.config;
const credentials = {
  PREVIEW_USER: 'test-reviewer',
  PREVIEW_PASSWORD: 'test-only-preview-password-32-chars',
};
const request = (path: string, authenticated = true) =>
  new Request(`https://preview.example${path}`, {
    headers: authenticated
      ? {
          Authorization: `Basic ${btoa(`${credentials.PREVIEW_USER}:${credentials.PREVIEW_PASSWORD}`)}`,
        }
      : {},
  });

test('checked-in production settings stay locked even with valid preview credentials', async () => {
  let assetReads = 0;
  const env = {
    ...config.vars,
    ...credentials,
    ASSETS: {
      fetch: async () => {
        assetReads++;
        return new Response('website');
      },
    },
  };
  for (const path of ['/', '/concepts/sentinel/ro/', '/_astro/example.css']) {
    const response = await worker.fetch(request(path), env);
    assert.equal(response.status, 503);
    assert.equal(await response.text(), 'Deployment is locked.');
  }
  assert.equal(assetReads, 0);
  assert.equal(config.assets.run_worker_first, true);
});

test('branch preview config serves protected assets without production data bindings', async () => {
  assert.equal(config.name, 'security-srl');
  assert.equal(config.preview_urls, true);
  assert.deepEqual(config.previews.d1_databases, []);
  assert.deepEqual(config.previews.r2_buckets, []);
  assert.equal(config.previews.vars.PREVIEW_PASSWORD, undefined);
  const env = {
    ...config.previews.vars,
    ...credentials,
    ASSETS: { fetch: async () => new Response('Sentinel website') },
  };
  for (const path of [
    '/',
    '/concepts/sentinel/ro/',
    '/concepts/sentinel/en/',
    '/_astro/example.css',
  ]) {
    assert.equal((await worker.fetch(request(path, false), env)).status, 401);
    const response = await worker.fetch(request(path), env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'Sentinel website');
    assert.match(response.headers.get('X-Robots-Tag')!, /noindex/);
  }
  assert.equal(
    (await worker.fetch(request('/'), { ...env, PREVIEW_PASSWORD: undefined })).status,
    503,
  );
});
