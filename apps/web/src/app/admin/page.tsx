"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { formatBaht } from "@/lib/format";
import { uploadImageToR2 } from "@/lib/upload";

type Tab = "reports" | "products" | "orders" | "disputes" | "users";

export default function AdminPage() {
  const { session } = useSession();
  const [tab, setTab] = useState<Tab>("reports");

  if (!session || session.role === "customer") {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">หน้านี้สำหรับ Manager และ Admin เท่านั้น</p>
        <Link href="/account" className="btn-primary mt-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: "reports", label: "Reports" },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "disputes", label: "Disputes" },
    { id: "users", label: "Users", adminOnly: true },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-semibold">
        {session.role === "admin" ? "Admin" : "Manager"} Dashboard
      </h1>

      <div className="mt-4 flex gap-6 border-b border-ink/10 text-sm">
        {tabs
          .filter((t) => !t.adminOnly || session.role === "admin")
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-2 font-semibold uppercase tracking-wider ${
                tab === t.id ? "border-b-2 border-gold text-ink" : "text-ink/50"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      <div className="mt-6">
        {tab === "reports" && <Reports />}
        {tab === "products" && <Products />}
        {tab === "orders" && <Orders />}
        {tab === "disputes" && <Disputes isAdmin={session.role === "admin"} />}
        {tab === "users" && session.role === "admin" && <Users />}
      </div>
    </div>
  );
}

function Reports() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api.get<any>("/admin/reports", true),
  });
  const cards = [
    { label: "Paid Orders", value: data?.paidOrders ?? 0 },
    { label: "Shop Revenue", value: formatBaht(data?.shopRevenue ?? 0) },
    { label: "Marketplace Fees", value: formatBaht(data?.marketplaceFeeRevenue ?? 0) },
    { label: "Users", value: data?.users ?? 0 },
    { label: "Active Listings", value: data?.activeListings ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="card p-4">
          <p className="text-xs font-semibold tracking-wider text-ink/50">{c.label}</p>
          <p className="mt-2 font-display text-2xl font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function Products() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.get<any[]>("/admin/products", true),
  });
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "10",
    type: "SINGLE_CARD",
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const create = useMutation({
    mutationFn: () => api.post("/admin/products", { ...form, price: Number(form.price), stock: Number(form.stock) }),
    onSuccess: () => {
      setForm({ name: "", price: "", stock: "10", type: "SINGLE_CARD", imageUrl: "" });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Sold</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-ink/5">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-ink/60">{p.type}</td>
                <td className="px-4 py-3 price">{formatBaht(p.price)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">{p.soldCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card h-fit p-4">
        <p className="text-sm font-semibold">เพิ่มสินค้าใหม่</p>
        <input className="input mt-2" placeholder="ชื่อสินค้า" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input mt-2" placeholder="ราคา" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="input mt-2" placeholder="สต็อก" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input
          className="input mt-2"
          placeholder="Image URL (หรือ upload ด้านล่าง)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
        <label className="mt-2 block text-xs font-semibold tracking-wider text-ink/50">
          Upload image to R2
        </label>
        <input
          className="input mt-1"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            try {
              const imageUrl = await uploadImageToR2(file, "products");
              setForm((current) => ({ ...current, imageUrl }));
            } finally {
              setUploading(false);
            }
          }}
        />
        {uploading && <p className="mt-1 text-xs text-ink/50">กำลังอัปโหลดรูป...</p>}
        {form.imageUrl && (
          <p className="mt-1 truncate text-xs text-green-700">รูปพร้อมใช้: {form.imageUrl}</p>
        )}
        <select className="input mt-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="SINGLE_CARD">Single Card</option>
          <option value="BOOSTER_BOX">Booster Box</option>
          <option value="DECK">Deck</option>
          <option value="ACCESSORY">Accessory</option>
        </select>
        <button className="btn-primary mt-3 w-full" disabled={!form.name || !form.price || create.isPending} onClick={() => create.mutate()}>
          เพิ่มสินค้า
        </button>
      </div>
    </div>
  );
}

function Orders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.get<any[]>("/admin/orders", true),
  });
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Shipping</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((o) => (
            <OrderRow key={o.id} order={o} onChange={() => qc.invalidateQueries({ queryKey: ["admin-orders"] })} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderRow({ order, onChange }: { order: any; onChange: () => void }) {
  const [tracking, setTracking] = useState("");
  const ship = useMutation({
    mutationFn: () =>
      api.post(`/shipping/orders/${order.id}`, { carrier: "THAILAND_POST", trackingNumber: tracking }),
    onSuccess: onChange,
  });
  return (
    <tr className="border-b border-ink/5">
      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
      <td className="px-4 py-3">{order.customer}</td>
      <td className="px-4 py-3 price">{formatBaht(order.total)}</td>
      <td className="px-4 py-3 text-xs uppercase">{order.status}</td>
      <td className="px-4 py-3">
        {order.shipped ? (
          <span className="text-xs text-green-600">จัดส่งแล้ว</span>
        ) : (
          <div className="flex gap-1">
            <input className="input h-8 w-28" placeholder="เลขพัสดุ" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            <button className="btn-primary h-8 px-2 text-xs" disabled={!tracking} onClick={() => ship.mutate()}>
              ส่ง
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function Disputes({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: () => api.get<any[]>("/admin/disputes", true),
  });
  const refund = useMutation({
    mutationFn: (id: string) => api.post(`/admin/orders/${id}/refund`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-disputes"] }),
  });
  return (
    <div className="space-y-3">
      {(data ?? []).map((d) => (
        <div key={d.id} className="card flex items-center justify-between p-4 text-sm">
          <div>
            <p className="font-medium">{d.listing?.catalogItem?.name}</p>
            <p className="text-xs text-ink/50">
              buyer {d.buyer?.displayName} • seller {d.seller?.displayName}
            </p>
          </div>
          {isAdmin && (
            <button className="btn-outline" disabled={refund.isPending} onClick={() => refund.mutate(d.id)}>
              คืนเงินผู้ซื้อ
            </button>
          )}
        </div>
      ))}
      {(data?.length ?? 0) === 0 && <p className="text-sm text-ink/40">ไม่มีข้อพิพาท</p>}
    </div>
  );
}

function Users() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get<any[]>("/admin/users", true),
  });
  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {(data ?? []).map((u) => (
            <tr key={u.id} className="border-b border-ink/5">
              <td className="px-4 py-3 font-medium">{u.displayName}</td>
              <td className="px-4 py-3 text-ink/60">{u.email}</td>
              <td className="px-4 py-3">
                <select
                  className="input h-8 w-32"
                  value={u.role}
                  onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value })}
                >
                  <option value="customer">customer</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
