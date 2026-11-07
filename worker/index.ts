/** Preview perimeter only, NOT staff authentication. All staff/API routes fail closed. */
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  PREVIEW_USER?: string;
  PREVIEW_PASSWORD?: string;
  DEPLOYMENT_LOCKED?: string;
  ENVIRONMENT?: string;
}
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const x = new Uint8Array(left),
    y = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cache-Control': 'private, no-store',
  'Strict-Transport-Security': 'max-age=31536000',
};
function response(body: string, status: number, extra: Record<string, string> = {}) {
  return new Response(body, {
    status,
    headers: { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8', ...extra },
  });
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (env.DEPLOYMENT_LOCKED !== 'false' || env.ENVIRONMENT !== 'preview')
      return response('Deployment is locked.', 503);
    if (!env.PREVIEW_USER || !env.PREVIEW_PASSWORD || env.PREVIEW_PASSWORD.length < 24)
      return response('Private preview is not configured.', 503);
    let decoded = '';
    try {
      const header = request.headers.get('Authorization') || '';
      if (header.startsWith('Basic ')) decoded = atob(header.slice(6));
    } catch {
      /* Invalid authorization is rejected. */
    }
    if (!(await constantTimeEqual(decoded, `${env.PREVIEW_USER}:${env.PREVIEW_PASSWORD}`)))
      return response('Private presentation. Authorization required.', 401, {
        'WWW-Authenticate': 'Basic realm="Security SRL preview", charset="UTF-8"',
      });
    let path: string;
    try {
      path = decodeURIComponent(new URL(request.url).pathname)
        .replace(/\\/g, '/')
        .replace(/\/{2,}/g, '/')
        .toLowerCase();
    } catch {
      return response('Invalid request.', 400);
    }
    if (/^\/(admin|api)(\/|$)/.test(path) || /(^|\/)dashboard(\/|$)/.test(path))
      return response('Staff and data services are not enabled in this presentation.', 403);
    if (!['GET', 'HEAD'].includes(request.method))
      return response('Method not allowed.', 405, { Allow: 'GET, HEAD' });
    try {
      const asset = await env.ASSETS.fetch(request);
      const headers = new Headers(asset.headers);
      for (const [key, value] of Object.entries(securityHeaders)) headers.set(key, value);
      return new Response(request.method === 'HEAD' ? null : asset.body, {
        status: asset.status,
        headers,
      });
    } catch {
      return response('The presentation is temporarily unavailable.', 503);
    }
  },
};
