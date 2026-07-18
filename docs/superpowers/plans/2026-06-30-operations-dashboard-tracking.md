# Operations Dashboard and Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete operational admin dashboard, seller shipment workflow, buyer tracking pages, and remove the user-facing My Cards collection while preserving wishlist.

**Architecture:** Keep the existing NestJS + Next.js monorepo structure. Add small API serializers and admin/shipping endpoints, then build focused web components for catalog picking, product forms, shipment forms, and tracking timelines. Avoid schema changes in this iteration because `Product`, `CatalogItem`, `Shipment`, and `ShipmentEvent` already contain the fields needed.

**Tech Stack:** Next.js 15, React 19, TanStack Query, NestJS, Prisma, PostgreSQL, TypeScript, Tailwind CSS.

## Global Constraints

- Keep existing CardVerse visual style, colors, and component primitives.
- Remove user-facing My Cards/collection UI, but preserve wishlist.
- Admin product creation must support full product fields and inline catalog item creation.
- Shipment tracking is manual: admin/seller updates carrier, tracking number, status, and note.
- Buyer tracking must cover both first-party shop orders and marketplace purchases.
- Seller tracking must cover marketplace sales.
- Use TDD for behavioral changes; this repo currently has no test runner, so the first task adds a minimal test harness.
- Do not commit automatically during execution unless the user explicitly asks.

---

## File Structure

- Create `apps/api/src/shipping/shipping.types.ts`: shared shipment status transition helpers and DTO shapes.
- Modify `apps/api/src/shipping/shipping.service.ts`: allow repeated manual event updates and status transitions.
- Modify `apps/api/src/shipping/shipping.controller.ts`: accept status and note for shop/marketplace shipping.
- Modify `apps/api/src/admin/admin.service.ts`: add full admin product/catalog/order/shipping payloads.
- Modify `apps/api/src/admin/admin.controller.ts`: add catalog options, marketplace orders, and shipping queue endpoints.
- Modify `apps/api/src/marketplace/marketplace-orders.service.ts`: add purchase/sale detail methods.
- Modify `apps/api/src/marketplace/marketplace.controller.ts`: add purchase/sale detail routes.
- Modify `apps/api/src/orders/orders.service.ts`: serialize `GET /orders/:id` consistently.
- Create `apps/web/src/components/tracking-timeline.tsx`: visual timeline for shipment events.
- Create `apps/web/src/components/shipment-status-badge.tsx`: small status badge.
- Create `apps/web/src/components/shipment-update-form.tsx`: reusable manual shipment form.
- Create `apps/web/src/components/catalog-item-picker.tsx`: search/select/create inline catalog item component.
- Create `apps/web/src/components/admin-product-form.tsx`: full product create/edit form.
- Modify `apps/web/src/app/admin/page.tsx`: add operational tabs and wire new components.
- Modify `apps/web/src/app/account/sell/page.tsx`: make seller sales/shipping section complete.
- Modify `apps/web/src/app/account/orders/page.tsx`: link orders to tracking detail.
- Create `apps/web/src/app/account/orders/[id]/page.tsx`: shop order tracking detail.
- Modify `apps/web/src/app/account/purchases/page.tsx`: link marketplace purchases to tracking detail.
- Create `apps/web/src/app/account/purchases/[id]/page.tsx`: marketplace tracking detail.
- Modify `apps/web/src/components/header.tsx`: remove Collection nav and retarget wishlist heart.
- Modify `apps/web/src/components/account-sidebar.tsx`: remove My Cards collection link; keep wishlist/account links.
- Modify or replace `apps/web/src/app/collection/page.tsx`: stop exposing My Cards; redirect or show wishlist-only transitional screen.

## Task 1: Test Harness and Shipment Transition Helper

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/shipping/shipping.types.ts`
- Test: `apps/api/src/shipping/shipping.types.test.ts`

**Interfaces:**
- Produces: `normalizeShipmentUpdate(input): { carrier?: Carrier; trackingNumber?: string; status: ShipmentStatus; note?: string }`
- Produces: `orderStatusForShipment(status): "SHIPPED" | "DELIVERED" | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeShipmentUpdate, orderStatusForShipment } from "./shipping.types";

