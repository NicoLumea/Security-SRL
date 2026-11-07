import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../../src/lib/slug.ts';
test('Romanian slugs normalize accents and punctuation predictably', () => {
  assert.equal(
    slugify('  Supraveghere — București, Sector 1! '),
    'supraveghere-bucuresti-sector-1',
  );
  assert.equal(slugify('Protecție & control / acces'), 'protectie-control-acces');
  assert.equal(slugify('!!!'), '');
});
