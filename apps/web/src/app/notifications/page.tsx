"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { formatDate } from "@/lib/format";

interface NotificationPayload {
  unread: number;
  items: { id: string; type: string; title: string; body: string | null; read: boolean; createdAt: string }[];
}

export default function NotificationsPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", session?.userId],
    queryFn: () => api.get<NotificationPayload>("/notifications", true),
    enabled: Boolean(session),
  });
  const readAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">การแจ้งเตือน</h1>
        <button className="btn-outline" onClick={() => readAll.mutate()}>
          ทำเครื่องหมายอ่านทั้งหมด
        </button>
      </div>
      <div className="card mt-5 divide-y divide-ink/5">
        {(data?.items ?? []).map((n) => (
          <div key={n.id} className={`p-4 ${n.read ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between">
              <p className="font-medium">{n.title}</p>
              <span className="text-xs text-ink/40">{formatDate(n.createdAt)}</span>
            </div>
            {n.body && <p className="text-sm text-ink/60">{n.body}</p>}
          </div>
        ))}
        {(data?.items.length ?? 0) === 0 && <p className="p-6 text-sm text-ink/40">ไม่มีการแจ้งเตือน</p>}
      </div>
    </div>
  );
}
