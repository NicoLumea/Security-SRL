-- Phase 3 foundation. No users, credentials, inquiries, or demo content are seeded.
PRAGMA foreign_keys = ON;
CREATE TABLE staff_principals (
 id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('ADMIN','EMPLOYEE')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','disabled')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Auth-provider identities, sessions and token tables are intentionally deferred.
CREATE TABLE project_categories (id TEXT PRIMARY KEY, display_order INTEGER NOT NULL DEFAULT 0);
CREATE TABLE media (
 id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes > 0), width INTEGER, height INTEGER,
 status TEXT NOT NULL DEFAULT 'quarantine' CHECK(status IN ('quarantine','approved')),
 uploaded_by TEXT NOT NULL REFERENCES staff_principals(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE projects (
 id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES project_categories(id),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
 featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0,1)), display_order INTEGER NOT NULL DEFAULT 0,
 cover_media_id TEXT REFERENCES media(id), approved_location TEXT, confirmed_completion_date TEXT,
 publication_approved INTEGER NOT NULL DEFAULT 0 CHECK(publication_approved IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_editor_id TEXT NOT NULL REFERENCES staff_principals(id),
 CHECK(status != 'published' OR publication_approved = 1)
);
CREATE TABLE project_translations (
 project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, locale TEXT NOT NULL,
 title TEXT NOT NULL, slug TEXT NOT NULL, description TEXT NOT NULL, seo_title TEXT NOT NULL, seo_description TEXT NOT NULL,
 PRIMARY KEY(project_id,locale), UNIQUE(locale,slug)
);
CREATE TABLE project_media (project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, media_id TEXT NOT NULL REFERENCES media(id), display_order INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(project_id,media_id));
CREATE TABLE media_translations (media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE, locale TEXT NOT NULL, alt TEXT NOT NULL, PRIMARY KEY(media_id,locale));
CREATE TABLE content_sections (id TEXT NOT NULL, locale TEXT NOT NULL, draft_json TEXT NOT NULL, published_json TEXT, last_editor_id TEXT REFERENCES staff_principals(id), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(id,locale));
CREATE TABLE site_settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE audit_events (id TEXT PRIMARY KEY, actor_id TEXT REFERENCES staff_principals(id), action TEXT NOT NULL, entity_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX projects_public_order ON projects(status, display_order, id);
CREATE INDEX media_status ON media(status, created_at);
CREATE INDEX audit_created ON audit_events(created_at);
