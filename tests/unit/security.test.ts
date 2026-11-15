import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { type Env } from '../../worker/index.ts';
import { readConsent, MAX_AGE } from '../../src/lib/consent.ts';
import { canPublish } from '../../src/server/contracts.ts';
const env: Env = { ASSETS: { fetch: async () => new Response('public asset') } };
const request = (path = '/', method = 'GET') =>
  new Request(`https://preview.example${path}`, { method });
test('public pages and assets do not require authentication', async () => {
  for (const path of ['/', '/favicon.svg', '/robots.txt', '/_astro/example.webp']) {
    const r = await worker.fetch(request(path), env);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('WWW-Authenticate'), null);
    assert.match(r.headers.get('Content-Security-Policy')!, /form-action 'none'/);
  }
});
test('stale Basic headers do not affect public access', async () => {
  const r = await worker.fetch(
    new Request('https://preview.example/', {
      headers: { Authorization: 'Basic %%%' },
    }),
    env,
  );
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('WWW-Authenticate'), null);
});
test('dashboard and API stay inaccessible without visitor authentication', async () => {
  for (const path of [
    '/admin/',
    '/admin/login',
    '/api/contact',
    '/api/media',
    '/concepts/sentinel/ro/dashboard/',
    '/%61dmin/',
    '//admin/',
  ])
    assert.equal((await worker.fetch(request(path), env)).status, 403);
});
test('mutations are rejected and asset outages return a safe response', async () => {
  assert.equal((await worker.fetch(request('/', 'POST'), env)).status, 405);
  const r = await worker.fetch(request(), {
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
test('staff permission boundary remains intact', () => {
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
