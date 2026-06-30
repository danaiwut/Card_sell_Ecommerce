# Operations Dashboard and Tracking Design

## Goal

Build an operational admin and account experience that matches the features users can currently use: complete product/catalog management for first-party shop items, seller shipment management for marketplace sales, and buyer tracking for both shop orders and marketplace purchases. Remove the user-facing "My Cards" collection feature while preserving wishlist behavior.

## Current Gaps

- Admin product creation only captures `name`, `price`, `stock`, `type`, and `imageUrl`, while the product model and detail pages support `subtitle`, `description`, `rarity`, `catalogItemId`, `images`, `isPreOrder`, `isFeatured`, `isTrending`, and `isNewArrival`.
- Admin cannot create or select catalog items inline when adding a product, even though marketplace listings depend on canonical catalog items.
- Shop order shipping and marketplace shipping exist in API shape, but the UI only shows compact cards instead of a clear tracking workflow.
- Seller marketplace shipment updates are buried inside `/account/sell` rather than being presented as sales/shipping operations.
- Buyer order pages show shipment data but do not provide a dedicated tracking timeline for current status, carrier, tracking number, and events.
- The user-facing collection feature still appears in the top nav and account sidebar, but the desired direction is to remove "My Cards" while keeping wishlist.

## Decisions

- Collection removal scope: remove "My Cards" / collection UI from navigation and account pages, but keep wishlist.
- Admin product catalog behavior: allow selecting an existing catalog item or creating a catalog item inline from the product form.
- Shipment tracking: manual events for now. Admins and sellers enter carrier, tracking number, status, and note. The UI presents the timeline as authoritative tracking state.
- Styling: keep current CardVerse styling, component primitives, colors, and layout language. Improve information architecture and UI composition only.

## Architecture

Use the existing monorepo structure and keep logic near current feature owners:

- `apps/api/src/admin/*`: expand admin payloads and add operational endpoints for catalog references, marketplace orders, and shipment queues.
- `apps/api/src/shipping/*`: extend shipment updates so callers can set status and append manual events, not only create `IN_TRANSIT`.
- `apps/api/src/orders/*` and `apps/api/src/marketplace/*`: expose detail endpoints for buyer tracking views and serialize shipment events consistently.
- `apps/web/src/app/admin/page.tsx`: split large admin UI into focused local sections or reusable components if needed, but keep route stable at `/admin`.
- `apps/web/src/app/account/orders/*`: improve shop-order list and add a detail/tracking route.
- `apps/web/src/app/account/purchases/*`: improve marketplace purchase list and add a detail/tracking route.
- `apps/web/src/app/account/sell/*`: keep listing creation, but make seller sales/shipping management clear and actionable.
- `apps/web/src/components/*`: add small tracking/admin helper components for timeline, status badges, shipment form, and catalog picker.

No schema migration is required for the first version because `Shipment.status`, `ShipmentEvent`, `Product`, and `CatalogItem` already support the required data. If manual tracking later needs location fields or external carrier sync, add fields in a separate migration.

## Admin Dashboard Design

### Tabs

- `Reports`: revenue, shop orders needing shipment, marketplace sales needing shipment, active listings, users, disputes.
- `Products`: full create/edit product workflow.
- `Catalog`: searchable catalog list and inline catalog creation support.
- `Shop Orders`: first-party orders with item breakdown, customer, payment/order status, and shipment controls.
- `Marketplace Orders`: buyer/seller/listing/escrow/shipment status and dispute entry points.
- `Shipping`: unified fulfillment queue for shop orders and marketplace orders.
- `Users`: existing role management plus seller rating/onboarding indicators.
- `Disputes`: existing dispute handling with clearer links to marketplace order context.

### Product Form Fields

Required:

- `name`
- `price`
- `stock`
- `type`

Optional:

- `subtitle`
- `description`
- `rarity`
- `imageUrl`
- `images`
- `catalogItemId`
- `isPreOrder`
- `isFeatured`
- `isTrending`
- `isNewArrival`

Inline catalog creation fields:

- `categoryId`
- `subcategoryId`
- `brandId`
- `setId`
- `name`
- `rarity`
- `cardNumber`
- `imageUrl`

The form should let an admin:

1. Search existing catalog items.
2. Select one to bind to the product.
3. If none exists, create a new catalog item inline.
4. Continue product creation with the new catalog item selected.

