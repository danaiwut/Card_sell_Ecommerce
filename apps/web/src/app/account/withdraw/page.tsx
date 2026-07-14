"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Clock, CheckCircle, XCircle } from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { formatBaht, formatDate } from "@/lib/format";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import Link from "next/link";

const STATUS_ICON: Record<string, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  COMPLETED: CheckCircle,
  REJECTED: XCircle,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "รอเมเนเจอร์อนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  COMPLETED: "โอนเงินสดแล้ว",
  REJECTED: "ปฏิเสธ — เครดิตคืนแล้ว",
};

export default function WithdrawPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data: wallet } = useQuery({
    queryKey: ["wallet", session?.userId],
    queryFn: () => api.get<{ balance: number }>("/wallet", true),
    enabled: Boolean(session),
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["withdrawals", session?.userId],
    queryFn: () =>
      api.get<
        {
          id: string;
          amount: number;
          status: string;
          note: string | null;
          managerNote: string | null;
          createdAt: string;
        }[]
      >("/wallet/withdrawals", true),
    enabled: Boolean(session),
  });

  const withdraw = useMutation({
    mutationFn: () =>
      api.post("/wallet/withdraw", {
        amount: Number(amount),
        note: note || undefined,
      }),
    onSuccess: () => {
      setAmount("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <div className="border-b border-ink/10 pb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              ผู้ขาย
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold">ถอนเครดิต</h1>
            <p className="mt-1 text-sm text-ink/50">
              แลกเครดิตจากการขายบน Marketplace เป็นเงินสดผ่านเมเนเจอร์
            </p>
          </div>

          <div className="mt-6 card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                  เครดิตที่ถอนได้
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-gold">
                  {formatBaht(wallet?.balance ?? 0)}
                </p>
              </div>
              <Link href="/account/wallet" className="text-sm text-gold hover:underline">
                กระเป๋าเครดิต →
              </Link>
            </div>

            <div className="mt-6 rounded-lg bg-ink/[0.03] p-4 text-sm text-ink/60">
              <p className="font-medium text-ink">วิธีถอนเครดิต</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>กรอกจำนวนเครดิตที่ต้องการถอน (ขั้นต่ำ ฿100)</li>
                <li>ระบบหักเครดิตและส่งคำขอให้เมเนเจอร์</li>
                <li>เมเนเจอร์โอนเงินสดให้คุณนอกระบบ แล้วกดอนุมัติ</li>
              </ol>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-ink/50">จำนวน (฿)</label>
                <input
                  className="input mt-1"
                  type="number"
                  min={100}
                  placeholder="เช่น 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/50">หมายเหตุ (ไม่บังคับ)</label>
                <input
                  className="input mt-1"
                  placeholder="เช่น โอนเข้า KBANK xxx-x-xxxxx-x"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn-primary mt-4 w-full"
              disabled={
                withdraw.isPending ||
                !amount ||
                Number(amount) < 100 ||
                Number(amount) > (wallet?.balance ?? 0)
              }
              onClick={() => withdraw.mutate()}
            >
              <Banknote size={16} className="mr-2 inline" />
              {withdraw.isPending ? "กำลังส่งคำขอ…" : `ขอถอน ฿${Number(amount || 0).toLocaleString()}`}
            </button>
            {withdraw.isError && (
              <p className="mt-2 text-sm text-red-600">ส่งคำขอไม่สำเร็จ — ตรวจสอบยอดเครดิต</p>
            )}
          </div>

          <div className="mt-6 card overflow-hidden">
            <div className="border-b border-ink/10 px-5 py-4">
              <h2 className="font-semibold">ประวัติการถอน</h2>
            </div>
            <div className="divide-y divide-ink/5">
              {(withdrawals ?? []).map((w) => {
                const Icon = STATUS_ICON[w.status] ?? Clock;
                return (
                  <div key={w.id} className="flex items-center justify-between px-5 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={
                          w.status === "COMPLETED"
                            ? "text-green-600"
                            : w.status === "REJECTED"
                              ? "text-red-500"
                              : "text-gold"
                        }
                      />
                      <div>
                        <p className="font-medium">{formatBaht(w.amount)}</p>
                        <p className="text-xs text-ink/50">{STATUS_LABEL[w.status] ?? w.status}</p>
                        {w.managerNote && (
                          <p className="mt-0.5 text-xs text-ink/40">{w.managerNote}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-ink/40">{formatDate(w.createdAt)}</p>
                  </div>
                );
              })}
              {(withdrawals?.length ?? 0) === 0 && (
                <p className="px-5 py-8 text-center text-sm text-ink/40">ยังไม่มีคำขอถอน</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
