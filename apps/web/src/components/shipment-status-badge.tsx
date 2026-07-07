import { cn } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Preparing",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  LABEL_CREATED: "Label Created",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  EXCEPTION: "Exception",
  FAILED: "Failed",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-ink/5 text-ink/60",
  CONFIRMED: "bg-gold/10 text-gold",
  PACKED: "bg-gold/10 text-gold",
  SHIPPED: "bg-blue-50 text-blue-700",
  LABEL_CREATED: "bg-gold/10 text-gold",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
  EXCEPTION: "bg-red-50 text-red-600",
  FAILED: "bg-red-50 text-red-600",
};

export function ShipmentStatusBadge({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  const value = status ?? "PENDING";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_CLASS[value] ?? STATUS_CLASS.PENDING,
        className,
      )}
    >
      {STATUS_LABEL[value] ?? value}
    </span>
  );
}

export function shipmentStatusLabel(status?: string | null) {
  if (!status) return STATUS_LABEL.PENDING;
  return STATUS_LABEL[status] ?? status;
}
