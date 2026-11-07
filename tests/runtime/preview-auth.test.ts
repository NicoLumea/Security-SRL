import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
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
// Ephemeral test credentials only. Exactly 24 characters tests the accepted boundary.
const username = `runtime-${randomUUID()}`;
const password = randomBytes(18).toString('base64url');
const authorization = `Basic ${btoa(`${username}:${password}`)}`;
const credentials = { PREVIEW_USER: username, PREVIEW_PASSWORD: password };
const sensitiveValues = [username, password, authorization, authorization.slice(6)];

function assertNoCredentials(text: string) {
  for (const value of sensitiveValues)
    assert.ok(!text.includes(value), 'Credentials must not appear in responses or runtime logs');
}

function runtime(t: TestContext, bindings: Record<string, string>) {
  const messages: string[] = [];
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      scriptPath: resolve('.wrangler/dry-run/index.js'),
      compatibilityDate: config.compatibility_date,
      compatibilityFlags: config.compatibility_flags,
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
      handleStructuredLogs: (entry) => messages.push(entry.message),
    }),
  );
  t.after(async () => {
    await mf.dispose();
    assertNoCredentials(messages.join('\n'));
  });
  return { mf, messages };
}

async function readSafe(response: Awaited<ReturnType<Miniflare['dispatchFetch']>>) {
  const text = await response.text();
  assertNoCredentials(text + JSON.stringify([...response.headers]));
  assert.match(response.headers.get('X-Robots-Tag') ?? '', /noindex/);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  return text;
}

const missingCases: { name: string; secrets: Record<string, string>; code: string }[] = [
  { name: 'no credentials', secrets: {}, code: 'PREVIEW_USER_MISSING' },
  {
    name: 'missing username',
    secrets: { PREVIEW_PASSWORD: password },
    code: 'PREVIEW_USER_MISSING',
  },
  {
    name: 'missing password',
    secrets: { PREVIEW_USER: username },
    code: 'PREVIEW_PASSWORD_MISSING',
  },
  {
    name: 'empty username',
    secrets: { ...credentials, PREVIEW_USER: '' },
    code: 'PREVIEW_USER_MISSING',
  },
  {
    name: 'empty password',
    secrets: { ...credentials, PREVIEW_PASSWORD: '' },
    code: 'PREVIEW_PASSWORD_MISSING',
  },
  {
    name: '23-character password',
    secrets: { ...credentials, PREVIEW_PASSWORD: password.slice(0, 23) },
    code: 'PREVIEW_PASSWORD_TOO_SHORT',
  },
];

for (const scenario of missingCases) {
  test(`workerd: ${scenario.name} returns a safe configuration error`, async (t) => {
    const { mf, messages } = runtime(t, { ...config.previews.vars, ...scenario.secrets });
    const response = await mf.dispatchFetch('https://preview.example/');
    assert.equal(response.status, 503);
    assert.equal(await readSafe(response), 'Private preview is not configured.');
    assert.equal(response.headers.get('WWW-Authenticate'), null);
    await mf.dispose();
    assert.ok(messages.some((message) => message.includes(`[preview-auth] ${scenario.code}`)));
    assert.ok(!messages.join('\n').includes(password.slice(0, 23)));
  });
}

test('workerd: configured preview challenges every unauthenticated page and asset', async (t) => {
  const { mf } = runtime(t, { ...config.previews.vars, ...credentials });
  for (const path of ['/', '/concepts/sentinel/ro/', '/favicon.svg', '/robots.txt']) {
    const response = await mf.dispatchFetch(`https://preview.example${path}`);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('WWW-Authenticate') ?? '', /^Basic realm=/);
    await readSafe(response);
  }
});

test('workerd: invalid and malformed authorization cannot reach assets', async (t) => {
  const { mf } = runtime(t, { ...config.previews.vars, ...credentials });
  for (const header of [`Basic ${btoa(`${username}:wrong`)}`, 'Basic %%%', 'Bearer invalid']) {
    const response = await mf.dispatchFetch('https://preview.example/', {
      headers: { Authorization: header },
    });
    assert.equal(response.status, 401);
    assert.match(response.headers.get('WWW-Authenticate') ?? '', /^Basic realm=/);
    await readSafe(response);
  }
});

test('workerd: valid credentials at the 24-character boundary serve the built Astro website', async (t) => {
  const { mf, messages } = runtime(t, { ...config.previews.vars, ...credentials });
  for (const path of [
    '/',
    '/en/',
    '/concepts/sentinel/ro/',
    '/concepts/sentinel/en/',
    '/concepts/sentinel/ro/proiecte/',
    '/concepts/sentinel/ro/contact/',
  ]) {
    const response = await mf.dispatchFetch(`https://preview.example${path}`, {
      headers: { Authorization: authorization },
    });
    assert.equal(response.status, 200, path);
    const html = await readSafe(response);
    assert.match(html, /<html/);
    assert.match(html, /Sentinel/);
  }
  const asset = await mf.dispatchFetch('https://preview.example/favicon.svg', {
    headers: { Authorization: authorization },
  });
  assert.equal(asset.status, 200);
  assert.match(await readSafe(asset), /<svg/);
  assert.ok(!messages.some((message) => message.includes('[preview-auth]')));
});

test('workerd: production remains locked with valid preview credentials', async (t) => {
  const { mf, messages } = runtime(t, { ...config.vars, ...credentials });
  for (const path of ['/', '/concepts/sentinel/ro/', '/favicon.svg']) {
    const response = await mf.dispatchFetch(`https://preview.example${path}`, {
      headers: { Authorization: authorization },
    });
    assert.equal(response.status, 503);
    assert.equal(await readSafe(response), 'Deployment is locked.');
  }
  assert.ok(!messages.some((message) => message.includes('[preview-auth]')));
});

test('workerd: credentials never appear in responses or captured runtime logs', async (t) => {
  const { mf } = runtime(t, { ...config.previews.vars, ...credentials });
  for (const path of ['/', '/admin/', '/api/contact', '/does-not-exist/']) {
    const response = await mf.dispatchFetch(`https://preview.example${path}`, {
      headers: { Authorization: authorization },
    });
    await readSafe(response);
  }
  // The runtime helper also checks console output after workerd shuts down.
});
