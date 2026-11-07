import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { constantTimeEqual, type Env } from '../../worker/index.ts';
import { readConsent, MAX_AGE } from '../../src/lib/consent.ts';
import { canPublish } from '../../src/server/contracts.ts';
const password = 'test-only-credential-with-32-characters';
const env: Env = {
  ENVIRONMENT: 'preview',
  DEPLOYMENT_LOCKED: 'false',
  PREVIEW_USER: 'reviewer',
  PREVIEW_PASSWORD: password,
  ASSETS: { fetch: async () => new Response('private asset') },
};
const authorized = (path = '/', method = 'GET') =>
  new Request(`https://preview.example${path}`, {
    method,
    headers: { Authorization: `Basic ${btoa('reviewer:' + password)}` },
  });
test('unconfigured and production deployments fail closed', async () => {
  for (const change of [
    { PREVIEW_PASSWORD: undefined },
    { PREVIEW_PASSWORD: 'short' },
    { ENVIRONMENT: 'production' },
    { DEPLOYMENT_LOCKED: 'true' },
  ])
    assert.equal((await worker.fetch(authorized(), { ...env, ...change })).status, 503);
});
test('every asset is private and malformed Basic headers are rejected', async () => {
  for (const path of ['/', '/favicon.svg', '/robots.txt', '/_astro/secret.webp']) {
    const r = await worker.fetch(new Request(`https://preview.example${path}`), env);
    assert.equal(r.status, 401);
    assert.equal(r.headers.get('Cache-Control'), 'private, no-store');
  }
  assert.equal(
    (
      await worker.fetch(
        new Request('https://preview.example/', { headers: { Authorization: 'Basic %%%' } }),
        env,
      )
    ).status,
    401,
  );
});
test('authorized assets have security headers and no indexing', async () => {
  const r = await worker.fetch(authorized(), env);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), 'private asset');
  assert.match(r.headers.get('Content-Security-Policy')!, /form-action 'none'/);
  assert.match(r.headers.get('X-Robots-Tag')!, /noindex/);
});
test('dashboard and API stay inaccessible even with preview credentials', async () => {
  for (const path of [
    '/admin/',
    '/admin/login',
    '/api/contact',
    '/api/media',
    '/concepts/sentinel/ro/dashboard/',
    '/%61dmin/',
    '//admin/',
  ])
    assert.equal((await worker.fetch(authorized(path), env)).status, 403);
});
test('mutations are rejected and asset outages return a safe response', async () => {
  assert.equal((await worker.fetch(authorized('/', 'POST'), env)).status, 405);
  const r = await worker.fetch(authorized(), {
    ...env,
    ASSETS: {
      fetch: async () => {
        throw new Error('secret detail');
      },
    },
  });
  assert.equal(r.status, 503);
  assert.doesNotMatch(await r.text(), /secret/);
});
test('digest comparison and staff permission boundary', async () => {
  assert.equal(await constantTimeEqual('abc', 'abc'), true);
  assert.equal(await constantTimeEqual('abc', 'abcd'), false);
  assert.equal(canPublish(null), false);
  assert.equal(canPublish({ id: 'e', role: 'EMPLOYEE', status: 'active' }), false);
  assert.equal(canPublish({ id: 'a', role: 'ADMIN', status: 'disabled' }), false);
  assert.equal(canPublish({ id: 'a', role: 'ADMIN', status: 'active' }), true);
});
test('consent validates shape, age, malformed and future values', () => {
  const now = Date.now();
  assert.equal(readConsent('{bad', now), null);
  assert.equal(
    readConsent(
      JSON.stringify({ version: 1, at: now - MAX_AGE, analytics: true, marketing: false }),
      now,
    ),
    null,
  );
  assert.equal(
    readConsent(
      JSON.stringify({ version: 1, at: now + 1, analytics: true, marketing: false }),
      now,
    ),
    null,
  );
  assert.equal(
    readConsent(JSON.stringify({ version: 1, at: now, analytics: 'true', marketing: false }), now),
    null,
  );
  assert.deepEqual(
    readConsent(JSON.stringify({ version: 1, at: now, analytics: false, marketing: false }), now),
    { version: 1, at: now, analytics: false, marketing: false },
  );
});
