# Staff access — intentionally pending

No administrator exists. No email/password default exists. No bootstrap command or public recovery endpoint is implemented. The footer opens an explanatory page; it is not a login form. Worker routes `/admin`, `/api`, and dashboard segments deny access, including with preview-review credentials.

**You cannot bootstrap the first administrator from this Phase 1–2 delivery.** Implement and review Phase 3 first. There is no safe command to run now.

Required Phase 3 procedure:

1. Select and validate a maintained Workers-compatible authentication provider and its D1/session adapter. Configure HttpOnly/Secure/SameSite cookies, CSRF, rate limiting, verification, single-use expiring activation/reset tokens, session rotation/revocation and administrator MFA.
2. Create an infrastructure-authenticated, manually dispatched bootstrap workflow. Accept the approved admin identity via protected configuration; never commit its password or issue universal credentials.
3. In an atomic operation, assert no initial admin and no used bootstrap marker, create a pending admin identity, and record an audit event and one-time marker. Have the chosen provider send a verified activation flow after commit. Handle retries idempotently.
4. Verify identity, set credentials through the provider and activate MFA. Revoke the bootstrap token and disable the workflow. Re-running must fail safely.
5. Test pending/disabled users, employees and admins on every server mutation. Employees may save authorized drafts but never publish, approve themselves or promote users.
6. Document recovery through verified infrastructure owners, requiring a new narrowly scoped one-time action, audit record and session revocation. Never create a public bypass endpoint.

The `canPublish` helper only illustrates an active-admin boundary; it is not wired to a CMS endpoint because none exists. Do not claim authentication, recovery or employee approval is operational until its end-to-end tests pass.
