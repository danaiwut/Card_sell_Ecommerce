"use client";

import { useMemo } from "react";
import { CheckCircle2, Circle, PackageCheck, Truck } from "lucide-react";
import { formatDate } from "@/lib/format";
import { ShipmentStatusBadge, shipmentStatusLabel } from "./shipment-status-badge";

export interface ShipmentEventView {
  status: string;
  note?: string | null;
  at: string;
}

const DEFAULT_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function stepTimestamp(
  stepIndex: number,
  steps: string[],
  eventsByStatus: Map<string, ShipmentEventView>,
  currentIndex: number,
): string | null {
  const direct = eventsByStatus.get(steps[stepIndex]);
  if (direct) return formatDate(direct.at);

  if (stepIndex <= currentIndex) {
    for (let i = stepIndex + 1; i < steps.length; i++) {
      const later = eventsByStatus.get(steps[i]);
      if (later) return formatDate(later.at);
    }
    const current = eventsByStatus.get(steps[currentIndex]);
    if (current) return formatDate(current.at);
  }
  return null;
}

export function TrackingTimeline({
  events,
  currentStatus,
}: {
  events: ShipmentEventView[];
  currentStatus?: string | null;
}) {
  const currentIndex = Math.max(DEFAULT_STEPS.indexOf(currentStatus ?? "PENDING"), 0);
  const eventsByStatus = useMemo(
    () => new Map(events.map((event) => [event.status, event])),
    [events],
  );

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Shipment Progress</p>
          <p className="mt-1 text-xs text-ink/50">ติดตามสถานะล่าสุดจากข้อมูลที่อัปเดตในระบบ</p>
        </div>
        <ShipmentStatusBadge status={currentStatus} />
      </div>

      <ol className="mt-5 space-y-5">
        {DEFAULT_STEPS.map((step, index) => {
          const event = eventsByStatus.get(step);
          const complete = index <= currentIndex;
          const active = step === currentStatus;
          const timestamp = stepTimestamp(index, DEFAULT_STEPS, eventsByStatus, currentIndex);
          return (
            <li key={step} className="relative flex gap-3">
              {index < DEFAULT_STEPS.length - 1 && (
                <span className="absolute left-[11px] top-7 h-[calc(100%+0.25rem)] w-px bg-ink/10" />
              )}
              <span className="relative z-10 mt-0.5">
                {step === "DELIVERED" && complete ? (
                  <PackageCheck size={24} className="text-emerald-600" />
                ) : step === "SHIPPED" && complete ? (
                  <Truck size={24} className="text-blue-600" />
                ) : complete ? (
                  <CheckCircle2 size={24} className="text-gold" />
                ) : (
                  <Circle size={24} className="text-ink/20" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={active ? "font-semibold text-ink" : complete ? "font-medium text-ink" : "text-ink/40"}>
                  {shipmentStatusLabel(step)}
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {timestamp ?? (complete ? "—" : "")}
                </p>
                {event?.note && (
                  <p className="mt-2 rounded-md bg-ink/[0.03] px-3 py-2 text-sm text-ink/70">
                    {event.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
