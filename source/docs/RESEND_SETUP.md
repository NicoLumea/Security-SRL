# Resend — pending Phase 3

No Resend SDK, sender domain, API key, transport, email delivery or credentials are active. `MailTransport` describes the future integration boundary.

After approval: verify a client-owned sender domain in Resend, configure the required DNS records and verify their status; choose an actual approved sender. Store `RESEND_API_KEY` and `MAIL_FROM` as Worker secrets in preview only. Production must receive independent configuration.

Start with a non-delivery transport or an approved test recipient. Build bilingual activation/approval/rejection, password reset, security notification and inquiry templates. Do not log tokens, passwords or full message bodies. Persist a delivery record and unique idempotency key. Apply bounded timeouts, retry only known transient failures, and prevent duplicate sends. Add queues and dead-letter handling only when needed and tested. Do not turn a successful UI form validation into a fictional delivery confirmation.
