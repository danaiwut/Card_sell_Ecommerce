# n8n News Ingestion

This workflow lets n8n scrape card news from external sites and send the result into CardVerse as an unpublished draft. Admins review drafts in the Admin Dashboard, edit them if needed, and publish them to `/news`.

## CardVerse Endpoint

Local development:

```bash
POST http://localhost:4000/internal/news/ingest
```

Production:

```bash
POST https://your-api-domain.com/internal/news/ingest
```

Headers:

```http
Content-Type: application/json
x-internal-secret: <INTERNAL_API_SECRET>
```

Body:

```json
{
  "sourceUrl": "https://example.com/article/card-news",
  "sourceName": "Example Card News",
  "externalId": "optional-source-id",
  "title": "New card set announced",
  "excerpt": "Short summary shown on the news listing.",
  "body": "Article body or a cleaned plain-text summary.",
  "imageUrl": "https://example.com/image.jpg",
  "kind": "NEWS",
  "eventDate": "2026-07-10T10:00:00.000Z"
}
```

`sourceUrl` is required and unique. If n8n sends the same URL again, CardVerse updates the existing draft. Once an admin publishes the news, future ingests for the same URL will not overwrite the published content.

## Recommended n8n Flow

1. Add a Schedule Trigger. Start with every 2-6 hours so the source site is not hit too often.
2. Add an HTTP Request node for the source site's list page.
3. Add an HTML Extract or Code node to collect article links.
4. Use Split In Batches or Loop Over Items.
5. Add an HTTP Request node for each article page.
6. Add HTML Extract or Code to map article fields.
7. Add an IF node that requires `title` and `url`.
8. Add an HTTP Request node to send the mapped JSON to CardVerse.

## Example Selectors

Every source site has different HTML. Prefer Open Graph metadata when available because it changes less often:

```text
title: meta[property="og:title"] attribute content, fallback h1 text
excerpt: meta[name="description"] attribute content
imageUrl: meta[property="og:image"] attribute content
body: article text, fallback main text
sourceUrl: current article URL
```

## Import Template

Use `docs/n8n/news-ingest-scrape-template.json` as a starting point. After importing it into n8n:

1. Replace `https://example.com/card-news` with the source list URL.
2. Update the extraction code to match the source site's article link selectors.
3. Replace the article extraction selectors with the site's real selectors.
4. Set `CARDVERSE_API_URL` and `INTERNAL_API_SECRET` in n8n environment variables, or put the values directly in the HTTP node while testing.

## Admin Review

Imported posts appear in:

```text
/admin -> News -> News Draft Queue
```

Admins can edit the title, excerpt, body, image, kind, and event date before clicking Approve.

## Notes

- Respect each source site's terms, robots.txt, and rate limits.
- Keep imported content in draft mode so an admin can check quality and copyright risk.
- If source images are unreliable, add a later n8n step to upload images to Supabase Storage and pass the public URL as `imageUrl`.
