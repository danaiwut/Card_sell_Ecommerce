"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import { SOCKET_EVENTS, type TradeDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { formatBaht } from "@/lib/format";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";

export function RecentSalesFeed() {
  const { data } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => api.get<TradeDto[]>("/marketplace/recent-sales?limit=10"),
  });
  const [live, setLive] = useState<TradeDto[]>([]);

  useEffect(() => {
    const socket: Socket = io(WS_URL, { transports: ["websocket"] });
    socket.on(SOCKET_EVENTS.RECENT_SALE, (trade: TradeDto) => {
      setLive((prev) => [trade, ...prev].slice(0, 10));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const sales = [...live, ...(data ?? [])].slice(0, 10);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
        </span>
        <p className="text-xs font-semibold tracking-wider text-ink/60">
          ขายล่าสุด • LIVE
        </p>
      </div>
      <ul className="space-y-2">
        {sales.map((s) => (
          <li key={s.id} className="flex items-center justify-between text-sm">
            <span className="truncate text-ink/80">
              <span className="font-medium">{s.sellerName}</span> ขาย {s.catalogItem.name}
            </span>
            <span className="price whitespace-nowrap">{formatBaht(s.price)}</span>
          </li>
        ))}
        {sales.length === 0 && <li className="text-sm text-ink/40">ยังไม่มีการขาย</li>}
      </ul>
    </div>
  );
}
