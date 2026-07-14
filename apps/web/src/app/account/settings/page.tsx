"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountLayout } from "@/components/account-layout";

export default function SettingsPage() {
  const { session } = useSession();
  const [name, setName] = useState("");

  const { data } = useQuery({
    queryKey: ["me", session?.userId],
    queryFn: () => api.get<{ displayName: string }>("/users/me", true),
    enabled: Boolean(session),
  });
  useEffect(() => {
    if (data?.displayName) setName(data.displayName);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.patch("/users/me", { displayName: name }),
  });

  if (!session) return <DevLogin />;

  return (
    <AccountLayout>
          <h1 className="font-display text-3xl font-semibold">Settings</h1>
          <div className="card mt-5 max-w-md p-5">
            <label className="text-xs font-semibold tracking-wider text-ink/50">ชื่อที่แสดง</label>
            <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn-primary mt-4" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isSuccess ? "บันทึกแล้ว ✓" : "บันทึก"}
            </button>
          </div>
        </AccountLayout>
  );
}
