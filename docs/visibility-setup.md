# Mutant Beans visibility setup

This preview adds separate English and Spanish routes, an official press kit page, a story page, and a show calendar fed by the admin's `data/site-content.json`.

## Search Console

- Submit the updated `/sitemap.xml` once the site is published.
- Use URL Inspection for `/`, `/es/`, `/press/`, `/es/prensa/`, `/story/`, `/es/historia/`, `/shows/`, and `/es/fechas/`.
- Review the Performance report monthly: queries, impressions, clicks, click-through rate, and country. Request indexing for a new page once; repeated requests do not speed up crawling.

## Traffic measurement

`assets/visibility-analytics.js` is intentionally inactive until a Cloudflare Web Analytics token is configured. To activate it:

1. In Cloudflare, open Web Analytics and add `mutantbeans.com` if it is not already listed.
2. Copy the site's public beacon token.
3. Set `cloudflareWebAnalyticsToken` in `data/visibility-config.json` to that token.
4. Publish and verify that page visits appear in the Cloudflare dashboard.

The token is a browser beacon identifier, not an account credential. Do not put Cloudflare API keys or account tokens in this file.

## Show promotion

The show page reads the same admin-managed show list, filters dates that have passed using Ensenada's time zone, and provides venue directions, a shareable URL, and an all-day calendar file. For each date, use its Share link in venue announcements and event listings; update those third-party profiles manually because they require the band's own account access.

## Monthly review

- Keep the show list and flyer current in the admin panel.
- Check that Instagram, Spotify, YouTube, Bandcamp, and Lnk.Bio profiles link back to the official domain.
- Refresh the bilingual press-kit PDF when the bio, lineup, or verified achievements change.
- Compare Search Console queries and Cloudflare traffic sources before choosing the next clips or landing page to promote.
