// middleware.js (Edge by default)
export function middleware(req) {
  const url = new URL(req.url);

  // Allow API if you want to keep it public; remove this block to protect it too
  if (url.pathname.startsWith('/api/leads')) {
    return; // skip auth for the API OR do your own header check here
  }

  const USER = process.env.BASIC_AUTH_USER || 'admin';
  const PASS = process.env.BASIC_AUTH_PASS || 'IRONCLAW2025';

  const auth = req.headers.get('authorization') || '';
  const expected = 'Basic ' + btoa(unescape(encodeURIComponent(`${USER}:${PASS}`)));

  if (auth !== expected) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="IronClaw"', 'Cache-Control': 'no-store' }
    });
  }
  // Auth OK → continue to static file (index.html etc.)
  return;
}

export const config = {
  // run on everything (you can narrow this if you like)
  matcher: '/:path*'
};
