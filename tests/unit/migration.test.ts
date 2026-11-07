import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
test('content migration applies to SQLite and enforces publication and role constraints', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('migrations/0001_content_foundation.sql', 'utf8'));
  db.exec(
    "INSERT INTO staff_principals(id,role,status) VALUES ('a','ADMIN','active'); INSERT INTO project_categories(id) VALUES ('video');",
  );
  assert.throws(() => db.exec("INSERT INTO staff_principals(id,role) VALUES ('b','OWNER')"));
  assert.throws(() =>
    db.exec(
      "INSERT INTO projects(id,category_id,status,last_editor_id) VALUES ('p','video','published','a')",
    ),
  );
  db.exec("INSERT INTO projects(id,category_id,last_editor_id) VALUES ('p','video','a')");
  assert.equal(
    (db.prepare('SELECT status FROM projects').get() as { status: string }).status,
    'draft',
  );
  db.exec("UPDATE projects SET publication_approved=1,status='published' WHERE id='p'");
  assert.equal(
    (db.prepare('SELECT status FROM projects').get() as { status: string }).status,
    'published',
  );
  db.close();
});
