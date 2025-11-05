import { google } from 'googleapis';

const ALLOWED_DEALERS = (process.env.ALLOWED_DEALERS || 'Cedar Rapids Toyota')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ---- Basic Auth (browser prompt happens in Edge guard; this protects the API too) ----
function checkBasicAuth(req, res) {
  const USER = process.env.BASIC_AUTH_USER || 'admin';
  const PASS = process.env.BASIC_AUTH_PASS || 'IRONCLAW2025';
  const hdr =
    req.headers['authorization'] ||
    req.headers['Authorization'] ||
    '';

  const expected = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

  if (hdr !== expected) {
    res.setHeader('WWW-Authenticate', 'Basic realm="IronClaw"');
    res.setHeader('Cache-Control', 'no-store');
    res.status(401).send('Unauthorized');
    return false;
  }
  return true;
}

function toCsv(values){
  const esc = (v='') => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  return values.map(row => row.map(esc).join(',')).join('\n');
}

function headerIndex(headers, names, fallback=null){
  const norm = s => String(s||'').trim().toLowerCase();
  const H = headers.map(norm);
  for (const n of names){
    const i = H.indexOf(norm(n));
    if (i !== -1) return i;
  }
  return fallback ?? -1;
}

export default async function handler(req, res){
  // (Optional) quick response for preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    return res.status(204).end();
  }

  // Basic Auth gate for the API
  if (!checkBasicAuth(req, res)) return;

  try{
    const jwt = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    await jwt.authorize();
    const sheets = google.sheets({ version: 'v4', auth: jwt });

    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: process.env.SHEET_RANGE || 'Sheet1!A:Z'
    });

    const values = data.values || [];
    res.setHeader('Content-Type','text/csv; charset=utf-8');

    if (!values.length){
      return res.status(200).send('');
    }

    const headers = values[0];
    const dealerIdx = headerIndex(
      headers,
      ['Dealer Name','Dealer','Dealership','DealerName','Store Name'],
      22 // fallback Column W (0-based)
    );

    const body = values.slice(1).filter(row => {
      const dn = (row[dealerIdx] || '').toString().trim();
      return ALLOWED_DEALERS.includes(dn);
    });

    return res.status(200).send(toCsv([headers, ...body]));
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Failed to load leads' });
  }
}
