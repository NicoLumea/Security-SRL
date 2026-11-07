import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve('dist');
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}
const files = walk(root).filter((f) => f.endsWith('.html'));
let checked = 0;
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  assert.match(html, /<meta[^>]+name="robots"[^>]+noindex/, `noindex: ${file}`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `one h1: ${file}`);
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = m[1].replaceAll('&amp;', '&');
    if (/^(https?:|data:|mailto:|tel:)/.test(ref)) continue;
    const [path, fragment] = ref.split('#');
    const clean = path.split('?')[0];
    let target = clean
      ? resolve(clean.startsWith('/') ? root : dirname(file), clean.replace(/^\//, ''))
      : file;
    if (clean.endsWith('/')) target = join(target, 'index.html');
    assert.ok(existsSync(target), `Missing ${ref} linked from ${file}`);
    if (fragment && target.endsWith('.html'))
      assert.ok(
        readFileSync(target, 'utf8').includes(`id="${fragment}"`),
        `Missing anchor ${ref} from ${file}`,
      );
    checked++;
  }
}
console.log(
  `Verified ${files.length} HTML pages, ${checked} internal links/assets, one h1 and noindex on every page.`,
);
