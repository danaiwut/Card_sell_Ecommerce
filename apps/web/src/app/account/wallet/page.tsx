"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { formatBaht, formatDate } from "@/lib/format";
import { DevLogin } from "@/components/dev-login";
import { AccountLayout } from "@/components/account-layout";
import Link from "next/link";

const TOP_UP_PRESETS = [100, 500, 1000, 2000, 5000];

export default function WalletPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");

  const { data: wallet } = useQuery({
    queryKey: ["wallet", session?.userId],
    queryFn: () =>
      api.get<{ balance: number; heldBalance: number; available: number }>("/wallet", true),
    enabled: Boolean(session),
  });

  const { data: transactions } = useQuery({
    queryKey: ["wallet-transactions", session?.userId],
    queryFn: () =>
      api.get<
        {
          id: string;
          type: string;
          amount: number;
          balanceAfter: number;
          description: string | null;
          createdAt: string;
        }[]
      >("/wallet/transactions", true),
    enabled: Boolean(session),
  });

  const topUp = useMutation({
    mutationFn: (amt: number) => api.post("/wallet/top-up", { amount: amt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!session) return <DevLogin />;

  const topUpAmount = custom ? Number(custom) : amount;

  return (
    <AccountLayout>
          <div className="border-b border-ink/10 pb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
              เครดิต
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold">กระเป๋าเครดิต</h1>
            <p className="mt-1 text-sm text-ink/50">
              ใช้เครดิตแทนเงินสดซื้อสินค้า — ลดโอกาสซื้อของตัวเองเพื่อหลีกเลี่ยงระบบ
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="card bg-ink p-5 text-white">
              <div className="flex items-center gap-2 text-gold">
                <Coins size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">ยอดใช้ได้</span>
              </div>
              <p className="mt-3 font-display text-3xl font-semibold">
                {formatBaht(wallet?.balance ?? 0)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                ถูกล็อก (Escrow)
              </p>
              <p className="mt-3 font-display text-2xl font-semibold text-ink/70">
                {formatBaht(wallet?.heldBalance ?? 0)}
              </p>
            </div>
            <div className="card flex flex-col justify-center p-5">
              <Link href="/account/withdraw" className="btn-outline w-full text-center">
                ถอนเครดิต → เงินสด
              </Link>
              <p className="mt-2 text-center text-xs text-ink/40">
                สำหรับผู้ขายบน Marketplace
              </p>
            </div>
          </div>

          <div className="mt-6 card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Plus size={18} className="text-gold" />
              เติมเครดิต (Demo)
            </h2>
            <p className="mt-1 text-sm text-ink/50">
              โหมด Demo — เติมเครดิตทันทีโดยไม่ผ่าน payment gateway จริง
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TOP_UP_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setAmount(p);
                    setCustom("");
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    amount === p && !custom
                      ? "border-gold bg-gold/10 text-ink"
                      : "border-ink/10 hover:border-ink/20"
                  }`}
                >
                  ฿{p.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <input
                className="input flex-1"
                type="number"
                placeholder="จำนวนอื่น (฿)"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                min={10}
                max={100000}
              />
              <button
                className="btn-primary"
                disabled={topUp.isPending || topUpAmount < 10}
                onClick={() => topUp.mutate(topUpAmount)}
              >
                {topUp.isPending ? "กำลังเติม…" : `เติม ฿${topUpAmount.toLocaleString()}`}
              </button>
            </div>
            {topUp.isError && (
              <p className="mt-2 text-sm text-red-600">เติมเครดิตไม่สำเร็จ กรุณาลองใหม่</p>
            )}
            {topUp.isSuccess && (
              <p className="mt-2 text-sm text-green-600">เติมเครดิตสำเร็จ!</p>
            )}
          </div>

          <div className="mt-6 card overflow-hidden">
            <div className="border-b border-ink/10 px-5 py-4">
              <h2 className="font-semibold">ประวัติธุรกรรม</h2>
            </div>
            <div className="divide-y divide-ink/5">
              {(transactions ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    {t.amount >= 0 ? (
                      <ArrowDownLeft size={16} className="text-green-600" />
                    ) : (
                      <ArrowUpRight size={16} className="text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{t.description ?? t.type}</p>
                      <p className="text-xs text-ink/40">{formatDate(t.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${t.amount >= 0 ? "text-green-600" : "text-ink"}`}>
                      {t.amount >= 0 ? "+" : ""}
                      {formatBaht(t.amount)}
                    </p>
                    <p className="text-xs text-ink/40">คงเหลือ {formatBaht(t.balanceAfter)}</p>
                  </div>
                </div>
              ))}
              {(transactions?.length ?? 0) === 0 && (
                <p className="px-5 py-8 text-center text-sm text-ink/40">ยังไม่มีธุรกรรม</p>
              )}
            </div>
          </div>
        </AccountLayout>
  );
}
