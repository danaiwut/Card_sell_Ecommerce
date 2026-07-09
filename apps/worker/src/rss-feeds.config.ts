import type { NewsKind } from "@cardverse/shared";

export interface FeedSource {
  /** Display name shown as sourceName in the news post */
  name: string;
  /** RSS feed URL */
  url: string;
  /** Default NewsKind for items from this feed */
  kind: NewsKind;
  /** If true, imported posts are published immediately without admin review */
  autoPublish: boolean;
}

/**
 * RSS feeds to aggregate.
 * Add or remove entries here to control which external news sources appear on the site.
 */
export const RSS_FEEDS: FeedSource[] = [
  {
    name: "PokeBeach",
    url: "https://www.pokebeach.com/feed",
    kind: "NEWS",
    autoPublish: false,
  },
  {
    name: "TCGplayer Infinite",
    url: "https://infinite.tcgplayer.com/feed",
    kind: "NEWS",
    autoPublish: false,
  },
  {
    name: "MTG Goldfish",
    url: "https://www.mtggoldfish.com/articles.rss",
    kind: "NEWS",
    autoPublish: false,
  },
  {
    name: "YGOrganization",
    url: "https://ygorganization.com/feed/",
    kind: "NEWS",
    autoPublish: false,
  },
];
