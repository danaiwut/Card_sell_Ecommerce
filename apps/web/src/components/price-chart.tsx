"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { PricePoint } from "@cardverse/shared";

export function PriceChart({ history }: { history: PricePoint[] }) {
  if (!history.length) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg bg-ink/5 text-sm text-ink/40">
        ยังไม่มีข้อมูลราคา
      </div>
    );
  }
  return (
    <div className="h-56 w-full rounded-lg bg-ink/[0.03] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,27,45,0.06)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(d: string) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            width={48}
            tickFormatter={(v: number) => `฿${v}`}
          />
          <Tooltip
            formatter={(v: number) => [`฿${v.toLocaleString()}`, "ราคาเฉลี่ย"]}
            labelStyle={{ fontSize: 12 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#c8961e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
