import RssParser from "rss-parser";
import type { NewsKind } from "@cardverse/shared";
import { callInternal } from "../internal-api";
import { RSS_FEEDS, type FeedSource } from "../rss-feeds.config";

const parser = new RssParser({
  timeout: 15_000,
  headers: { "User-Agent": "CardVerse-NewsBot/1.0" },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

interface IngestPayload {
  sourceUrl: string;
  sourceName: string;
  externalId: string | null;
  kind: NewsKind;
  title: string;
  excerpt: string | null;
  body: string | null;
  imageUrl: string | null;
  published?: false;
}

/**
 * Fetch all configured RSS feeds and ingest new items via the internal API.
 * Called by BullMQ as a repeatable cron job.
 */
export async function processNewsFeeds() {
  let totalIngested = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const feed of RSS_FEEDS) {
    try {
      const result = await fetchAndIngestFeed(feed);
      totalIngested += result.ingested;
      totalSkipped += result.skipped;
      console.log(
        `[news-feed] ${feed.name}: ingested=${result.ingested} skipped=${result.skipped}`,
      );
    } catch (err: any) {
      totalErrors += 1;
      console.error(`[news-feed] ${feed.name} failed:`, err.message);
    }
  }

  return { totalIngested, totalSkipped, totalErrors };
}

async function fetchAndIngestFeed(feed: FeedSource) {
  const rss = await parser.parseURL(feed.url);
  let ingested = 0;
  let skipped = 0;

  // Only process the most recent 20 items per feed to avoid flooding
  const items = (rss.items ?? []).slice(0, 20);

  for (const item of items) {
    const link = item.link?.trim();
    if (!link) {
      skipped += 1;
      continue;
    }

    const title = (item.title ?? "").trim();
    if (!title) {
      skipped += 1;
      continue;
    }

    const payload: IngestPayload = {
      sourceUrl: link,
      sourceName: feed.name,
      externalId: item.guid ?? item.id ?? null,
      kind: detectKind(title, item.categories, feed.kind),
      title: title.slice(0, 200),
      excerpt: extractExcerpt(item.contentSnippet ?? item.content ?? null),
      body: sanitizeBody(item.content ?? item["content:encoded"] ?? null),
      imageUrl: extractImage(item),
    };

    try {
      await callInternal("/news/ingest", payload);
      ingested += 1;
    } catch (err: any) {
      // Duplicate or validation error — skip silently
      skipped += 1;
    }
  }

  return { ingested, skipped };
}

/**
 * Try to detect a more specific NewsKind from the title/categories.
 */
function detectKind(
  title: string,
  categories: string[] | undefined,
  fallback: NewsKind,
): NewsKind {
  const text = [title, ...(categories ?? [])].join(" ").toLowerCase();

  if (
    text.includes("set release") ||
    text.includes("new set") ||
    text.includes("expansion") ||
    text.includes("booster")
  ) {
    return "SET_RELEASE";
  }
  if (
    text.includes("price") ||
    text.includes("market watch") ||
    text.includes("price update")
  ) {
    return "PRICE_UPDATE";
  }
  if (
    text.includes("event") ||
    text.includes("tournament") ||
    text.includes("championship") ||
    text.includes("regional")
  ) {
    return "EVENT";
  }

  return fallback;
}

function extractExcerpt(raw: string | null): string | null {
  if (!raw) return null;
  // Strip HTML tags and limit length
  const text = raw.replace(/<[^>]*>/g, "").trim();
  return text.length > 500 ? text.slice(0, 497) + "..." : text || null;
}

function sanitizeBody(raw: string | null): string | null {
  if (!raw) return null;
  // Keep HTML but limit total size
  return raw.length > 20000 ? raw.slice(0, 20000) : raw;
}

function extractImage(item: any): string | null {
  // Try enclosure (common in RSS)
  if (item.enclosure?.url) return item.enclosure.url;

  // Try media:content
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (typeof item.mediaContent === "string" && item.mediaContent.startsWith("http")) return item.mediaContent;

  // Try media:thumbnail
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (typeof item.mediaThumbnail === "string" && item.mediaThumbnail.startsWith("http")) return item.mediaThumbnail;

  // Try to find first <img> in content
  const content = item.contentEncoded ?? item.content ?? item.summary ?? "";
  const match = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  return match?.[1] ?? null;
}
