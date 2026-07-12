"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { AddressModal } from "@/components/address-modal";
import { formatBaht } from "@/lib/format";
import {
  X,
  MapPin,
  CreditCard,
  QrCode,
  ChevronRight,
  CheckCircle2,
  Plus,
  Star,
  ShieldCheck,
} from "lucide-react";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface CartSummary {
  subtotal: number;
  shipping: number;
  total: number;
  items: { id: string; quantity: number; product: { name: string; price: number }; lineTotal: number }[];
}

type Step = "address" | "payment";
type PaymentMethod = "card" | "promptpay";

interface Props {
  open: boolean;
  onClose: () => void;
  cart: CartSummary | undefined;
}

export function CheckoutModal({ open, onClose, cart }: Props) {
  const { session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [error, setError] = useState("");

  const { data: addresses = [], refetch: refetchAddresses } = useQuery({
    queryKey: ["addresses", session?.userId],
    queryFn: () => api.get<Address[]>("/users/me/addresses", true),
    enabled: Boolean(session) && open,
  });

  // Auto-select default when addresses load
  const effectiveSelectedId =
    selectedAddressId ??
    addresses.find((a) => a.isDefault)?.id ??
    addresses[0]?.id ??
    null;

  const checkout = useMutation({
    mutationFn: () =>
      api.post<{ url: string | null; orderNumber: string }>("/orders/checkout", {
        addressId: effectiveSelectedId,
        paymentMethod,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      onClose();
      if (res.url) window.location.href = res.url;
      else router.push(`/account/orders?status=success&order=${res.orderNumber}`);
    },
    onError: (err: any) => setError(err?.message ?? "เกิดข้อผิดพลาด"),
  });

  function handleClose() {
    setStep("address");
    setError("");
    onClose();
  }

  if (!open) return null;

  const selectedAddress = addresses.find((a) => a.id === effectiveSelectedId);
  const totalItems = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-ink/10 px-6 py-4">
            <ShieldCheck size={20} className="text-gold" />
            <div className="flex-1">
              <p className="font-display font-semibold">ยืนยันคำสั่งซื้อ</p>
              <p className="text-xs text-ink/50">{totalItems} รายการ · {formatBaht(cart?.total ?? 0)}</p>
            </div>
            <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-ink/5 transition">
              <X size={18} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 border-b border-ink/8 bg-ink/2">
            {(["address", "payment"] as Step[]).map((s, i) => (
              <button
                key={s}
                onClick={() => step === "payment" && s === "address" && setStep("address")}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wide transition ${
                  step === s
                    ? "border-b-2 border-gold text-gold"
                    : i === 0
                    ? "cursor-pointer text-ink/40 hover:text-ink/60"
                    : "cursor-default text-ink/40"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === s ? "bg-gold text-white" : step === "payment" && s === "address" ? "bg-green-500 text-white" : "bg-ink/10 text-ink/40"}`}>
                  {step === "payment" && s === "address" ? <CheckCircle2 size={12} /> : i + 1}
                </span>
                {s === "address" ? "ที่อยู่จัดส่ง" : "วิธีชำระเงิน"}
              </button>
            ))}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            {/* ─── STEP 1: Address ─── */}
            {step === "address" && (
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-ink/70 flex items-center gap-2">
                    <MapPin size={15} /> เลือกที่อยู่จัดส่ง
                  </p>
                  <button
                    className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                    onClick={() => setAddAddressOpen(true)}
                  >
                    <Plus size={13} /> เพิ่มที่อยู่ใหม่
                  </button>
                </div>

                {addresses.length === 0 && (
                  <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ink/15 py-10 text-center">
                    <MapPin size={32} className="text-ink/20" />
                    <p className="text-sm text-ink/50">ยังไม่มีที่อยู่จัดส่ง</p>
                    <button
                      className="btn-primary text-sm"
                      onClick={() => setAddAddressOpen(true)}
                    >
                      <Plus size={14} /> เพิ่มที่อยู่
                    </button>
                  </div>
                )}

                {addresses.map((addr) => {
                  const isSelected = addr.id === effectiveSelectedId;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        isSelected
                          ? "border-gold bg-gold/5"
                          : "border-ink/10 hover:border-ink/25"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-gold" : "border-ink/30"}`}>
                          {isSelected && <div className="h-2 w-2 rounded-full bg-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{addr.fullName}</p>
                            {addr.isDefault && (
                              <span className="flex items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                                <Star size={8} fill="currentColor" /> ค่าเริ่มต้น
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-ink/60">{addr.phone}</p>
                          <p className="mt-1 text-sm text-ink/70 leading-snug">
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{" "}
                            {addr.district}, {addr.province} {addr.postalCode}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─── STEP 2: Payment ─── */}
            {step === "payment" && (
              <div className="p-6 space-y-4">
                {/* Selected address summary */}
                {selectedAddress && (
                  <div className="flex items-start gap-3 rounded-xl bg-ink/3 px-4 py-3">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-ink/40" />
                    <div className="text-sm">
                      <p className="font-semibold">{selectedAddress.fullName} · {selectedAddress.phone}</p>
                      <p className="text-ink/60">
                        {selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""},{" "}
                        {selectedAddress.district}, {selectedAddress.province} {selectedAddress.postalCode}
                      </p>
                    </div>
                    <button
                      className="ml-auto shrink-0 text-xs text-gold font-semibold hover:underline"
                      onClick={() => setStep("address")}
                    >
                      เปลี่ยน
                    </button>
                  </div>
                )}

                <p className="text-sm font-semibold text-ink/70 flex items-center gap-2">
                  <CreditCard size={15} /> เลือกวิธีชำระเงิน
                </p>

                {/* Payment options */}
                {(
                  [
                    {
                      id: "card" as PaymentMethod,
                      icon: <CreditCard size={22} />,
                      label: "บัตรเครดิต / เดบิต",
                      sub: "Visa, Mastercard, JCB",
                      badge: "",
                    },
                    {
                      id: "promptpay" as PaymentMethod,
                      icon: <QrCode size={22} />,
                      label: "QR Code PromptPay",
                      sub: "สแกนจ่ายผ่านแอพธนาคาร",
                      badge: "ยอดนิยม",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
                      paymentMethod === opt.id
                        ? "border-gold bg-gold/5"
                        : "border-ink/10 hover:border-ink/25"
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${paymentMethod === opt.id ? "bg-gold/15 text-gold" : "bg-ink/5 text-ink/50"}`}>
                      {opt.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{opt.label}</p>
                        {opt.badge && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink/50">{opt.sub}</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === opt.id ? "border-gold" : "border-ink/30"}`}>
                      {paymentMethod === opt.id && <div className="h-2 w-2 rounded-full bg-gold" />}
                    </div>
                  </button>
                ))}

                {/* Order summary */}
                <div className="rounded-xl border border-ink/10 bg-ink/2 p-4 space-y-2">
                  <p className="text-xs font-semibold tracking-wider text-ink/50 mb-3">สรุปคำสั่งซื้อ</p>
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-ink/70 truncate pr-4">{item.product.name} × {item.quantity}</span>
                      <span className="shrink-0 font-medium">{formatBaht(item.lineTotal)}</span>
                    </div>
                  ))}
                  <div className="border-t border-ink/10 pt-2 mt-2 flex justify-between text-sm">
                    <span className="text-ink/60">ค่าจัดส่ง</span>
                    <span>{formatBaht(cart?.shipping ?? 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>ยอดรวมทั้งหมด</span>
                    <span className="price text-lg">{formatBaht(cart?.total ?? 0)}</span>
                  </div>
                </div>

                {error && (
                  <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ink/10 bg-white px-6 py-4">
            {step === "address" ? (
              <button
                className="btn-primary w-full"
                disabled={!effectiveSelectedId}
                onClick={() => setStep("payment")}
              >
                ต่อไป — เลือกวิธีชำระเงิน <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn-gold w-full"
                disabled={checkout.isPending}
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending ? (
                  "กำลังดำเนินการ..."
                ) : (
                  <>
                    <ShieldCheck size={16} /> ยืนยันและชำระเงิน {formatBaht(cart?.total ?? 0)}
                  </>
                )}
              </button>
            )}
            <p className="mt-2 text-center text-xs text-ink/40">
              🔒 การชำระเงินปลอดภัยด้วย SSL 256-bit
            </p>
          </div>
        </div>
      </div>

      {/* Nested AddressModal */}
      <AddressModal
        open={addAddressOpen}
        onClose={() => setAddAddressOpen(false)}
        initial={null}
        onSaved={() => {
          refetchAddresses();
        }}
      />
    </>
  );
}
