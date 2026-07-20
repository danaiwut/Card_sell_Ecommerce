"use client";

import { useMemo, useState } from "react";
import { CARRIERS, SHIPMENT_STATUS, type ShipmentStatus } from "@cardverse/shared";

export interface ShipmentUpdatePayload {
  carrier: (typeof CARRIERS)[number];
  trackingNumber: string;
  status: (typeof SHIPMENT_STATUS)[number];
  note?: string;
}

const SHIPPED_OR_LATER: ShipmentStatus[] = [
  "SHIPPED",
  "LABEL_CREATED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function ShipmentUpdateForm({
  onSubmit,
  pending,
  initialCarrier = "THAILAND_POST",
  initialTrackingNumber = "",
  initialStatus = "SHIPPED",
  currentStatus,
  submitLabel = "อัปเดตการจัดส่ง",
}: {
  onSubmit: (payload: ShipmentUpdatePayload) => void;
  pending?: boolean;
  initialCarrier?: (typeof CARRIERS)[number] | null;
  initialTrackingNumber?: string | null;
  initialStatus?: (typeof SHIPMENT_STATUS)[number] | null;
  currentStatus?: (typeof SHIPMENT_STATUS)[number] | null;
  submitLabel?: string;
}) {
  const [carrier, setCarrier] = useState<(typeof CARRIERS)[number]>(
    initialCarrier ?? "THAILAND_POST",
  );
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [status, setStatus] = useState<(typeof SHIPMENT_STATUS)[number]>(
    initialStatus ?? "SHIPPED",
  );
  const [note, setNote] = useState("");

  const statusOptions = useMemo(() => {
    const blockedAfterShip =
      currentStatus && SHIPPED_OR_LATER.includes(currentStatus as ShipmentStatus);
    return SHIPMENT_STATUS.filter((value) => {
      if (value === "PENDING") return false;
      if (blockedAfterShip && value === "FAILED") return false;
      return true;
    });
  }, [currentStatus]);

  return (
    <div className="grid gap-3 rounded-lg border border-ink/10 bg-white p-3 sm:grid-cols-2">
      <label className="text-xs font-semibold tracking-wider text-ink/50">
        Carrier
        <select
          className="input mt-1"
          value={carrier}
          onChange={(event) => setCarrier(event.target.value as (typeof CARRIERS)[number])}
        >
          {CARRIERS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold tracking-wider text-ink/50">
        Tracking Number
        <input
          className="input mt-1"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          placeholder="เลขพัสดุ"
        />
      </label>
      <label className="text-xs font-semibold tracking-wider text-ink/50">
        Status
        <select
          className="input mt-1"
          value={status}
          onChange={(event) => setStatus(event.target.value as (typeof SHIPMENT_STATUS)[number])}
        >
          {statusOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold tracking-wider text-ink/50">
        Note
        <input
          className="input mt-1"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="เช่น ถึงศูนย์คัดแยกแล้ว"
        />
      </label>
      <button
        type="button"
        className="btn-primary sm:col-span-2"
        disabled={pending || trackingNumber.trim().length < 3}
        onClick={() =>
          onSubmit({
            carrier,
            trackingNumber: trackingNumber.trim(),
            status,
            note: note.trim() || undefined,
          })
        }
      >
        {pending ? "กำลังบันทึก..." : submitLabel}
      </button>
    </div>
  );
}