describe("shipment update helpers", () => {
  it("defaults first shipment updates to IN_TRANSIT when no status is provided", () => {
    expect(
      normalizeShipmentUpdate({
        carrier: "FLASH",
        trackingNumber: "TH123",
      }),
    ).toEqual({
      carrier: "FLASH",
      trackingNumber: "TH123",
      status: "IN_TRANSIT",
      note: undefined,
    });
  });

  it("maps delivered shipment status to delivered order status", () => {
    expect(orderStatusForShipment("DELIVERED")).toBe("DELIVERED");
    expect(orderStatusForShipment("IN_TRANSIT")).toBe("SHIPPED");
    expect(orderStatusForShipment("PENDING")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cardverse/api test -- shipping.types.test.ts`

Expected: FAIL because `vitest` script/helper file does not exist.

- [ ] **Step 3: Add minimal test runner and helper**

Add to `apps/api/package.json`:

```json
"test": "vitest run"
```

Add dev dependency with pnpm: `pnpm add -D vitest --filter @cardverse/api`

Create `apps/api/src/shipping/shipping.types.ts`:

```ts
import type { Carrier, ShipmentStatus } from "@cardverse/shared";

export interface ManualShipmentUpdate {
  carrier?: Carrier;
  trackingNumber?: string;
  status?: ShipmentStatus;
  note?: string;
}

export function normalizeShipmentUpdate(input: ManualShipmentUpdate) {
  return {
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    status: input.status ?? "IN_TRANSIT",
    note: input.note,
  };
}

export function orderStatusForShipment(status: ShipmentStatus) {
  if (status === "DELIVERED") return "DELIVERED";
  if (["LABEL_CREATED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) {
    return "SHIPPED";
  }
  return null;
}
```

- [ ] **Step 4: Verify green**

Run: `pnpm --filter @cardverse/api test -- shipping.types.test.ts`

Expected: PASS.

## Task 2: Shipping API Manual Events

**Files:**
- Modify: `packages/shared/src/schemas.ts`
- Modify: `apps/api/src/shipping/shipping.service.ts`
- Modify: `apps/api/src/shipping/shipping.controller.ts`
- Test: `apps/api/src/shipping/shipping.types.test.ts`

**Interfaces:**
- Consumes: `normalizeShipmentUpdate`, `orderStatusForShipment`
- Produces: updated `updateShipmentSchema` accepting optional `status` and `note`

- [ ] **Step 1: Write failing schema test**

Extend `shipping.types.test.ts` with:

```ts
import { updateShipmentSchema } from "@cardverse/shared";

it("accepts manual shipment status and note", () => {
  expect(
    updateShipmentSchema.parse({
      carrier: "KERRY",
      trackingNumber: "KERRY-123",
      status: "OUT_FOR_DELIVERY",
      note: "ถึงศูนย์ปลายทางแล้ว",
    }),
  ).toMatchObject({
    carrier: "KERRY",
    trackingNumber: "KERRY-123",
    status: "OUT_FOR_DELIVERY",
    note: "ถึงศูนย์ปลายทางแล้ว",
  });
});
```

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @cardverse/api test -- shipping.types.test.ts`

Expected: FAIL because schema does not accept `status` yet.

- [ ] **Step 3: Implement schema/service changes**

Update `packages/shared/src/schemas.ts` `updateShipmentSchema` to include:

```ts
status: z.enum(SHIPMENT_STATUSES).optional(),
note: z.string().trim().max(300).optional(),
```

Update shipping service:

- Normalize input.
- Upsert/update shipment.
- Append an event for every manual update.
- For marketplace:
  - If order is `PAID_HELD`, move to `SHIPPED` and schedule escrow release.
  - If update status maps to `DELIVERED`, set marketplace order to `DELIVERED`.
- For shop:
  - Set order status to `SHIPPED` or `DELIVERED` based on helper.

- [ ] **Step 4: Verify green**

Run:

```bash
pnpm --filter @cardverse/api test -- shipping.types.test.ts
pnpm typecheck
```

Expected: PASS and typecheck succeeds.

## Task 3: Admin API Operations Data

**Files:**
- Modify: `apps/api/src/admin/admin.service.ts`
- Modify: `apps/api/src/admin/admin.controller.ts`

**Interfaces:**
- Produces: `GET /admin/catalog-options`
- Produces: `GET /admin/marketplace-orders`
- Produces: `GET /admin/shipping-queue`
- Expands: `GET /admin/products` includes all product fields needed by admin UI

- [ ] **Step 1: Add failing tests or type assertions**

Add a focused test for pure serializers if extracting them, or use TypeScript compile as the acceptance check if serializers stay inside service.

- [ ] **Step 2: Implement endpoints**

`/admin/catalog-options` returns:

```ts
{
  categories: { id: string; slug: string; name: string; nameTh: string }[];
  subcategories: { id: string; categoryId: string; name: string }[];
  brands: { id: string; categoryId: string | null; name: string }[];
  sets: { id: string; name: string; releaseDate: string | null }[];
}
```

`/admin/marketplace-orders` returns marketplace orders with buyer, seller, listing, shipment, amount, status, createdAt.

`/admin/shipping-queue` returns union rows:

```ts
{
  id: string;
  kind: "shop" | "marketplace";
  label: string;
  customer: string;
  status: string;
  shipmentStatus: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
}
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @cardverse/api typecheck`

Expected: PASS.

## Task 4: Reusable Web Tracking and Form Components

**Files:**
- Create: `apps/web/src/components/shipment-status-badge.tsx`
- Create: `apps/web/src/components/tracking-timeline.tsx`
- Create: `apps/web/src/components/shipment-update-form.tsx`

**Interfaces:**
- `ShipmentStatusBadge({ status }: { status: string | null | undefined })`
- `TrackingTimeline({ events, currentStatus }: { events: ShipmentEventView[]; currentStatus?: string | null })`
- `ShipmentUpdateForm({ onSubmit, pending, initialCarrier, initialTrackingNumber })`

- [ ] **Step 1: Write component with explicit props**

Create components using existing `.card`, `.input`, `.btn-primary`, `.btn-outline`, `text-ink`, `text-gold`.

- [ ] **Step 2: Verify**

Run: `pnpm --filter @cardverse/web typecheck`

Expected: PASS.

## Task 5: Catalog Picker and Admin Product Form

**Files:**
- Create: `apps/web/src/components/catalog-item-picker.tsx`
- Create: `apps/web/src/components/admin-product-form.tsx`
- Modify: `apps/web/src/app/admin/page.tsx`

**Interfaces:**
- `CatalogItemPicker` supports search existing and inline create.
- `AdminProductForm` emits payload accepted by `POST /admin/products`.

- [ ] **Step 1: Implement picker**

Picker behavior:

- Search `/catalog-items?q=...`
- Select existing catalog item.
- Inline create catalog item via `/admin/catalog-items` using `/admin/catalog-options`.

- [ ] **Step 2: Implement product form**

Fields:

- `name`, `subtitle`, `description`, `type`, `price`, `stock`, `rarity`
- `imageUrl`, image upload via existing Supabase Storage helper
- `isPreOrder`, `isFeatured`, `isTrending`, `isNewArrival`
- selected `catalogItemId`

- [ ] **Step 3: Verify**

Run: `pnpm --filter @cardverse/web typecheck`

Expected: PASS.

## Task 6: Admin Dashboard Tabs

**Files:**
- Modify: `apps/web/src/app/admin/page.tsx`

**Interfaces:**
- Uses new admin endpoints and reusable shipment form.

- [ ] **Step 1: Expand tab model**

Tabs:

- Reports
- Products
- Catalog
- Shop Orders
- Marketplace Orders
- Shipping
- Disputes
- Users

- [ ] **Step 2: Implement operational sections**

Each tab uses existing cards/tables and avoids changing theme.

- Products tab uses `AdminProductForm`.
- Shop Orders tab shows items and shipment form.
- Marketplace Orders tab shows buyer/seller/listing/escrow/shipment.
- Shipping tab shows combined queue and action form.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @cardverse/web typecheck`

Expected: PASS.

## Task 7: Buyer Tracking Detail Pages

**Files:**
- Modify: `apps/api/src/orders/orders.service.ts`
- Modify: `apps/api/src/marketplace/marketplace-orders.service.ts`
- Modify: `apps/api/src/marketplace/marketplace.controller.ts`
- Create: `apps/web/src/app/account/orders/[id]/page.tsx`
- Modify: `apps/web/src/app/account/orders/page.tsx`
- Create: `apps/web/src/app/account/purchases/[id]/page.tsx`
- Modify: `apps/web/src/app/account/purchases/page.tsx`

**Interfaces:**
- `GET /orders/:id`
- `GET /marketplace/purchases/:id`

- [ ] **Step 1: Add API detail methods**

Serialize shop and marketplace orders with:

- order identity
- amount/total
- item/listing info
- current status
- shipment carrier/tracking/status/events

- [ ] **Step 2: Add detail pages**

Use `TrackingTimeline`, `ShipmentStatusBadge`, and existing account sidebar.

- [ ] **Step 3: Verify**

Run:

```bash
pnpm --filter @cardverse/api typecheck
pnpm --filter @cardverse/web typecheck
```

Expected: PASS.

## Task 8: Seller Sales and Shipping

**Files:**
- Modify: `apps/web/src/app/account/sell/page.tsx`

**Interfaces:**
- Uses `GET /marketplace/sales`
- Uses `POST /shipping/marketplace/:orderId`

- [ ] **Step 1: Separate listing creation from sales/shipping**

Keep listing creation at the top, then add a clearly titled `Sales & Shipping` section.

- [ ] **Step 2: Add manual tracking controls**

For every sale:

- show buyer/seller amount/status
- show current carrier/tracking/timeline
- allow carrier, tracking number, status, note updates

- [ ] **Step 3: Verify**

Run: `pnpm --filter @cardverse/web typecheck`

Expected: PASS.

## Task 9: Remove My Cards Collection UI, Preserve Wishlist

**Files:**
- Modify: `apps/web/src/components/header.tsx`
- Modify: `apps/web/src/components/account-sidebar.tsx`
- Modify: `apps/web/src/app/collection/page.tsx`
- Modify: `apps/web/src/lib/i18n.tsx`

**Interfaces:**
- Header no longer shows `COLLECTION`.
- Account sidebar no longer shows `MY CARDS`.
- Wishlist remains reachable.

- [ ] **Step 1: Remove collection links**

Remove `nav.collection` from top nav. Replace account sidebar `MY CARDS` with `WISHLIST` if needed.

- [ ] **Step 2: Keep `/collection` as wishlist-only transitional page**

Make `/collection` redirect-like UI or render only wishlist without overview/cards tabs.

- [ ] **Step 3: Verify**

Run: `pnpm --filter @cardverse/web typecheck`

Expected: PASS.

## Task 10: Final Verification

**Files:**
- No new files unless fixing issues.

- [ ] **Step 1: Run full verification**

```bash
pnpm typecheck
pnpm build
```

Expected: all packages pass.

- [ ] **Step 2: Manual smoke test with dev server**

With `pnpm dev` running:

- Open `/admin`, create a product with full details and catalog item.
- Open `/account/sell`, confirm sales/shipping controls render.
- Buy shop item and confirm `/account/orders/:id` tracking page renders.
- Buy marketplace item and confirm `/account/purchases/:id` tracking page renders.
- Confirm top nav has no Collection link.
- Confirm wishlist remains reachable.

## Self-Review

- Spec coverage: all requested areas are mapped to tasks.
- Placeholder scan: no undefined implementation requirements remain.
- Type consistency: task interfaces use existing route names and model concepts.
- Scope check: no external carrier API, no schema migration, no unrelated visual redesign.
