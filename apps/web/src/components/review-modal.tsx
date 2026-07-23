"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ReviewModalProps {
  sellerName: string;
  productName: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  pending?: boolean;
  /** Shop product review vs marketplace seller review */
  variant?: "seller" | "product";
}

export function ReviewModal({
  sellerName,
  productName,
  open,
  onClose,
  onSubmit,
  pending,
  variant = "seller",
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <h2 className="font-display text-xl font-semibold">ให้คะแนนสินค้า</h2>
        <p className="mt-2 text-sm text-ink/60">
          {variant === "product" ? (
            <>
              คุณได้รับ <span className="font-medium text-ink">{productName}</span> แล้ว
              — ช่วยให้คะแนนสินค้า (เฉพาะผู้ซื้อที่ได้รับของแล้วเท่านั้น)
            </>
          ) : (
            <>
              คุณยืนยันรับ <span className="font-medium text-ink">{productName}</span> แล้ว
              — ช่วยให้คะแนนผู้ขาย <span className="font-medium text-ink">{sellerName}</span>
            </>
          )}
        </p>

        <div className="mt-5 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="p-1 text-gold transition hover:scale-110"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
            >
              <Star
                size={28}
                className={
                  n <= (hover || rating) ? "fill-gold text-gold" : "text-ink/20"
                }
              />
            </button>
          ))}
        </div>

        <textarea
          className="input mt-4 min-h-[80px] resize-none"
          placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="mt-5 flex gap-3">
          <button type="button" className="btn-outline flex-1" onClick={onClose}>
            ข้าม
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={rating < 1 || pending}
            onClick={() => onSubmit(rating, comment)}
          >
            {pending ? "กำลังบันทึก…" : "ยืนยันคะแนน"}
          </button>
        </div>
      </div>
    </div>
  );
}