## Collection and Wishlist Design

- Remove `COLLECTION` from the top navigation.
- Remove `/collection` from account sidebar as "MY CARDS".
- Replace the header heart link target with a wishlist-focused route or account section.
- Keep wishlist data and wishlist affordances because users still need favorites.
- The `/collection` route can remain temporarily but should no longer be promoted in navigation. If retained, it should only expose wishlist or redirect to account wishlist in a later cleanup.

## Seller Marketplace Shipping Design

Seller flow:

1. Seller creates listings in `/account/sell`.
2. After a buyer purchases, the sale appears in a "Sales & Shipping" section.
3. Seller sees order status, buyer display name, item, amount, escrow state, shipment status.
4. Seller enters carrier, tracking number, status, and note.
5. Shipment timeline updates immediately.

Status choices:

- `LABEL_CREATED`
- `IN_TRANSIT`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `FAILED`

Marketplace escrow behavior stays the same: first shipment update moves `PAID_HELD` to `SHIPPED`; buyer confirmation releases funds. Marking delivered should set marketplace order status to `DELIVERED`, not automatically complete escrow unless buyer confirms or auto-release runs.

## Buyer Tracking Design

### Shop Orders

Add a shop order detail/tracking route:

- `/account/orders/:id`

Page contents:

- order number, date, total, payment/order status
- item list
- carrier and tracking number
- current shipment status
- timeline of shipment events
- empty state: "กำลังเตรียมจัดส่ง" when no tracking number yet

### Marketplace Purchases

Add a marketplace purchase detail/tracking route:

- `/account/purchases/:id`

Page contents:

- card/listing info, seller, amount, escrow status
- carrier and tracking number
- current shipment status
- timeline of events
- button to confirm receipt when status is `SHIPPED` or `DELIVERED`
- dispute action remains available from the detail page

## API Behavior

### Shipping Updates

Extend `updateShipmentSchema` usage to support:

- `carrier`
- `trackingNumber`
- `status`
- `note`

Rules:

- First marketplace seller shipment update from `PAID_HELD` sets marketplace order to `SHIPPED`.
- Later marketplace shipment status updates append shipment events and update shipment status.
- `DELIVERED` status updates marketplace order to `DELIVERED`.
- Shop order updates append shipment events and update shop order status to match `SHIPPED` or `DELIVERED`.

### Admin APIs

Add or expand endpoints:

- `GET /admin/catalog-options`: categories, subcategories, brands, sets for forms.
- `GET /admin/marketplace-orders`: operational marketplace order list.
- `GET /admin/shipping-queue`: combined shop and marketplace shipments requiring action.
- Existing `POST /admin/products` accepts full product fields.
- Existing `POST /admin/catalog-items` supports inline creation.

### Buyer Detail APIs

Add:

- `GET /orders/:id` returns serialized shop order detail with shipment timeline.
- `GET /marketplace/purchases/:id` returns serialized marketplace purchase detail.
- `GET /marketplace/sales/:id` returns serialized seller sale detail if needed.

## Error Handling

- Product creation validates numeric `price` and `stock` before submit.
- Product creation requires either an existing catalog selection or allows no catalog only when the admin intentionally leaves it blank. Inline catalog creation requires category and name.
- Shipping forms require carrier and tracking number for first shipment update.
- Shipment status updates require status and append a human-readable note when provided.
- Unauthorized users keep current guards: customer cannot access admin; marketplace seller can only update their own sale; buyer can only view their own purchases/orders.

## Testing

Use TDD for implementation tasks:

- API tests for product creation payload mapping, shipment status transitions, and authorization.
- UI/component tests or focused type-level tests where available for form serialization helpers and tracking timeline rendering.
- Run `pnpm typecheck` and targeted package tests after each implementation slice.

## Rollout Order

1. API serialization and admin data endpoints.
2. Shared UI helpers for shipment timeline, status badge, catalog picker, and product form payload.
3. Admin dashboard tabs and forms.
4. Seller sales/shipping UI.
5. Buyer tracking pages.
6. Remove collection navigation and preserve wishlist.

## Self-Review

- No placeholders remain.
- Scope is focused on operational admin/tracking and collection UI removal.
- Manual shipment tracking is explicit; external carrier integrations are out of scope.
- Existing schema supports the first version, avoiding unnecessary migrations.
- Buyer and seller flows are covered for both first-party shop and marketplace.
