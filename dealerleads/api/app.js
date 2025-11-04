import fs from 'node:fs/promises';
import path from 'node:path';

const USER = process.env.DASH_USER || 'client';
const PASS = process.env.DASH_PASS || 'GV2025';

export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="GV Leads"');
    return res.status(401).end('Auth required');
  }
  const [u, p] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (u !== USER || p !== PASS) {
    res.setHeader('WWW-Authenticate', 'Basic realm="GV Leads"');
    return res.status(401).end('Auth required');
  }

  try {
    const file = path.join(process.cwd(), 'index.html');
    const html = await fs.readFile(file, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (e) {
    console.error(e);
    return res.status(500).send('Failed to load app');
  }
}
