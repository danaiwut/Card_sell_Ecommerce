"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { DevLogin } from "@/components/dev-login";
import { AccountLayout } from "@/components/account-layout";
import { AddressModal } from "@/components/address-modal";
import { uploadImage } from "@/lib/upload";

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

export default function SettingsPage() {
  const { session } = useSession();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const { data } = useQuery({
    queryKey: ["me", session?.userId],
    queryFn: () =>
      api.get<{ displayName: string; avatarUrl?: string | null }>("/users/me", true),
    enabled: Boolean(session),
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses", session?.userId],
    queryFn: () => api.get<Address[]>("/users/me/addresses", true),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (data?.displayName) setName(data.displayName);
    if (data?.avatarUrl) setAvatarUrl(data.avatarUrl);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.patch("/users/me", { displayName: name, avatarUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  const invalidateAddresses = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  const del = useMutation({
    mutationFn: (id: string) => api.del(`/users/me/addresses/${id}`),
    onSuccess: invalidateAddresses,
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => api.patch(`/users/me/addresses/${id}`, { isDefault: true }),
    onSuccess: invalidateAddresses,
  });

  if (!session) return <DevLogin />;

  return (
    <AccountLayout>
      <h1 className="font-display text-3xl font-semibold">ตั้งค่า & ที่อยู่</h1>

      <div className="card mt-5 max-w-lg p-5">
        <p className="text-xs font-semibold tracking-wider text-ink/50">โปรไฟล์</p>
        <div className="mt-4 flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/10 text-xl font-semibold">
              {name.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <label className="text-xs font-semibold text-gold hover:underline">
            เปลี่ยนรูปโปรไฟล์
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const url = await uploadImage(file, "avatars");
                  setAvatarUrl(url);
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>
        {uploading && <p className="mt-2 text-xs text-ink/50">กำลังอัปโหลด...</p>}
        <label className="mt-4 block text-xs font-semibold tracking-wider text-ink/50">ชื่อที่แสดง</label>
        <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary mt-4" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isSuccess ? "บันทึกแล้ว ✓" : "บันทึกโปรไฟล์"}
        </button>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wider text-ink/50">ที่อยู่จัดส่ง</h2>
          <button
            className="btn-primary text-sm"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} /> เพิ่มที่อยู่
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="card mt-4 flex flex-col items-center gap-3 py-12 text-center">
            <MapPin size={32} className="text-ink/20" />
            <p className="text-sm text-ink/50">ยังไม่มีที่อยู่จัดส่ง</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`card relative p-5 ${addr.isDefault ? "ring-2 ring-gold" : ""}`}
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
                <div className="mt-4 flex items-center gap-2 border-t border-ink/8 pt-3">
                  {!addr.isDefault && (
                    <button
                      className="text-xs font-medium text-ink/50 hover:text-gold"
                      onClick={() => setDefault.mutate(addr.id)}
                    >
                      ตั้งเป็นค่าเริ่มต้น
                    </button>
                  )}
                  <div className="ml-auto flex gap-2">
                    <button
                      className="flex items-center gap-1 rounded-md border border-ink/15 px-2 py-1 text-xs"
                      onClick={() => {
                        setEditing(addr);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil size={12} /> แก้ไข
                    </button>
                    <button
                      className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-500"
                      onClick={() => del.mutate(addr.id)}
                    >
                      <Trash2 size={12} /> ลบ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={invalidateAddresses}
      />
    </AccountLayout>
  );
}
