"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type CatalogItemDto, type ShipmentUpdateEventDto } from "@cardverse/shared";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { isClerkEnabled } from "@/lib/clerk-config";
import { formatDate } from "@/lib/format";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000";
const ACTIVE_SHIPMENT_STATUS = new Set([
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "LABEL_CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
]);

interface CardRow {
  id: string;
  catalogItem: CatalogItemDto;
}

interface ShipmentView {
  carrier: string | null;
  trackingNumber: string | null;
  status: string;
  autoTrackingEnabled?: boolean;
  events: { status: string; note?: string | null; at: string }[];
}

interface ShopOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  shipment: ShipmentView | null;
}

interface PurchaseRow {
  id: string;
  status: string;
  listing: { catalogItem: { name: string } };
  shipment: ShipmentView | null;
}

function CollectionInner() {
  const { session } = useSession();
  const qc = useQueryClient();

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist", session?.userId],
    queryFn: () => api.get<CardRow[]>("/collection/wishlist", true),
    enabled: Boolean(session),
  });
  const { data: orders } = useQuery({
    queryKey: ["orders", session?.userId],
    queryFn: () => api.get<ShopOrderRow[]>("/orders", true),
    enabled: Boolean(session),
  });
  const { data: purchases } = useQuery({
    queryKey: ["purchases", session?.userId],
    queryFn: () => api.get<PurchaseRow[]>("/marketplace/purchases", true),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (!session) return;
    const socket = io(WS_URL, { transports: ["websocket"] });
    socket.on(SOCKET_EVENTS.SHIPMENT_UPDATE, (event: ShipmentUpdateEventDto) => {
      if (!event.userIds.includes(session.userId)) return;
      qc.invalidateQueries({ queryKey: ["orders", session.userId] });
      qc.invalidateQueries({ queryKey: ["purchases", session.userId] });
    });
    return () => {
      socket.disconnect();
    };
  }, [qc, session]);

  const activeShipments = useMemo(() => {
    const shopRows = (orders ?? [])
      .filter((order) => order.shipment && ACTIVE_SHIPMENT_STATUS.has(order.shipment.status))
      .map((order) => ({
        id: `shop-${order.id}`,
        title: `Order ${order.orderNumber}`,
        href: `/account/orders/${order.id}`,
        shipment: order.shipment!,
      }));
    const purchaseRows = (purchases ?? [])
      .filter((purchase) => purchase.shipment && ACTIVE_SHIPMENT_STATUS.has(purchase.shipment.status))
      .map((purchase) => ({
        id: `purchase-${purchase.id}`,
        title: purchase.listing.catalogItem.name,
        href: `/account/purchases/${purchase.id}`,
        shipment: purchase.shipment!,
      }));
    return [...shopRows, ...purchaseRows];
  }, [orders, purchases]);

  // toggle = add ถ้าไม่มี, remove ถ้ามีอยู่แล้ว
  // เรียก toggle ตอนการ์ดอยู่ใน wishlist แล้ว → ลบออก
  const remove = useMutation({
    mutationFn: (catalogItemId: string) =>
      api.post("/collection/wishlist/toggle", { catalogItemId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  if (!session) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">กรุณาเข้าสู่ระบบเพื่อดู wishlist ของคุณ</p>
        <Link href={isClerkEnabled() ? "/sign-in" : "/account"} className="btn-primary mt-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">Wishlist</h1>
        {(wishlist?.length ?? 0) > 0 && (
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/60">
            {wishlist?.length} รายการ
          </span>
        )}
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-ink/50">
              พัสดุที่กำลังจัดส่ง
            </h2>
            <p className="mt-1 text-sm text-ink/50">
              สถานะจะอัปเดตอัตโนมัติเมื่อ Flash Express ส่ง webhook เข้ามา
            </p>
          </div>
        </div>
        {activeShipments.length ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {activeShipments.map((item) => {
              const latest = item.shipment.events.at(-1);
              return (
                <Link key={item.id} href={item.href} className="card block p-4 hover:border-gold/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-ink/50">
                        {item.shipment.carrier ?? "Carrier"} • {item.shipment.trackingNumber ?? "รอเลขพัสดุ"}
                      </p>
                    </div>
                    <ShipmentStatusBadge status={item.shipment.status} />
                  </div>
                  {latest && (
                    <p className="mt-3 text-xs text-ink/50">
                      ล่าสุด {formatDate(latest.at)} {latest.note ? `• ${latest.note}` : ""}
                    </p>
                  )}
                  {item.shipment.autoTrackingEnabled && (
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      ติดตามอัตโนมัติผ่าน Flash Express
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink/40">ยังไม่มีพัสดุที่กำลังจัดส่ง</p>
        )}
      </section>

      {!wishlist?.length ? (
        <p className="mt-8 text-sm text-ink/40">ยังไม่มีรายการโปรด</p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-4 md:grid-cols-6">
          {wishlist.map((r) => (
            <div key={r.id} className="group relative">
              {/* กดที่รูปไปหน้า marketplace */}
              <Link
                href={`/marketplace/${r.catalogItem.id}`}
                className="relative block aspect-[3/4] overflow-hidden rounded-lg bg-ink/5"
              >
                {r.catalogItem.imageUrl && (
                  <Image
                    src={r.catalogItem.imageUrl}
                    alt={r.catalogItem.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                )}
              </Link>

              {/* ปุ่ม X ลบออกจาก wishlist — โชว์ตอน hover */}
              <button
                type="button"
                aria-label={`ลบ ${r.catalogItem.name} ออกจาก wishlist`}
                onClick={() => remove.mutate(r.catalogItem.id)}
                disabled={remove.isPending}
                className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white hover:bg-black/80 group-hover:flex"
              >
                <X size={12} />
              </button>

              {/* ชื่อการ์ด */}
              <p className="mt-1.5 truncate text-xs text-ink/60">{r.catalogItem.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <CollectionInner />
    </Suspense>
  );
}

