"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function NotFoundSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-xl overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card"
    >
      <label className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <Search size={18} className="shrink-0 text-ink/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What are you looking for today?"
          className="w-full border-0 bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-ink/35"
          aria-label="Search"
        />
      </label>
      <button
        type="submit"
        className="shrink-0 bg-gold px-5 text-sm font-semibold text-white transition hover:bg-gold-light sm:px-7"
      >
        Search
      </button>
    </form>
  );
}
