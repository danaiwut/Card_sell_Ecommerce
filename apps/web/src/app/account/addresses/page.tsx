"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountSidebar } from "@/components/account-sidebar";
import { AddressModal } from "@/components/address-modal";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";

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

export default function AddressesPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses", session?.userId],
    queryFn: () => api.get<Address[]>("/users/me/addresses", true),
    enabled: Boolean(session),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  const del = useMutation({
    mutationFn: (id: string) => api.del(`/users/me/addresses/${id}`),
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => api.patch(`/users/me/addresses/${id}`, { isDefault: true }),
    onSuccess: invalidate,
  });

  if (!session) return <DevLogin />;

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(addr: Address) {
    setEditing(addr);
    setModalOpen(true);
  }

  return (
    <div className="container-page py-8">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-semibold">ที่อยู่จัดส่ง</h1>
            <button className="btn-primary" onClick={openAdd}>
              <Plus size={16} /> เพิ่มที่อยู่ใหม่
            </button>
          </div>

          {isLoading && (
            <div className="mt-8 text-center text-ink/40">กำลังโหลด...</div>
          )}

          {!isLoading && addresses.length === 0 && (
            <div className="card mt-6 flex flex-col items-center gap-4 py-16 text-center">
              <MapPin size={40} className="text-ink/20" />
              <p className="text-ink/50">ยังไม่มีที่อยู่จัดส่ง</p>
              <button className="btn-primary" onClick={openAdd}>
                <Plus size={16} /> เพิ่มที่อยู่แรก
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`card relative p-5 transition ${addr.isDefault ? "ring-2 ring-gold" : ""}`}
              >
                {addr.isDefault && (
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                    <Star size={10} fill="currentColor" /> ค่าเริ่มต้น
                  </span>
                )}
                <p className="font-semibold">{addr.fullName}</p>
                <p className="mt-0.5 text-sm text-ink/60">{addr.phone}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/80">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                  <br />
                  {addr.district}, {addr.province} {addr.postalCode}
                </p>

                <div className="mt-4 flex items-center gap-3 border-t border-ink/8 pt-3">
                  {!addr.isDefault && (
                    <button
                      className="text-xs font-medium text-ink/50 hover:text-gold transition"
                      onClick={() => setDefault.mutate(addr.id)}
                      disabled={setDefault.isPending}
                    >
                      ตั้งเป็นค่าเริ่มต้น
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      className="flex items-center gap-1 rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium hover:bg-ink/5 transition"
                      onClick={() => openEdit(addr)}
                    >
                      <Pencil size={12} /> แก้ไข
                    </button>
                    <button
                      className="flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                      onClick={() => del.mutate(addr.id)}
                      disabled={del.isPending}
                    >
                      <Trash2 size={12} /> ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={invalidate}
      />
    </div>
  );
}
