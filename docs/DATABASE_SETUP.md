# Database foundation

`migrations/0001_content_foundation.sql` defines categories, projects, translations, media relationships/alt text, content sections, settings, staff principal references and audit events. It seeds **no** business records or accounts. The principal table is an authorization reference, not an authentication implementation.

Foreign keys, allowed roles/statuses, unique localized slugs and publication approval constraints are included. Listing indexes support `(status, display_order, id)` cursor pagination. Runtime role checks and transaction boundaries remain necessary; a SQL CHECK does not implement administrator authorization.

The migration was exercised with Node's SQLite engine. Remote D1 compatibility and binding operations still need verification in the actual preview account.

No database is required for this presentation. For Phase 3, create an explicitly approved staging database and add its binding under `previews.d1_databases`. Prepare a separate migration configuration targeting that exact database before running local or remote D1 migrations. The old `--env preview` commands no longer apply: branch previews use the `previews` block under the existing Worker, not a separately named Worker environment.

Inspect the resource name and account before the remote operation. Export/backup before destructive changes. Never repoint preview to production. Create separate migration approval and backup procedures for production; no production migration command should run from this presentation CI.

Pending tables: auth-provider accounts/sessions, approval requests, single-use activation/reset tokens, inquiries, email delivery/deduplication and any legally required consent records. Select the authentication provider first so its maintained schema/migrations own sensitive auth storage. Do not invent a bespoke password algorithm.
