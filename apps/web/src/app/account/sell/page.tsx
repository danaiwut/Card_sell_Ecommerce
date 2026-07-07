"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CARD_CONDITIONS,
  type CatalogItemDto,
  type ListingDto,
  type Paginated,
} from "@cardverse/shared";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { formatBaht } from "@/lib/format";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { ShipmentUpdateForm, type ShipmentUpdatePayload } from "@/components/shipment-update-form";
import { TrackingTimeline } from "@/components/tracking-timeline";

export default function SellPage() {
  const { session } = useSession();
  const qc = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["connect-status", session?.userId],
    queryFn: () => api.get<{ onboarded: boolean; mock: boolean }>("/payments/connect/status", true),
    enabled: Boolean(session),
  });
  const { data: listings } = useQuery({
    queryKey: ["my-listings", session?.userId],
    queryFn: () => api.get<ListingDto[]>("/marketplace/listings/mine", true),
    enabled: Boolean(session),
  });
  const { data: sales } = useQuery({
    queryKey: ["my-sales", session?.userId],
    queryFn: () => api.get<any[]>("/marketplace/sales", true),
    enabled: Boolean(session),
  });

  const onboard = useMutation({
    mutationFn: () => api.post<{ url: string }>("/payments/connect/onboard"),
    onSuccess: (res) => {
      if (res.url) window.location.href = res.url;
      qc.invalidateQueries({ queryKey: ["connect-status"] });
    },
  });

  if (!session) return <DevLogin />;

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-semibold">ลงขายในมาร์เก็ตเพลส</h1>
            {!status?.onboarded ? (
              <div className="card mt-4 p-5">
                <p className="text-sm text-ink/70">
                  ต้องเชื่อมต่อบัญชีรับเงิน (Stripe Connect) ก่อนลงขาย เพื่อรับเงินเมื่อจัดส่งสำเร็จ
                </p>
                <button className="btn-gold mt-3" disabled={onboard.isPending} onClick={() => onboard.mutate()}>
                  เชื่อมต่อบัญชีรับเงิน
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-green-600">✓ บัญชีรับเงินพร้อมใช้งาน</p>
            )}
          </div>

          {status?.onboarded && <CreateListingForm />}

          <section>
            <h2 className="text-sm font-semibold tracking-wider text-ink/50">MY LISTINGS</h2>
            <div className="card mt-3 divide-y divide-ink/5">
              {(listings ?? []).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-4 text-sm">
                  <span>{l.catalogItem.name} • {l.condition}</span>
                  <span className="price">{formatBaht(l.price)}</span>
                </div>
              ))}
              {(listings?.length ?? 0) === 0 && (
                <p className="p-4 text-sm text-ink/40">ยังไม่มีประกาศขาย</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold tracking-wider text-ink/50">SALES & SHIPPING</h2>
                <p className="mt-1 text-sm text-ink/50">
                  อัปเดตขนส่งและ tracking สำหรับออเดอร์ marketplace ที่ขายได้
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {(sales ?? []).map((s) => (
                <SaleRow key={s.id} sale={s} />
              ))}
              {(sales?.length ?? 0) === 0 && <p className="text-sm text-ink/40">ยังไม่มียอดขาย</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CreateListingForm() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CatalogItemDto | null>(null);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<(typeof CARD_CONDITIONS)[number]>("NEAR_MINT");

  const { data: results } = useQuery({
    queryKey: ["catalog-search", q],
    queryFn: () => api.get<Paginated<CatalogItemDto>>(`/catalog-items?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/marketplace/listings", {
        catalogItemId: selected!.id,
        price: Number(price),
        condition,
        quantity: 1,
      }),
    onSuccess: () => {
      setSelected(null);
      setPrice("");
      setQ("");
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold tracking-wider text-ink/50">สร้างประกาศใหม่</h2>
      <p className="mt-1 text-xs text-ink/50">
        เลือกการ์ดจาก catalog เท่านั้น (กรอกเองไม่ได้) เพื่อให้ราคาเข้ากราฟได้ถูกต้อง
      </p>

      {!selected ? (
        <div className="relative mt-3">
          <input
            className="input"
            placeholder="ค้นหาการ์ดใน catalog…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {(results?.items.length ?? 0) > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-ink/10 bg-white shadow-card">
              {results!.items.map((it) => (
                <li key={it.id}>
                  <button
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cream"
                    onClick={() => setSelected(it)}
                  >
                    <span>{it.name}</span>
                    <span className="text-xs text-ink/50">{it.setName} • {it.rarity}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between rounded-md bg-ink/[0.04] px-3 py-2 text-sm">
          <span>
            {selected.name} <span className="text-ink/50">({selected.setName})</span>
          </span>
          <button className="text-xs text-gold" onClick={() => setSelected(null)}>
            เปลี่ยน
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink/50">ราคา (฿)</label>
          <input
            className="input mt-1"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-ink/50">สภาพการ์ด</label>
          <select
            className="input mt-1"
            value={condition}
            onChange={(e) => setCondition(e.target.value as any)}
          >
            {CARD_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        className="btn-primary mt-4"
        disabled={!selected || !price || create.isPending}
        onClick={() => create.mutate()}
      >
        ลงขาย
      </button>
    </div>
  );
}

function SaleRow({ sale }: { sale: any }) {
  const qc = useQueryClient();
  const autoFlashTracking =
    sale.shipment?.carrier === "FLASH" &&
    sale.shipment?.trackingNumber &&
    sale.shipment?.autoTrackingEnabled;

  const ship = useMutation({
    mutationFn: (payload: ShipmentUpdatePayload) =>
      api.post(`/shipping/marketplace/${sale.id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-sales"] }),
  });

  return (
    <div className="card p-5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{sale.listing.catalogItem.name}</p>
          <p className="mt-1 text-xs text-ink/50">
            ผู้ซื้อ {sale.buyer?.displayName ?? "—"} • ยอดขาย {formatBaht(sale.amount)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-ink/50">{sale.status}</span>
          <div className="mt-2">
            <ShipmentStatusBadge status={sale.shipment?.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_420px]">
        <TrackingTimeline
          events={sale.shipment?.events ?? []}
          currentStatus={sale.shipment?.status ?? "PENDING"}
        />
        <div>
          {autoFlashTracking ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                ระบบติดตาม Flash Express อัตโนมัติแล้ว
              </p>
              <p className="mt-2 text-sm text-emerald-700">
                {sale.shipment.carrier} • {sale.shipment.trackingNumber}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-emerald-700/80">
                สถานะจะอัปเดตจาก Flash webhook และ reconciliation job โดยไม่ต้องกรอกสถานะเอง
              </p>
            </div>
          ) : (
            <>
              <ShipmentUpdateForm
                pending={ship.isPending}
                initialCarrier={sale.shipment?.carrier}
                initialTrackingNumber={sale.shipment?.trackingNumber}
                initialStatus={sale.shipment?.status ?? "SHIPPED"}
                onSubmit={(payload) => ship.mutate(payload)}
              />
              <p className="mt-3 text-xs leading-relaxed text-ink/50">
                เมื่อใส่เลขพัสดุครั้งแรก ระบบจะเปลี่ยนสถานะ escrow เป็นจัดส่งแล้ว
                ถ้าเลือก Flash Express ระบบจะติดตามสถานะให้อัตโนมัติ
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
