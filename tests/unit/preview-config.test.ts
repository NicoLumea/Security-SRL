import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const parsed = ts.parseConfigFileTextToJson(
  'wrangler.jsonc',
  readFileSync('wrangler.jsonc', 'utf8'),
);
assert.equal(parsed.error, undefined);
const config = parsed.config;
test('main subdomain and branch previews remain enabled with no visitor gate', () => {
  assert.equal(config.name, 'security-srl');
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, true);
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.vars, undefined);
  assert.deepEqual(config.previews.vars, {});
  assert.deepEqual(config.previews.d1_databases, []);
  assert.deepEqual(config.previews.r2_buckets, []);
  assert.equal(config.d1_databases, undefined);
  assert.equal(config.r2_buckets, undefined);
});
