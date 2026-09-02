# ATP demo form → Airtable (Cloudflare Worker)

Replaces the paid Zapier zap. The site form POSTs to this Worker; the Worker creates
an Airtable record. Free on Cloudflare's Workers plan (100k requests/day).

## 1. Airtable (John's account)

1. Open the base the demo requests should land in. Note the base ID from the URL
   (`https://airtable.com/appXXXXXXXXXXXXXX/...` → `appXXXXXXXXXXXXXX`).
2. Make sure the table has these columns (or edit `FIELD_MAP` in `worker.js` to match
   whatever the columns are actually called):
   Live setup: base `ATP CRM` (appXbg4FnFjPu85wR), table `Website Leads`. Columns used:
   Name, Email, Phone, Company, Role, Interest, Notes, plus Lead Source=Website and Status=New.
3. Create a personal access token: https://airtable.com/create/tokens
   - Scope: `data.records:write` (and `data.records:read` is fine too)
   - Access: only that base
   Copy the token — it is shown once.

## 2. Cloudflare

Option A — dashboard, no CLI:
1. cloudflare.com → Workers & Pages → Create → Create Worker → name it `atp-demo-form` → Deploy.
2. Edit code → paste the contents of `worker.js` → Deploy.
3. Settings → Variables and Secrets → add three **secrets**:
   `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE` (table name, e.g. `Demo Requests`).
4. Copy the Worker URL (looks like `https://atp-demo-form.<account>.workers.dev`).

Option B — CLI (from this folder):
```
npx wrangler login
npx wrangler secret put AIRTABLE_TOKEN
npx wrangler secret put AIRTABLE_BASE_ID
npx wrangler secret put AIRTABLE_TABLE
npx wrangler deploy
```

## 3. Site

In `index.html`, set `DEMO_ENDPOINT` to the Worker URL, commit, push. GitHub Pages redeploys.

## 4. Email notification (Airtable automation, in John's account)

Base → Automations → Create automation
- Trigger: **When record created** → the demo requests table
- Action: **Send email** → To: `j.harkness@allianceturfproducts.com`
  Subject: `New demo request: {Name} — {Facility}`
  Body: insert the Name, Role, Facility, Email, Phone, Interest, Notes fields.
- Test, then turn it on.

## Test

```
curl -X POST https://atp-demo-form.<account>.workers.dev \
  -H 'Origin: https://allianceturfproducts.com' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Person","email":"test@example.com","facility":"Test GC","interest":"Just want to learn more"}'
```
Expect `{"ok":true}` and a new Airtable row.
