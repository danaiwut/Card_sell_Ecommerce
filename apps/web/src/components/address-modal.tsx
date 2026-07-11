"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X } from "lucide-react";

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

interface Props {
  open: boolean;
  onClose: () => void;
  initial: Address | null;
  onSaved: () => void;
}

const BLANK = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  district: "",
  province: "",
  postalCode: "",
  isDefault: false,
};

export function AddressModal({ open, onClose, initial, onSaved }: Props) {
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setForm(
        initial
          ? {
              fullName: initial.fullName,
              phone: initial.phone,
              line1: initial.line1,
              line2: initial.line2 ?? "",
              district: initial.district,
              province: initial.province,
              postalCode: initial.postalCode,
              isDefault: initial.isDefault,
            }
          : BLANK,
      );
    }
  }, [open, initial]);

  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, line2: form.line2 || undefined };
      if (initial) return api.patch(`/users/me/addresses/${initial.id}`, body);
      return api.post("/users/me/addresses", body);
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err: any) => setError(err?.message ?? "เกิดข้อผิดพลาด"),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-display text-lg font-semibold">
            {initial ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-ink/5 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">ชื่อ-นามสกุล *</label>
              <input className="input mt-1" value={form.fullName} onChange={set("fullName")} placeholder="สมชาย ใจดี" />
            </div>
            <div>
              <label className="label-xs">เบอร์โทรศัพท์ *</label>
              <input className="input mt-1" value={form.phone} onChange={set("phone")} placeholder="08x-xxx-xxxx" />
            </div>
          </div>

          <div>
            <label className="label-xs">ที่อยู่ (บ้านเลขที่ ถนน ซอย) *</label>
            <input className="input mt-1" value={form.line1} onChange={set("line1")} placeholder="123 ถ.สุขุมวิท" />
          </div>

          <div>
            <label className="label-xs">อาคาร/ห้อง/รายละเอียดเพิ่มเติม</label>
            <input className="input mt-1" value={form.line2} onChange={set("line2")} placeholder="ชั้น 5 ห้อง 501 (ถ้ามี)" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-xs">แขวง/ตำบล *</label>
              <input className="input mt-1" value={form.district} onChange={set("district")} placeholder="คลองเตย" />
            </div>
            <div>
              <label className="label-xs">จังหวัด *</label>
              <input className="input mt-1" value={form.province} onChange={set("province")} placeholder="กรุงเทพฯ" />
            </div>
            <div>
              <label className="label-xs">รหัสไปรษณีย์ *</label>
              <input className="input mt-1" value={form.postalCode} onChange={set("postalCode")} placeholder="10110" maxLength={5} />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink/10 px-4 py-3 hover:bg-ink/3 transition">
            <input
              type="checkbox"
              className="h-4 w-4 accent-gold"
              checked={form.isDefault}
              onChange={set("isDefault")}
            />
            <span className="text-sm font-medium">ตั้งเป็นที่อยู่เริ่มต้น</span>
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-ink/10 px-6 py-4">
          <button className="btn-outline" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className="btn-primary min-w-[120px]"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "กำลังบันทึก..." : initial ? "บันทึกการแก้ไข" : "เพิ่มที่อยู่"}
          </button>
        </div>
      </div>
    </div>
  );
}
