"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NEWS_KIND } from "@cardverse/shared";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { formatBaht, formatDate } from "@/lib/format";
import { AdminProductForm } from "@/components/admin-product-form";
import { ShipmentStatusBadge } from "@/components/shipment-status-badge";
import { ShipmentUpdateForm, type ShipmentUpdatePayload } from "@/components/shipment-update-form";
import { TrackingTimeline } from "@/components/tracking-timeline";

type Tab =
  | "reports"
  | "products"
  | "catalog"
  | "news"
  | "shop-orders"
  | "marketplace-orders"
  | "shipping"
  | "disputes"
  | "users";

const VALID_TABS = new Set<Tab>([
  "reports",
  "products",
  "catalog",
  "news",
  "shop-orders",
  "marketplace-orders",
  "shipping",
  "disputes",
  "users",
]);

interface AdminNewsPost {
  id: string;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  imageUrl: string | null;
  published: boolean;
  eventDate: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="container-page py-10">Loading…</div>}>
      <AdminPageInner />
    </Suspense>
  );
}

function AdminPageInner() {
  const { session } = useSession();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(tabParam && VALID_TABS.has(tabParam) ? tabParam : "reports");

  useEffect(() => {
    if (tabParam && VALID_TABS.has(tabParam)) setTab(tabParam);
  }, [tabParam]);

  if (!session || session.role === "customer") {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-ink/60">หน้านี้สำหรับ Manager และ Admin เท่านั้น</p>
        <Link href="/sign-in" className="btn-primary mt-4">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "reports", label: "Reports" },
    { id: "products", label: "Products" },
    { id: "catalog", label: "Catalog" },
    { id: "news", label: "News" },
    { id: "shop-orders", label: "Shop Orders" },
    { id: "marketplace-orders", label: "Marketplace" },
    { id: "shipping", label: "Shipping" },
    { id: "disputes", label: "Disputes" },
    { id: "users", label: "Users" },
  ];
  const isStaff = session.role === "manager" || session.role === "admin";
  const canManageRoles = session.role === "admin";

  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-semibold">
        {session.role === "admin" ? "Admin" : "Manager"} Dashboard
      </h1>

      <div className="mt-4 flex gap-6 border-b border-ink/10 text-sm">
        {tabs.map((t) => (
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
        {tab === "catalog" && <Catalog />}
        {tab === "news" && <NewsAdmin />}
        {tab === "shop-orders" && <ShopOrders />}
        {tab === "marketplace-orders" && <MarketplaceOrders />}
        {tab === "shipping" && <ShippingQueue />}
        {tab === "disputes" && <Disputes canRefund={isStaff} />}
        {tab === "users" && <Users canManageRoles={canManageRoles} />}
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
    { label: "Shop To Ship", value: data?.shopToShip ?? 0 },
    { label: "Market To Ship", value: data?.marketplaceToShip ?? 0 },
    { label: "Disputes", value: data?.disputes ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.get<any[]>("/admin/products", true),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 text-left text-xs font-semibold tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Catalog</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Sold</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ink/45">{p.subtitle ?? "ไม่มี subtitle"}</p>
                </td>
                <td className="px-4 py-3 text-ink/60">{p.catalogItem?.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink/60">{p.type}</td>
                <td className="px-4 py-3 price">{formatBaht(p.price)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3 text-xs text-ink/50">
                  {[p.isPreOrder && "Pre", p.isFeatured && "Featured", p.isTrending && "Trend", p.isNewArrival && "New"]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </td>
                <td className="px-4 py-3">{p.soldCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminProductForm />
    </div>
  );
}

function Catalog() {
  const { data } = useQuery({
    queryKey: ["admin-catalog-options"],
    queryFn: () => api.get<any>("/admin/catalog-options", true),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CatalogCard title="Categories" items={(data?.categories ?? []).map((item: any) => item.name)} />
      <CatalogCard title="Subcategories" items={(data?.subcategories ?? []).map((item: any) => item.name)} />
      <CatalogCard title="Brands" items={(data?.brands ?? []).map((item: any) => item.name)} />
      <CatalogCard title="Sets" items={(data?.sets ?? []).map((item: any) => item.name)} />
    </div>
  );
}

function CatalogCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold tracking-wider text-ink/50">{title}</p>
      <div className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
        {items.map((item) => (
          <p key={item} className="rounded bg-ink/[0.03] px-3 py-2">{item}</p>
        ))}
      </div>
    </div>
  );
}

const EMPTY_NEWS_FORM = {
  kind: "NEWS",
  title: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  eventDate: "",
};

function NewsAdmin() {
  const qc = useQueryClient();
  const [manual, setManual] = useState(EMPTY_NEWS_FORM);
  const { data: drafts } = useQuery({
    queryKey: ["admin-news", "draft"],
    queryFn: () => api.get<AdminNewsPost[]>("/admin/news?status=draft", true),
  });
  const { data: published } = useQuery({
    queryKey: ["admin-news", "published"],
    queryFn: () => api.get<AdminNewsPost[]>("/admin/news?status=published", true),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-news"] });
    qc.invalidateQueries({ queryKey: ["news"] });
    qc.invalidateQueries({ queryKey: ["events-upcoming"] });
  };

  const create = useMutation({
    mutationFn: () =>
      api.post("/news", {
        ...manual,
        excerpt: manual.excerpt || undefined,
        body: manual.body || undefined,
        imageUrl: manual.imageUrl || undefined,
        eventDate: manual.eventDate || undefined,
      }),
    onSuccess: () => {
      setManual(EMPTY_NEWS_FORM);
      invalidate();
    },
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminNewsPost> }) =>
      api.patch(`/admin/news/${id}`, payload, true),
    onSuccess: invalidate,
  });
  const publish = useMutation({
    mutationFn: (id: string) => api.post(`/admin/news/${id}/publish`, undefined, true),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/admin/news/${id}`, true),
    onSuccess: invalidate,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">News Draft Queue</p>
              <p className="mt-1 text-xs text-ink/50">
                ข่าวที่ n8n scrape เข้ามาจะอยู่ตรงนี้จนกว่าแอดมินจะกดอนุมัติ
              </p>
            </div>
            <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              {drafts?.length ?? 0} drafts
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {(drafts ?? []).map((post) => (
              <NewsEditor
                key={post.id}
                post={post}
                pending={update.isPending || publish.isPending || remove.isPending}
                onSave={(payload) => update.mutate({ id: post.id, payload })}
                onPublish={() => publish.mutate(post.id)}
                onDelete={() => remove.mutate(post.id)}
              />
            ))}
            {(drafts?.length ?? 0) === 0 && (
              <p className="rounded-md bg-ink/[0.03] p-4 text-sm text-ink/50">
                ยังไม่มีข่าว draft จาก n8n
              </p>
            )}
          </div>
        </section>

        <section className="card p-5">
          <p className="text-sm font-semibold">Published News</p>
          <div className="mt-4 space-y-3">
            {(published ?? []).slice(0, 12).map((post) => (
              <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 p-3 text-sm">
                <div>
                  <p className="font-medium">{post.title}</p>
                  <p className="text-xs text-ink/50">
                    {post.kind} • {formatDate(post.createdAt)}
                    {post.sourceName ? ` • ${post.sourceName}` : ""}
                  </p>
                </div>
                <button className="btn-outline" disabled={remove.isPending} onClick={() => remove.mutate(post.id)}>
                  Delete
                </button>
              </div>
            ))}
            {(published?.length ?? 0) === 0 && <p className="text-sm text-ink/40">ยังไม่มีข่าวที่เผยแพร่</p>}
          </div>
        </section>
      </div>

      <aside className="card h-fit p-4">
        <p className="text-sm font-semibold">Create News Manually</p>
        <p className="mt-1 text-xs text-ink/50">ใช้สำหรับลงข่าวเองเมื่อไม่ผ่าน n8n</p>
        <div className="mt-4 grid gap-3">
          <select
            className="input"
            value={manual.kind}
            onChange={(event) => setManual({ ...manual, kind: event.target.value })}
          >
            {NEWS_KIND.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Title"
            value={manual.title}
            onChange={(event) => setManual({ ...manual, title: event.target.value })}
          />
          <textarea
            className="input min-h-20"
            placeholder="Excerpt"
            value={manual.excerpt}
            onChange={(event) => setManual({ ...manual, excerpt: event.target.value })}
          />
          <textarea
            className="input min-h-32"
            placeholder="Body"
            value={manual.body}
            onChange={(event) => setManual({ ...manual, body: event.target.value })}
          />
          <input
            className="input"
            placeholder="Image URL"
            value={manual.imageUrl}
            onChange={(event) => setManual({ ...manual, imageUrl: event.target.value })}
          />
          <input
            className="input"
            type="datetime-local"
            value={manual.eventDate}
            onChange={(event) => setManual({ ...manual, eventDate: event.target.value })}
          />
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!manual.title || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Creating..." : "Create published news"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function NewsEditor({
  post,
  pending,
  onSave,
  onPublish,
  onDelete,
}: {
  post: AdminNewsPost;
  pending: boolean;
  onSave: (payload: Partial<AdminNewsPost>) => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState({
    kind: post.kind,
    title: post.title,
    excerpt: post.excerpt ?? "",
    body: post.body ?? "",
    imageUrl: post.imageUrl ?? "",
    eventDate: post.eventDate ? post.eventDate.slice(0, 16) : "",
  });

  return (
    <article className="rounded-lg border border-ink/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gold">{post.kind}</p>
          <h3 className="font-display text-lg font-semibold">{post.title}</h3>
          <p className="mt-1 text-xs text-ink/50">
            {post.sourceName ?? "Unknown source"} • imported {formatDate(post.importedAt ?? post.createdAt)}
          </p>
          {post.sourceUrl && (
            <a className="mt-1 block text-xs text-gold hover:underline" href={post.sourceUrl} target="_blank" rel="noreferrer">
              View source
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" disabled={pending} onClick={onDelete}>
            Delete
          </button>
          <button className="btn-primary" disabled={pending} onClick={onPublish}>
            Approve
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          className="input"
          value={form.kind}
          onChange={(event) => setForm({ ...form, kind: event.target.value })}
        >
          {NEWS_KIND.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
        />
        <input
          className="input md:col-span-2"
          placeholder="Title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <textarea
          className="input min-h-20 md:col-span-2"
          placeholder="Excerpt"
          value={form.excerpt}
          onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
        />
        <textarea
          className="input min-h-32 md:col-span-2"
          placeholder="Body"
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
        />
        <input
          className="input"
          type="datetime-local"
          value={form.eventDate}
          onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
        />
        <button
          type="button"
          className="btn-outline"
          disabled={pending || !form.title}
          onClick={() =>
            onSave({
              ...form,
              excerpt: form.excerpt || null,
              body: form.body || null,
              imageUrl: form.imageUrl || null,
              eventDate: form.eventDate || null,
            })
          }
        >
          Save draft changes
        </button>
      </div>
    </article>
  );
}

function ShopOrders() {
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
            <ShopOrderRow key={o.id} order={o} onChange={() => qc.invalidateQueries({ queryKey: ["admin-orders"] })} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShopOrderRow({ order, onChange }: { order: any; onChange: () => void }) {
  const ship = useMutation({
    mutationFn: (payload: ShipmentUpdatePayload) => api.post(`/shipping/orders/${order.id}`, payload),
    onSuccess: onChange,
  });
  return (
    <tr className="border-b border-ink/5">
      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
      <td className="px-4 py-3">{order.customer}</td>
      <td className="px-4 py-3 price">{formatBaht(order.total)}</td>
      <td className="px-4 py-3 text-xs uppercase">{order.status}</td>
      <td className="px-4 py-3">
        <div className="space-y-2">
          <ShipmentStatusBadge status={order.shipment?.status} />
          {order.shipment?.trackingNumber && (
            <p className="text-xs text-ink/60">{order.shipment.carrier} • {order.shipment.trackingNumber}</p>
          )}
          <ShipmentUpdateForm
            pending={ship.isPending}
            initialCarrier={order.shipment?.carrier}
            initialTrackingNumber={order.shipment?.trackingNumber}
            initialStatus={order.shipment?.status ?? "IN_TRANSIT"}
            onSubmit={(payload) => ship.mutate(payload)}
          />
        </div>
      </td>
    </tr>
  );
}

function MarketplaceOrders() {
  const { data } = useQuery({
    queryKey: ["admin-marketplace-orders"],
    queryFn: () => api.get<any[]>("/admin/marketplace-orders", true),
  });
  return (
    <div className="space-y-4">
      {(data ?? []).map((order) => (
        <div key={order.id} className="card p-5 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{order.listing.catalogItem.name}</p>
              <p className="text-xs text-ink/50">
                buyer {order.buyer.displayName} • seller {order.seller.displayName}
              </p>
            </div>
            <div className="text-right">
              <p className="price">{formatBaht(order.amount)}</p>
              <p className="text-xs uppercase text-ink/50">{order.status}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_320px]">
            <TrackingTimeline events={order.shipment?.events ?? []} currentStatus={order.shipment?.status} />
            <div className="card p-4 shadow-none">
              <p className="text-xs font-semibold tracking-wider text-ink/50">SHIPMENT</p>
              <p className="mt-2 text-sm text-ink/60">
                {order.shipment?.carrier ?? "—"} • {order.shipment?.trackingNumber ?? "รอเลขพัสดุ"}
              </p>
              <ShipmentStatusBadge className="mt-3" status={order.shipment?.status} />
            </div>
          </div>
        </div>
      ))}
      {(data?.length ?? 0) === 0 && <p className="text-sm text-ink/40">ยังไม่มี marketplace orders</p>}
    </div>
  );
}

function ShippingQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-shipping-queue"],
    queryFn: () => api.get<any[]>("/admin/shipping-queue", true),
  });
  const update = useMutation({
    mutationFn: ({ row, payload }: { row: any; payload: ShipmentUpdatePayload }) =>
      api.post(`/admin/shipping/${row.kind}/${row.id}`, payload, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-queue"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-marketplace-orders"] });
    },
  });

  return (
    <div className="space-y-4">
      {(data ?? []).map((row) => (
        <div key={`${row.kind}-${row.id}`} className="card grid gap-4 p-5 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.label}</p>
                <p className="text-xs uppercase tracking-wider text-ink/50">{row.kind} • {row.status}</p>
                <p className="mt-1 text-sm text-ink/60">{row.customer}</p>
              </div>
              <ShipmentStatusBadge status={row.shipmentStatus} />
            </div>
            <p className="mt-3 text-sm text-ink/60">
              {row.carrier ?? "ยังไม่เลือกขนส่ง"} • {row.trackingNumber ?? "ยังไม่มีเลขพัสดุ"}
            </p>
          </div>
          <ShipmentUpdateForm
            pending={update.isPending}
            initialCarrier={row.carrier}
            initialTrackingNumber={row.trackingNumber}
            initialStatus={row.shipmentStatus ?? "IN_TRANSIT"}
            onSubmit={(payload) => update.mutate({ row, payload })}
          />
        </div>
      ))}
      {(data?.length ?? 0) === 0 && <p className="text-sm text-ink/40">ไม่มีรายการที่ต้องจัดส่ง</p>}
    </div>
  );
}

function Disputes({ canRefund }: { canRefund: boolean }) {
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
          {canRefund && (
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

function Users({ canManageRoles }: { canManageRoles: boolean }) {
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
                {canManageRoles ? (
                  <select
                    className="input h-8 w-32"
                    value={u.role}
                    onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value })}
                  >
                    <option value="customer">customer</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  <span className="text-ink/70">{u.role}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
