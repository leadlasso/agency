// middleware.js
export function middleware(req) {
  const url = new URL(req.url);

  // If you want /api/leads to be public, skip it; remove this block to protect it too
  if (url.pathname.startsWith('/api/leads')) return;

  const USER = process.env.BASIC_AUTH_USER || 'admin';
  const PASS = process.env.BASIC_AUTH_PASS || 'IRONCLAW2025';

  const got = req.headers.get('authorization') || '';
  const need = 'Basic ' + btoa(unescape(encodeURIComponent(`${USER}:${PASS}`)));

  if (got !== need) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="IronClaw"', 'Cache-Control': 'no-store' }
    });
  }
  // OK → continue to static assets (index.html, js, css)
  return;
}

export const config = { matcher: '/:path*' };
