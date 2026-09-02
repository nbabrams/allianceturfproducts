/**
 * ATP Demo Request → Airtable
 * Cloudflare Worker that receives the demo form POST from allianceturfproducts.com
 * and creates a record in Airtable. The Airtable token lives only in Worker secrets.
 *
 * Secrets (set with `wrangler secret put NAME` or in the Cloudflare dashboard):
 *   AIRTABLE_TOKEN   – personal access token with data.records:write scope on the base
 *   AIRTABLE_BASE_ID – e.g. appXXXXXXXXXXXXXX
 *   AIRTABLE_TABLE   – table name or ID, e.g. "Demo Requests"
 */

// Form field name  →  Airtable column name in "Website Leads" (ATP CRM base).
const FIELD_MAP = {
  name:     'Name',
  email:    'Email',
  phone:    'Phone',
  facility: 'Company',
  role:     'Role',
  interest: 'Interest',
  notes:    'Notes',
};
// Constant values stamped on every website submission.
const FIXED_FIELDS = { 'Lead Source': 'Website', 'Status': 'New' };

const ALLOWED_ORIGINS = [
  'https://allianceturfproducts.com',
  'https://www.allianceturfproducts.com',
  'https://nbabrams.github.io',
];

const MAX_LEN = { notes: 4000, default: 500 };

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

async function readBody(request) {
  const ct = request.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) return await request.json();
  const fd = await request.formData(); // handles urlencoded + multipart
  const out = {};
  for (const [k, v] of fd.entries()) out[k] = typeof v === 'string' ? v : '';
  return out;
}

function clean(v, key) {
  const s = String(v ?? '').trim();
  return s.slice(0, MAX_LEN[key] || MAX_LEN.default);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, origin);
    }
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ ok: false, error: 'Forbidden origin' }, 403, origin);
    }

    let body;
    try { body = await readBody(request); }
    catch { return json({ ok: false, error: 'Bad request body' }, 400, origin); }

    // Honeypot: bots fill the hidden field. Pretend success so they move on.
    if (clean(body.company_website)) return json({ ok: true }, 200, origin);

    const name  = clean(body.name);
    const email = clean(body.email);
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'Name and a valid email are required' }, 400, origin);
    }

    const fields = {};
    for (const [formKey, column] of Object.entries(FIELD_MAP)) {
      const v = clean(body[formKey], formKey);
      if (v) fields[column] = v;
    }
    Object.assign(fields, FIXED_FIELDS);

    const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${encodeURIComponent(env.AIRTABLE_TABLE)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // typecast lets Airtable auto-create select options (Role / Interest) if they don't exist yet
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Airtable error', res.status, detail);
      return json({ ok: false, error: 'Could not save request' }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
  },
};
