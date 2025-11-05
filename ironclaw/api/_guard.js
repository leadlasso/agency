export default async function handler(req) {
  const url = new URL(req.url);

  // Use environment variables in Vercel Project Settings
  const USER = process.env.BASIC_AUTH_USER || "admin";
  const PASS = process.env.BASIC_AUTH_PASS || "IRONCLAW2025";

  const auth = req.headers.get("authorization") || "";
  const expected = "Basic " + toBase64(`${USER}:${PASS}`);

  if (auth !== expected) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="IronClaw"',
        "Cache-Control": "no-store"
      }
    });
  }

  // Auth OK → serve your SPA entry
  // (If you want to respect the original path, you can point to it, but
  // for a single-file SPA we just serve /index.html.)
  const htmlResp = await fetch(new URL("/index.html", url), {
    headers: req.headers
  });
  return new Response(htmlResp.body, {
    status: htmlResp.status,
    headers: htmlResp.headers
  });
}

// Edge runtime has Web APIs; this works for ASCII credentials.
function toBase64(s) {
  // handles unicode safely
  return btoa(unescape(encodeURIComponent(s)));
}
