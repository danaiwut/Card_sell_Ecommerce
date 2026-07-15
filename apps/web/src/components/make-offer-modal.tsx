"use client";

import { useState } from "react";
import { Handshake, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatBaht } from "@/lib/format";

interface MakeOfferModalProps {
  listingId: string;
  listingPrice: number;
  cardName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MakeOfferModal({
  listingId,
  listingPrice,
  cardName,
  open,
  onClose,
  onSuccess,
}: MakeOfferModalProps) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      api.post(`/marketplace/listings/${listingId}/offers`, {
        amount: Number(amount),
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      setSubmitted(true);
      setError(null);
      onSuccess?.();
    },
    onError: (err: Error) => setError(err.message || "ส่งข้อเสนอไม่สำเร็จ"),
  });

  if (!open) return null;

  function handleClose() {
    setAmount("");
    setMessage("");
    setError(null);
    setSubmitted(false);
    onClose();
  }

  const offerAmount = Number(amount);
  const offerValid = offerAmount > 0 && offerAmount < listingPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-labelledby="offer-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id="offer-title" className="text-lg font-semibold">
              Make an Offer
            </p>
            <p className="mt-1 text-sm text-ink/60">{cardName}</p>
            <p className="mt-1 text-xs text-ink/50">
              ราคาปิดการขาย {formatBaht(listingPrice)}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-ink/50 hover:bg-ink/5"
            onClick={handleClose}
            aria-label="ปิด"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-medium">ส่งข้อเสนอแล้ว</p>
            <p className="mt-1">
              ผู้ขายจะได้รับการแจ้งเตือนและสามารถพิจารณาข้อเสนอของคุณได้
            </p>
            <button type="button" className="btn-primary mt-4 w-full" onClick={handleClose}>
              ปิด
            </button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!offerValid || submit.isPending) return;
              submit.mutate();
            }}
          >
            <div>
              <label htmlFor="offer-amount" className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                ราคาที่เสนอ (฿)
              </label>
              <input
                id="offer-amount"
                type="number"
                min={1}
                max={listingPrice - 1}
                step={1}
                className="input mt-1"
                placeholder={`ต่ำกว่า ${formatBaht(listingPrice)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="offer-message" className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                ข้อความถึงผู้ขาย (ไม่บังคับ)
              </label>
              <textarea
                id="offer-message"
                className="input mt-1 min-h-24 resize-none"
                placeholder="เช่น สนใจซื้อทันทีถ้ารับราคานี้"
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" className="btn-outline flex-1" onClick={handleClose}>
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={!offerValid || submit.isPending}
              >
                <Handshake size={16} />
                {submit.isPending ? "กำลังส่ง…" : "ส่งข้อเสนอ"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
