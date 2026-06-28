"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface NewsPost {
  id: string;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  eventDate: string | null;
  createdAt: string;
}

const TABS = ["ALL", "NEWS", "EVENT", "SET_RELEASE", "PRICE_UPDATE"] as const;
const LABELS: Record<string, string> = {
  ALL: "ALL",
  NEWS: "NEWS",
  EVENT: "EVENTS",
  SET_RELEASE: "SET RELEASE",
  PRICE_UPDATE: "PRICE UPDATE",
};

export default function NewsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");

  const { data: posts } = useQuery({
    queryKey: ["news", tab],
    queryFn: () => api.get<NewsPost[]>(`/news${tab === "ALL" ? "" : `?kind=${tab}`}`),
  });
  const { data: events } = useQuery({
    queryKey: ["events-upcoming"],
    queryFn: () => api.get<NewsPost[]>("/news/events/upcoming"),
  });

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-semibold">News &amp; Events</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === tb ? "bg-ink text-white" : "border border-ink/15 text-ink/60"
            }`}
          >
            {LABELS[tb]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {(posts ?? []).map((p) => (
            <article key={p.id} className="card flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-ink/5">
                {p.imageUrl && <Image src={p.imageUrl} alt="" fill className="object-cover" />}
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider text-gold">
                  {LABELS[p.kind] ?? p.kind}
                </span>
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <p className="text-xs text-ink/40">{formatDate(p.createdAt)}</p>
                {p.excerpt && <p className="mt-1 text-sm text-ink/60">{p.excerpt}</p>}
              </div>
            </article>
          ))}
        </div>

        <aside className="card h-fit p-5">
          <p className="text-xs font-semibold tracking-wider text-ink/50">UPCOMING EVENTS</p>
          <ul className="mt-3 space-y-3">
            {(events ?? []).map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded bg-ink/5">
                  {e.imageUrl && <Image src={e.imageUrl} alt="" fill className="object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-ink/40">{e.eventDate ? formatDate(e.eventDate) : ""}</p>
                </div>
              </li>
            ))}
          </ul>
          <button className="btn-primary mt-4 w-full">VIEW ALL EVENTS</button>
        </aside>
      </div>
    </div>
  );
}
