import { fetchPublic } from "@/lib/api-client/server";
import { NewsPageClient, type NewsPost } from "@/components/news/news-page-client";

export const revalidate = 120;

const TABS = ["ALL", "NEWS", "EVENT", "SET_RELEASE", "PRICE_UPDATE"] as const;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const kind = typeof params.kind === "string" ? params.kind : undefined;
  const tab =
    kind && (TABS as readonly string[]).includes(kind)
      ? (kind as (typeof TABS)[number])
      : "ALL";

  const [posts, events] = await Promise.all([
    fetchPublic<NewsPost[]>(`/news${tab === "ALL" ? "" : `?kind=${tab}`}`, {
      tags: ["news", tab],
    }),
    fetchPublic<NewsPost[]>("/news/events/upcoming", { tags: ["news-events"] }),
  ]);

  return <NewsPageClient initialPosts={posts} initialEvents={events} initialTab={tab} />;
}
