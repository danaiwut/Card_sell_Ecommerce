"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { formatDate } from "@/lib/format";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null; // เช่น "/account/orders", "/account/sales/xyz"
  createdAt: string;
}

interface NotificationPayload {
  unread: number;
  items: NotificationItem[];
}

export default function NotificationsPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["notifications", session?.userId],
    queryFn: () => api.get<NotificationPayload>("/notifications", true),
    enabled: Boolean(session),
  });

  // อ่านทั้งหมดในครั้งเดียว
  const readAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // อ่านทีละอัน — เรียกตอนกดรายการ
  const readOne = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // กดที่การแจ้งเตือน: mark read ก่อน แล้วค่อย navigate ถ้ามี link
  function handleClick(n: NotificationItem) {
    if (!n.read) readOne.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-semibold">การแจ้งเตือน</h1>
          {/* badge แสดงจำนวนที่ยังไม่อ่าน */}
          {(data?.unread ?? 0) > 0 && (
            <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-white">
              {data?.unread}
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn-outline"
          onClick={() => readAll.mutate()}
          disabled={readAll.isPending || (data?.unread ?? 0) === 0}
        >
          ทำเครื่องหมายอ่านทั้งหมด
        </button>
      </div>

      <div className="card mt-5 divide-y divide-ink/5">
        {(data?.items ?? []).map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            // ถ้ามี link หรือยังไม่อ่าน → แสดง cursor pointer ให้รู้ว่ากดได้
            className={`relative p-4 transition ${
              n.read ? "opacity-60" : "bg-ink/[0.02]"
            } ${n.link ? "cursor-pointer hover:bg-ink/5" : n.read ? "" : "cursor-pointer hover:bg-ink/5"}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {/* จุดแสดง unread */}
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />}
                <p className="font-medium">{n.title}</p>
              </div>
              <span className="shrink-0 text-xs text-ink/40">{formatDate(n.createdAt)}</span>
            </div>
            {n.body && <p className="mt-1 text-sm text-ink/60 pl-4">{n.body}</p>}
            {/* แสดง label ว่ากดแล้วจะไปไหน ถ้ามี link */}
            {n.link && (
              <p className="mt-1 pl-4 text-xs text-gold/70">ดูรายละเอียด →</p>
            )}
          </div>
        ))}
        {(data?.items.length ?? 0) === 0 && (
          <p className="p-6 text-sm text-ink/40">ไม่มีการแจ้งเตือน</p>
        )}
      </div>
    </div>
  );
}

