"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, CreditCard, Package } from "lucide-react";
import type { ProductDto } from "@cardverse/shared";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { formatBaht } from "@/lib/format";
import { digitsOnly, isValidPhone, isValidPostalCode } from "@/lib/numeric-input";
import { DevLogin } from "@/components/dev-login";

interface CartPayload {
  items: { id: string; quantity: number; product: ProductDto; lineTotal: number }[];
  subtotal: number;
  shipping: number;
  total: number;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const STEPS = [
  { key: "shipping", label: "ที่อยู่จัดส่ง", icon: MapPin },
  { key: "payment", label: "ชำระเงิน", icon: CreditCard },
  { key: "done", label: "เสร็จสิ้น", icon: Check },
] as const;

type Step = (typeof STEPS)[number]["key"];

const SHIPPING_OPTIONS = [
  { id: "standard", label: "จัดส่งมาตรฐาน", days: "3–5 วัน", price: 0 },
  { id: "express", label: "จัดส่งด่วน", days: "1–2 วัน", price: 80 },
] as const;

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}

function CheckoutPageInner() {
  const { session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("shipping");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    district: "",
    province: "",
    postalCode: "",
    isDefault: true,
  });
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success" | "error">("idle");
  const checkoutLocked = useRef(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [addressError, setAddressError] = useState("");

  const selectedItemIds = useMemo(() => {
    const raw = searchParams.get("items");
    return raw ? raw.split(",").filter(Boolean) : null;
  }, [searchParams]);

  const { data: cart } = useQuery({
    queryKey: ["cart", session?.userId],
    queryFn: () => api.get<CartPayload>("/cart", true),
    enabled: Boolean(session),
  });

  const { data: addresses } = useQuery({
    queryKey: ["addresses", session?.userId],
    queryFn: () => api.get<Address[]>("/users/me/addresses", true),
    enabled: Boolean(session),
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", session?.userId],
    queryFn: () => api.get<{ balance: number }>("/wallet", true),
    enabled: Boolean(session),
  });

  const saveAddress = useMutation({
    mutationFn: () =>
      api.post<Address>("/users/me/addresses", {
        ...newAddress,
        phone: digitsOnly(newAddress.phone),
        postalCode: digitsOnly(newAddress.postalCode),
      }),
    onSuccess: (addr) => {
      setSelectedAddressId(addr.id);
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const checkoutItems = useMemo(() => {
    const items = cart?.items ?? [];
    if (!selectedItemIds?.length) return items;
    return items.filter((line) => selectedItemIds.includes(line.id));
  }, [cart?.items, selectedItemIds]);

  const shippingFee =
    SHIPPING_OPTIONS.find((o) => o.id === shippingMethod)?.price ?? 0;
  const subtotal = checkoutItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const discount = appliedCoupon === "WELCOME10" ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal - discount) + shippingFee;
  const creditBalance = wallet?.balance ?? 0;
  const canPay = creditBalance >= total;

  const activeAddressId =
    selectedAddressId ?? addresses?.find((a) => a.isDefault)?.id ?? addresses?.[0]?.id;

  const checkout = useMutation({
    mutationFn: (addressId: string) =>
      api.post<{ url: string | null; orderNumber: string; orderId: string }>(
        "/orders/checkout",
        {
          addressId,
          couponCode: appliedCoupon ?? undefined,
          shipping: shippingFee,
          payWithCredit: true,
          cartItemIds: checkoutItems.map((i) => i.id),
        },
      ),
    onMutate: () => {
      checkoutLocked.current = true;
      setPaymentState("processing");
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setPaymentState("success");
      setStep("done");
      router.push(`/account/orders/${res.orderId}`);
    },
    onError: () => {
      checkoutLocked.current = false;
      setPaymentState("error");
    },
  });

  function submitCheckout() {
    if (!activeAddressId || checkoutLocked.current || checkout.isPending) return;
    checkout.mutate(activeAddressId);
  }

  if (!session) return <DevLogin />;

  function validateNewAddress(): string | null {
    if (!newAddress.fullName.trim()) return "กรุณากรอกชื่อผู้รับ";
    if (!isValidPhone(newAddress.phone)) return "เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก";
    if (!newAddress.line1.trim()) return "กรุณากรอกที่อยู่";
    if (!newAddress.district.trim()) return "กรุณากรอกเขต/อำเภอ";
    if (!newAddress.province.trim()) return "กรุณากรอกจังหวัด";
    if (!isValidPostalCode(newAddress.postalCode)) return "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก";
    return null;
  }

  function proceedToPayment() {
    if (checkoutItems.length === 0) return;
    if (!activeAddressId) {
      const err = validateNewAddress();
      if (err) {
        setAddressError(err);
        return;
      }
      setAddressError("");
      saveAddress.mutate(undefined, {
        onSuccess: (addr) => {
          setStep("payment");
          setSelectedAddressId(addr.id);
        },
      });
      return;
    }
    setAddressError("");
    setStep("payment");
  }

  function updateAddressField(key: keyof typeof newAddress, value: string) {
    if (key === "phone") {
      setNewAddress((a) => ({ ...a, phone: digitsOnly(value, 10) }));
      return;
    }
    if (key === "postalCode") {
      setNewAddress((a) => ({ ...a, postalCode: digitsOnly(value, 5) }));
      return;
    }
    setNewAddress((a) => ({ ...a, [key]: value }));
  }

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-semibold">ชำระเงิน &amp; จัดส่ง</h1>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.key || (step === "done" && s.key === "done");
          const done =
            (step === "payment" && s.key === "shipping") ||
            (step === "done" && s.key !== "done");
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-ink text-white"
                    : done
                      ? "bg-green-100 text-green-700"
                      : "bg-ink/5 text-ink/40"
                }`}
              >
                {done ? <Check size={12} /> : <Icon size={12} />}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="h-px w-6 bg-ink/10" />}
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {step === "shipping" && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <MapPin size={18} className="text-gold" />
                ที่อยู่จัดส่ง
              </h2>

              {(addresses ?? []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {addresses!.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                        activeAddressId === addr.id
                          ? "border-gold bg-gold/5"
                          : "border-ink/10 hover:border-ink/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={activeAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1"
                      />
                      <div className="text-sm">
                        <p className="font-medium">{addr.fullName}</p>
                        <p className="text-ink/60">
                          {addr.line1} {addr.district} {addr.province} {addr.postalCode}
                        </p>
                        <p className="text-ink/50">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["fullName", "ชื่อผู้รับ"],
                    ["phone", "เบอร์โทร"],
                    ["line1", "ที่อยู่"],
                    ["district", "เขต/อำเภอ"],
                    ["province", "จังหวัด"],
                    ["postalCode", "รหัสไปรษณีย์"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className={key === "line1" ? "sm:col-span-2" : ""}>
                    <label className="text-xs font-medium text-ink/50">{label}</label>
                    <input
                      className="input mt-1"
                      value={newAddress[key]}
                      onChange={(e) => updateAddressField(key, e.target.value)}
                      inputMode={key === "phone" || key === "postalCode" ? "numeric" : undefined}
                      pattern={key === "phone" || key === "postalCode" ? "[0-9]*" : undefined}
                      maxLength={key === "phone" ? 10 : key === "postalCode" ? 5 : undefined}
                    />
                  </div>
                ))}
              </div>

              {addressError && (
                <p className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{addressError}</p>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                  วิธีจัดส่ง
                </p>
                <div className="mt-2 space-y-2">
                  {SHIPPING_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                        shippingMethod === opt.id
                          ? "border-gold bg-gold/5"
                          : "border-ink/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === opt.id}
                          onChange={() => setShippingMethod(opt.id)}
                        />
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-ink/50">{opt.days}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gold">
                        {opt.price === 0 ? "ฟรี" : formatBaht(opt.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                className="btn-primary mt-6 w-full"
                disabled={checkoutItems.length === 0}
                onClick={proceedToPayment}
              >
                ดำเนินการต่อ
              </button>
            </div>
          )}

          {step === "payment" && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <CreditCard size={18} className="text-gold" />
                สถานะการชำระเงิน
              </h2>

              <div className="mt-5 rounded-lg bg-ink/[0.03] p-5">
                {paymentState === "idle" && (
                  <div className="text-center">
                    <Package size={40} className="mx-auto text-ink/20" />
                    <p className="mt-3 font-medium">ชำระด้วยเครดิต</p>
                    <p className="mt-1 text-sm text-ink/50">
                      ยอดรวม {formatBaht(total)} — เครดิตคงเหลือ {formatBaht(creditBalance)}
                    </p>
                    {!canPay && (
                      <p className="mt-2 text-sm text-red-600">
                        เครดิตไม่พอ —{" "}
                        <Link href="/account/wallet" className="underline">
                          เติมเครดิต
                        </Link>
                      </p>
                    )}
                  </div>
                )}
                {paymentState === "processing" && (
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                    <p className="mt-3 font-medium">กำลังประมวลผลการชำระเงิน…</p>
                  </div>
                )}
                {paymentState === "error" && (
                  <p className="text-center text-sm text-red-600">
                    ชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
                  </p>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep("shipping")}>
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  disabled={
                    checkout.isPending ||
                    paymentState === "processing" ||
                    !activeAddressId ||
                    !canPay
                  }
                  onClick={submitCheckout}
                >
                  {checkout.isPending || paymentState === "processing"
                    ? "กำลังชำระ…"
                    : `ชำระเครดิต ${formatBaht(total)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <aside className="card h-fit p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">
            สรุปคำสั่งซื้อ
          </p>
          <div className="mt-3 space-y-2">
            {checkoutItems.map((line) => (
              <div key={line.id} className="flex gap-3 text-sm">
                {line.product.imageUrl && (
                  <Link
                    href={`/shop/${line.product.slug}`}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-ink/5"
                  >
                    <Image src={line.product.imageUrl} alt="" fill className="object-cover" />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shop/${line.product.slug}`}
                    className="text-ink/70 hover:text-gold hover:underline"
                  >
                    {line.product.name} × {line.quantity}
                  </Link>
                </div>
                <span className="font-medium">{formatBaht(line.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-ink/10 pt-3 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>ยอดสินค้า</span>
              <span>{formatBaht(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>ส่วนลด ({appliedCoupon})</span>
                <span>-{formatBaht(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink/60">
              <span>ค่าจัดส่ง</span>
              <span>{shippingFee === 0 ? "ฟรี" : formatBaht(shippingFee)}</span>
            </div>
            <div className="mt-3 border-t border-ink/10 pt-3">
              <label className="text-xs font-medium text-ink/50">คูปอง</label>
              <div className="mt-1 flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  placeholder="เช่น WELCOME10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  className="btn-outline text-xs"
                  onClick={() => setAppliedCoupon(couponCode || null)}
                >
                  ใช้
                </button>
              </div>
            </div>
            <div className="flex justify-between pt-2 font-semibold">
              <span>รวม</span>
              <span className="text-gold">{formatBaht(total)}</span>
            </div>
          </div>
          <Link href="/cart" className="btn-outline mt-4 w-full text-center text-xs">
            กลับไปตะกร้า
          </Link>
        </aside>
      </div>
    </div>
  );
}
