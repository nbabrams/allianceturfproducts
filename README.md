# Alliance Turf Products — Website

Temporary marketing site for Alliance Turf Products, exclusive Baroness equipment
distributor for Southern California, Las Vegas, and Baja Mexico.

- **Live:** https://allianceturfproducts.com (GitHub Pages + custom domain via `CNAME`)
- **Stack:** single static `index.html`, no build step
- **Hosting:** GitHub Pages, served from `main`

## Structure

```
index.html        # the entire site (inline CSS/JS)
CNAME             # custom domain for GitHub Pages
assets/img/       # optimized logo, social-share image, product + hero photos
```

Only optimized, web-ready images belong in `assets/img/`. Raw source photos, PDFs, and
design files are kept out of the repo (see `.gitignore`).

## Deploy

GitHub Pages auto-deploys on push to `main`:

```
git add -A
git commit -m "your message"
git push
```

Changes go live at allianceturfproducts.com within a minute or two.

## Demo form

The demo form posts to a Zapier Catch Hook (Airtable + Mailchimp). Paste the webhook URL
into the `DEMO_WEBHOOK_URL` constant near the bottom of `index.html`. Until then the form
politely directs visitors to call/email.
