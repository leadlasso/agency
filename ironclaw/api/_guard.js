// api/_guard.js — Edge Function
export default async function handler(req) {
  const USER = process.env.BASIC_AUTH_USER || "admin";
  const PASS = process.env.BASIC_AUTH_PASS || "IRONCLAW2025";

  const hdr = req.headers.get("authorization") || "";
  const expected = "Basic " + btoa(unescape(encodeURIComponent(`${USER}:${PASS}`)));

  if (hdr !== expected) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="IronClaw"',
        "Cache-Control": "no-store"
      }
    });
  }

  // Auth OK → serve your SPA entry
  const url = new URL(req.url);
  const html = await fetch(new URL("/index.html", url), { headers: req.headers });
  return new Response(html.body, { status: html.status, headers: html.headers });
}
