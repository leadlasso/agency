import { google } from 'googleapis';

const ALLOWED_DEALERS = (process.env.ALLOWED_DEALERS || 'Cedar Rapids Toyota')
  .split(',').map(s=>s.trim()).filter(Boolean);

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
  for (const n of names){ const i=H.indexOf(norm(n)); if (i!==-1) return i; }
  return fallback ?? -1;
}

export default async function handler(req, res){
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
    if (!values.length){
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      return res.status(200).send('');
    }

    const headers = values[0];
    const dealerIdx = headerIndex(headers,
      ['Dealer Name','Dealer','Dealership','DealerName','Store Name'],
      22 // fallback Column W (0-based)
    );

    const body = values.slice(1).filter(row => {
      const dn = (row[dealerIdx] || '').toString().trim();
      return ALLOWED_DEALERS.includes(dn);
    });

    res.setHeader('Content-Type','text/csv; charset=utf-8');
    return res.status(200).send(toCsv([headers, ...body]));
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: 'Failed to load leads' });
  }
}
