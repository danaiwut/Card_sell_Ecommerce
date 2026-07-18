"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SOCKET_EVENTS, type ShipmentUpdateEventDto } from "@cardverse/shared";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
import { getWsBaseUrl } from "@/lib/env-urls";
import { useSession } from "@/lib/session";
import { DevLogin } from "@/components/dev-login";
import { AccountLayout } from "@/components/account-layout";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { formatDate } from "@/lib/format";

const ACTIVE_SHIPMENT_STATUS = new Set([
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "LABEL_CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
]);

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

export default function AccountShipmentsPage() {
  const { session } = useSession();
  const qc = useQueryClient();

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
    const socket = io(getWsBaseUrl(), { transports: ["websocket"] });
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

  if (!session) return <DevLogin />;

  return (
    <AccountLayout>
          <h1 className="font-display text-3xl font-semibold">พัสดุที่กำลังจัดส่ง</h1>
          <p className="mt-1 text-sm text-ink/50">
            สถานะอัปเดตอัตโนมัติเมื่อมีการจัดส่ง
          </p>

          {activeShipments.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {activeShipments.map((item) => {
                const latest = item.shipment.events.at(-1);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block rounded-xl border border-ink/10 bg-white p-4 shadow-card transition hover:border-gold/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-ink/50">
                          {item.shipment.carrier ?? "Carrier"} ·{" "}
                          {item.shipment.trackingNumber ?? "รอเลขพัสดุ"}
                        </p>
                      </div>
                      <ShipmentStatusBadge status={item.shipment.status} />
                    </div>
                    {latest && (
                      <p className="mt-3 text-xs text-ink/50">
                        ล่าสุด {formatDate(latest.at)}
                        {latest.note ? ` · ${latest.note}` : ""}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-ink/15 py-16 text-center">
              <p className="text-sm text-ink/40">ยังไม่มีพัสดุที่กำลังจัดส่ง</p>
              <Link href="/shop" className="btn-primary mt-4 inline-flex text-xs">
                ไปช้อปปิ้ง
              </Link>
            </div>
          )}
        </AccountLayout>
  );
}
