/** Public static website. Staff/API services remain unavailable and fail closed. */
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
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
