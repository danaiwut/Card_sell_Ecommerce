"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CARD_CONDITIONS,
  LISTING_ITEM_TYPES,
  type CatalogItemDto,
  type ListingDto,
  type ListingItemType,
} from "@cardverse/shared";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountLayout } from "@/components/account-layout";
import { SuccessBanner } from "@/components/success-banner";
import { CatalogItemPicker } from "@/components/catalog-item-picker";
import { formatBaht } from "@/lib/format";
import { uploadImage } from "@/lib/upload";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { ShipmentUpdateForm, type ShipmentUpdatePayload } from "@/components/shipment-update-form";
import { TrackingTimeline } from "@/components/tracking-timeline";
import Link from "next/link";

export default function SellPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <SellPageInner />
    </Suspense>
  );
}

function SellPageInner() {
  const { session } = useSession();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("onboarded") === "1") {
      setBanner("เชื่อมต่อบัญชีรับเงินสำเร็จ! พร้อมลงขายแล้ว");
    } else if (searchParams.get("refresh") === "1") {
      setBanner("กรุณาเชื่อมต่อบัญชีรับเงินให้เสร็จก่อนลงขาย");
    }
  }, [searchParams]);

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
    <AccountLayout>
        <div className="space-y-8">
          {banner && (
            <SuccessBanner message={banner} onDismiss={() => setBanner(null)} />
          )}
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
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wider text-ink/50">MY LISTINGS</h2>
              <Link href="/account/offers" className="text-xs font-semibold text-gold hover:underline">
                ดูข้อเสนอราคา →
              </Link>
            </div>
            <div className="card mt-3 divide-y divide-ink/5">
              {(listings ?? []).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-4 text-sm">
                  <span>
                    {l.catalogItem.name} • {l.itemType === "BOX" ? "กล่อง" : `เกรด ${l.grade ?? "—"}`} • {l.condition}
                  </span>
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
    </AccountLayout>
  );
}

function CreateListingForm() {
  const qc = useQueryClient();
  const [itemType, setItemType] = useState<ListingItemType>("SINGLE_CARD");
  const [selected, setSelected] = useState<CatalogItemDto | null>(null);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<(typeof CARD_CONDITIONS)[number]>("NEAR_MINT");
  const [grade, setGrade] = useState("8");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.post("/marketplace/listings", {
        catalogItemId: selected!.id,
        itemType,
        price: Number(price),
        condition: itemType === "SINGLE_CARD" ? condition : undefined,
        grade: itemType === "SINGLE_CARD" ? Number(grade) : undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        description: description || undefined,
        quantity: 1,
      }),
    onSuccess: () => {
      setSelected(null);
      setPrice("");
      setDescription("");
      setImageUrls([]);
      setSuccessMsg("ลงขายสำเร็จ!");
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: (err: Error) => {
      alert(err.message || "ลงขายไม่สำเร็จ");
    },
  });

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold tracking-wider text-ink/50">สร้างประกาศใหม่</h2>
      <p className="mt-1 text-xs text-ink/50">
        ระบุว่าขายการ์ดใบเดียวหรือกล่อง เลือก catalog ที่มีอยู่หรือสร้างใหม่ พร้อมอัปโหลดรูปเองได้
      </p>

      <div className="mt-4">
        <label className="text-xs font-semibold tracking-wider text-ink/50">ประเภทสินค้า</label>
        <div className="mt-2 flex gap-2">
          {LISTING_ITEM_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                itemType === type ? "bg-ink text-white" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              }`}
              onClick={() => setItemType(type)}
            >
              {type === "SINGLE_CARD" ? "การ์ดใบเดียว" : "กล่อง"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <CatalogItemPicker
          value={selected}
          onChange={setSelected}
          createEndpoint="/catalog-items"
          optionsEndpoint="/catalog/options"
          optionsAuth
          createAuth
          showRarity={itemType === "SINGLE_CARD"}
        />
      </div>

      {itemType === "SINGLE_CARD" && selected?.rarity && (
        <p className="mt-3 rounded-md bg-gold/10 px-3 py-2 text-sm">
          ระดับการ์ด (Rarity): <span className="font-semibold">{selected.rarity}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink/50">ราคาขาย (฿)</label>
          <input
            className="input mt-1"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        {itemType === "SINGLE_CARD" ? (
          <>
            <div>
              <label className="text-xs text-ink/50">เกรดการ์ด (1-10)</label>
              <p className="text-xs text-ink/40">คะแนนประเมินสภาพการ์ด</p>
              <select className="input mt-1" value={grade} onChange={(e) => setGrade(e.target.value)}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-ink/50">สภาพการ์ด</label>
              <select
                className="input mt-1"
                value={condition}
                onChange={(e) => setCondition(e.target.value as typeof condition)}
              >
                {CARD_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="col-span-2 text-xs text-ink/50 sm:col-span-1">
            <p className="mt-6 rounded-md bg-ink/[0.04] px-3 py-2">กล่องไม่ต้องระบุเกรดการ์ด</p>
          </div>
        )}
      </div>

      <div className="mt-3">
        <label className="text-xs text-ink/50">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
        <textarea
          className="input mt-1 min-h-20"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="อธิบายสภาพหรือรายละเอียดเพิ่มเติม"
        />
      </div>

      <div className="mt-3">
        <label className="text-xs font-semibold tracking-wider text-ink/50">รูปภาพประกาศ (อัปโหลดได้สูงสุด 5 รูป)</label>
        <input
          className="input mt-1"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading || imageUrls.length >= 5}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              const url = await uploadImage(file, "listings");
              setImageUrls((prev) => [...prev, url].slice(0, 5));
            } finally {
              setUploading(false);
              e.target.value = "";
            }
          }}
        />
        {uploading && <p className="mt-1 text-xs text-ink/50">กำลังอัปโหลด...</p>}
        {imageUrls.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="h-16 w-16 rounded-md object-cover" />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs text-white"
                  onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn-primary mt-4"
        disabled={!selected || !price || create.isPending}
        onClick={() => {
          setSuccessMsg(null);
          create.mutate();
        }}
      >
        {create.isPending ? "กำลังลงขาย..." : "ลงขาย"}
      </button>
      {successMsg && <p className="mt-2 text-sm text-green-600">{successMsg}</p>}
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
                currentStatus={sale.shipment?.status ?? "PENDING"}
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
