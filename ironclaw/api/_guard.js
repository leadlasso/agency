export default async function handler(req) {
  const USER = process.env.BASIC_AUTH_USER || "admin";
  const PASS = process.env.BASIC_AUTH_PASS || "IRONCLAW2025";

  const auth = req.headers.get("authorization") || "";
  const expected = "Basic " + btoa(unescape(encodeURIComponent(`${USER}:${PASS}`)));

  if (auth !== expected) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="IronClaw"',
        "Cache-Control": "no-store"
      }
    });
  }

  // Authorized → redirect to the file-system escape hatch
  const url = new URL(req.url);
  url.pathname = "/index.html";
  return Response.redirect(url, 307);
}
