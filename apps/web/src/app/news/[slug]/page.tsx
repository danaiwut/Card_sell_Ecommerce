"use client";

import Link from "next/link";
import Image from "next/image";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface NewsDetail {
  id: string;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  imageUrl: string | null;
  eventDate: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  createdAt: string;
}

const KIND_LABEL: Record<string, string> = {
  NEWS: "News",
  EVENT: "Event",
  SET_RELEASE: "Set Release",
  PRICE_UPDATE: "Price Update",
};

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data, isError } = useQuery({
    queryKey: ["news-detail", slug],
    queryFn: () => api.get<NewsDetail>(`/news/${slug}`),
  });

  if (isError) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">ไม่พบบทความ</h1>
        <Link href="/news" className="btn-primary mt-4 inline-flex">
          กลับไปหน้าข่าว
        </Link>
      </div>
    );
  }

  if (!data) return <div className="container-page py-10">Loading…</div>;

  return (
    <div className="container-page py-8">
      <Link href="/news" className="text-sm text-ink/50 hover:text-ink">
        ← กลับไป News &amp; Events
      </Link>

      <article className="mx-auto mt-6 max-w-3xl">
        <span className="text-xs font-semibold tracking-wider text-gold">
          {KIND_LABEL[data.kind] ?? data.kind}
        </span>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{data.title}</h1>
        <p className="mt-2 text-sm text-ink/50">
          {formatDate(data.createdAt)}
          {data.eventDate ? ` · Event: ${formatDate(data.eventDate)}` : ""}
        </p>

        {data.imageUrl && (
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-xl bg-ink/5">
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        {data.excerpt && (
          <p className="mt-6 text-lg leading-relaxed text-ink/70">{data.excerpt}</p>
        )}

        {data.body && (
          <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-ink/80">
            {data.body}
          </div>
        )}

        {data.sourceUrl && (
          <p className="mt-8 text-sm text-ink/50">
            ที่มา:{" "}
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline"
            >
              {data.sourceName ?? data.sourceUrl}
            </a>
          </p>
        )}
      </article>
    </div>
  );
}
