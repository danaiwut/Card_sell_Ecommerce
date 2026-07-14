# CardVerse

**Full-stack collectible-card e-commerce marketplace** — ร้านค้าออฟฟิเชียล + Marketplace แบบ C2C พร้อม Escrow, กราฟราคาตลาด, และระบบจัดส่ง

[![CI](https://github.com/danaiwut/Card_sell_Ecommerce/actions/workflows/ci.yml/badge.svg)](https://github.com/danaiwut/Card_sell_Ecommerce/actions/workflows/ci.yml)

---

## สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [Tech Stack](#tech-stack)
- [Use Case Diagram](#use-case-diagram)
- [Class Diagram](#class-diagram)
- [SLA — Service Level Agreement](#sla--service-level-agreement)
- [UAT — User Acceptance Testing](#uat--user-acceptance-testing)
- [วิธีรันโปรเจ็กต์](#วิธีรันโปรเจ็กต์)
- [โครงสร้าง Monorepo](#โครงสร้าง-monorepo)
- [Deployment](#deployment)

---

## ภาพรวมระบบ

| โมดูล | คำอธิบาย |
| --- | --- |
| **Shop** | ร้านค้าออฟฟิเชียล — ขาย booster box, deck, single card, accessory ครบ 20 หมวดหมู่ |
| **Marketplace** | ลงขาย C2C พร้อม Escrow (Stripe Connect), กราฟราคาจากยอดขายจริง, live feed recent sales |
| **Shipping** | ผู้ขายอัปเดต carrier + tracking; Escrow ปล่อยเงินอัตโนมัติหลังจัดส่งสำเร็จ |
| **Collection** | คอลเลกชันส่วนตัว + wishlist |
| **Credits / Wallet** | เติมเครดิต → ใช้ซื้อแทนเงินสด, ผู้ขายถอนเครดิตผ่านเมเนเจอร์ |
| **News** | ข่าวสาร / event / set release (รองรับ ingest จาก n8n) |
| **Roles** | `customer` · `manager` · `admin` |

---

## Tech Stack

### สรุปตาม Layer

| Layer | เทคโนโลยี | ใช้สำหรับอะไร |
| --- | --- | --- |
| **Frontend** | Next.js 15, React 19, TypeScript | หน้าเว็บ storefront, marketplace, dashboard, admin |
| **Styling** | Tailwind CSS, Lucide Icons, GSAP | UI/UX, animation, responsive design |
| **State / Data** | TanStack Query | cache + fetch ข้อมูลจาก API ฝั่ง client |
| **Charts** | Recharts | กราฟราคาตลาด (market price chart) |
| **Realtime** | Socket.IO Client | live feed "recent sales" บน marketplace |
| **Backend API** | NestJS 11, Express 5 | REST API, business logic, webhook handlers |
| **Realtime Server** | Socket.IO (NestJS Gateway) | broadcast ยอดขายล่าสุดแบบ real-time |
| **Background Jobs** | BullMQ + Worker app | escrow release, price aggregation, notifications |
| **Database** | PostgreSQL 16 | เก็บข้อมูลหลักทั้งหมด (users, orders, listings, trades) |
| **ORM** | Prisma | schema, migrations, type-safe queries |
| **Cache / Queue** | Redis 7 | BullMQ queue backend + caching |
| **Auth** | Clerk | sign-in/sign-up, JWT, role-based access |
| **Payments** | Stripe + Stripe Connect | shop checkout, marketplace escrow, seller payout |
| **Storage** | Cloudflare R2 (S3 API) | อัปโหลดรูปสินค้า (presigned URL) |
| **Shipping** | Flash Express API (optional) | auto-tracking webhook จากขนส่ง |
| **i18n** | Custom i18n (TH/EN) | สลับภาษาไทย–อังกฤษ |
| **Monorepo** | pnpm + Turborepo | จัดการ packages และ build pipeline |
| **Validation** | Zod | validate request/response ร่วมกันใน `packages/shared` |
| **CI** | GitHub Actions | build + typecheck ทุก push |
| **Container** | Docker Compose | PostgreSQL + Redis สำหรับ dev local |
| **Automation** | n8n (optional) | ingest ข่าวจาก external source |

### แผนภาพสถาปัตยกรรม

```mermaid
flowchart TB
    subgraph Client["Browser"]
        WEB["Next.js 15<br/>(apps/web)"]
    end

    subgraph Backend["Backend Services"]
        API["NestJS API<br/>(apps/api)"]
        WORKER["BullMQ Worker<br/>(apps/worker)"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL")]
        REDIS[("Redis")]
    end

    subgraph External["External Services"]
        CLERK["Clerk<br/>Auth"]
        STRIPE["Stripe + Connect<br/>Payments / Escrow"]
        R2["Cloudflare R2<br/>Images"]
        FLASH["Flash Express<br/>Tracking"]
        N8N["n8n<br/>News Ingest"]
    end

    WEB -->|"/backend/* REST"| API
    WEB -->|"Socket.IO"| API
    API --> PG
    API --> REDIS
    WORKER --> PG
    WORKER --> REDIS
    API --> CLERK
    API --> STRIPE
    API --> R2
    API --> FLASH
    N8N -->|internal API| API
    STRIPE -->|webhook| API
    FLASH -->|webhook| API
```

### อธิบายรายเทคโนโลยี — ใช้ที่ส่วนไหน

| เทคโนโลยี | Package / App | หน้าที่เฉพาะ |
| --- | --- | --- |
| **Next.js 15** | `apps/web` | App Router, SSR/CSR, proxy `/backend/*` → NestJS, middleware auth |
| **NestJS** | `apps/api` | modules: cart, orders, marketplace, payments, shipping, admin, news |
| **BullMQ Worker** | `apps/worker` | `escrow-release`, `price-aggregation`, `notification` processors |
| **Prisma** | `packages/db` | schema 40+ models, seed data, Prisma Studio |
| **@cardverse/shared** | `packages/shared` | enums, DTO, Zod schemas, taxonomy 20 categories |
| **Clerk** | web + api | `@clerk/nextjs` ฝั่ง frontend, `@clerk/backend` verify JWT ฝั่ง API |
| **Stripe** | api | Checkout Session (shop), PaymentIntent + Connect Transfer (marketplace escrow) |
| **Socket.IO** | web + api | `realtime` module — push recent sales ไปยัง marketplace page |
| **Cloudflare R2** | api (`storage`) | `POST /storage/presign` → client upload ตรงไป R2 |
| **TanStack Query** | web | `useQuery` / `useMutation` สำหรับ cart, orders, listings |
| **Recharts** | web | กราฟราคา `PricePoint` + `Trade` บนหน้า catalog item |
| **Turborepo** | root | `pnpm dev` รัน web + api + worker พร้อมกัน |
| **Vitest** | api | unit tests สำหรับ business logic |

---

## Use Case Diagram

### Actors

| Actor | คำอธิบาย |
| --- | --- |
| **Guest** | ผู้เยี่ยมชมที่ยังไม่ login |
| **Customer** | ลูกค้าที่ login แล้ว — ซื้อ, สะสม, wishlist |
| **Seller** | ลูกค้าที่ลงขายบน marketplace (role เดียวกับ customer + Stripe Connect) |
| **Manager** | จัดการสินค้าร้านค้า, อัปโหลดรูป |
| **Admin** | สิทธิ์สูงสุด — จัดการระบบ, products, settings |
| **System** | Worker, webhook, cron — ทำงานอัตโนมัติเบื้องหลัง |

```mermaid
flowchart LR
    subgraph Actors
        G((Guest))
        C((Customer))
        S((Seller))
        M((Manager))
        A((Admin))
        SYS((System))
    end

    subgraph Shop["ร้านค้า (Shop)"]
        UC1[เรียกดูสินค้า]
        UC2[ค้นหา / กรองสินค้า]
        UC3[เพิ่มลงตะกร้า]
        UC4[ชำระเงิน Shop]
        UC5[ติดตามคำสั่งซื้อ]
    end

    subgraph Marketplace["Marketplace C2C"]
        UC6[เรียกดู Listing]
        UC7[ดูกราฟราคา / Recent Sales]
        UC8[ซื้อ Listing<br/>Escrow Payment]
        UC9[ลงขาย Listing]
        UC10[Onboard Stripe Connect]
        UC11[อัปเดต Tracking]
        UC12[รีวิวผู้ขาย]
        UC13[จัดการคำสั่งซื้อ<br/>ฝั่งผู้ขาย]
    end

    subgraph Account["บัญชีผู้ใช้"]
        UC14[สมัคร / เข้าสู่ระบบ]
        UC15[จัดการที่อยู่]
        UC16[คอลเลกชัน / Wishlist]
        UC17[รับการแจ้งเตือน]
    end

    subgraph Content["เนื้อหา"]
        UC18[อ่านข่าว / Event]
    end

    subgraph AdminUC["การจัดการ"]
        UC19[จัดการสินค้าร้าน]
        UC20[อัปโหลดรูปสินค้า]
        UC21[จัดการ Platform Settings]
    end

    subgraph SystemUC["ระบบอัตโนมัติ"]
        UC22[ปล่อย Escrow อัตโนมัติ]
        UC23[รวมราคาตลาดรายวัน]
        UC24[Sync Tracking จากขนส่ง]
        UC25[Ingest ข่าวจาก n8n]
    end

    G --> UC1 & UC2 & UC6 & UC7 & UC18
    C --> UC3 & UC4 & UC5 & UC8 & UC14 & UC15 & UC16 & UC17
    S --> UC9 & UC10 & UC11 & UC12 & UC13
    M --> UC19 & UC20
    A --> UC19 & UC20 & UC21
    SYS --> UC22 & UC23 & UC24 & UC25

    UC8 -.->|include| UC10
    UC4 -.->|extend| UC15
    UC8 -.->|extend| UC15
```

### รายละเอียด Use Cases หลัก

| ID | Use Case | Actor | คำอธิบาย |
| --- | --- | --- | --- |
| UC-01 | เรียกดูสินค้า Shop | Guest, Customer | ดู catalog 20 หมวด, featured, trending |
| UC-02 | ซื้อสินค้า Shop | Customer | cart → checkout → Stripe Checkout (หรือ mock) |
| UC-03 | ซื้อ Marketplace Listing | Customer | PaymentIntent + เงินเข้า Escrow |
| UC-04 | ลงขาย Listing | Seller | เลือก CatalogItem, กำหนดราคา/สภาพ |
| UC-05 | อัปเดต Tracking | Seller | ระบุ carrier + tracking number |
| UC-06 | ปล่อย Escrow | System | Worker ปล่อยเงินให้ seller หลัง `ESCROW_AUTO_RELEASE_DAYS` |
| UC-07 | กราฟราคาตลาด | Guest, Customer | แสดง `PricePoint` + `Trade` จากยอดขายจริง |
| UC-08 | จัดการสินค้า | Manager, Admin | CRUD products, upload รูปผ่าน R2 |
| UC-09 | คอลเลกชัน / Wishlist | Customer | บันทึกการ์ดที่สะสม / อยากได้ |
| UC-10 | รีวิวผู้ขาย | Customer | ให้คะแนนหลัง order completed |

---

## Class Diagram

แผนภาพ class หลักจาก Prisma schema — แสดง entity, relationship และ enum สำคัญ

```mermaid
classDiagram
    direction TB

    class User {
        +String id
        +String clerkId
        +String email
        +String displayName
        +Role role
        +String stripeConnectAccountId
        +Float sellerRating
    }

    class Address {
        +String id
        +String fullName
        +String phone
        +String province
        +Boolean isDefault
    }

    class Category {
        +String slug
        +String name
        +String nameTh
        +Int sortOrder
    }

    class CatalogItem {
        +String slug
        +String name
        +Rarity rarity
        +String imageUrl
    }

    class Product {
        +String slug
        +ProductType type
        +Int price
        +Int stock
        +Boolean isFeatured
    }

    class Cart {
        +String userId
    }

    class CartItem {
        +Int quantity
    }

    class Order {
        +String orderNumber
        +OrderStatus status
        +Int total
        +String stripeSessionId
    }

    class OrderItem {
        +String name
        +Int unitPrice
        +Int quantity
    }

    class Listing {
        +Int price
        +CardCondition condition
        +ListingStatus status
    }

    class MarketplaceOrder {
        +MarketplaceOrderStatus status
        +Int amount
        +Int platformFee
        +Int sellerPayout
        +DateTime releaseDueAt
    }

    class Trade {
        +Int price
        +DateTime soldAt
    }

    class PricePoint {
        +DateTime day
        +Int avg
        +Int low
        +Int high
        +Int volume
    }

    class Shipment {
        +Carrier carrier
        +String trackingNumber
        +ShipmentStatus status
    }

    class ShipmentEvent {
        +ShipmentStatus status
        +DateTime at
    }

    class SellerReview {
        +Int rating
        +String comment
    }

    class CollectionItem {
        +Int quantity
        +DateTime acquiredAt
    }

    class WishlistItem {
        +DateTime createdAt
    }

    class Notification {
        +NotificationType type
        +String title
        +Boolean read
    }

    class NewsPost {
        +NewsKind kind
        +String title
        +Boolean published
    }

    class Coupon {
        +String code
        +Int percentOff
        +Boolean active
    }

    User "1" --> "*" Address
    User "1" --> "1" Cart
    User "1" --> "*" Order
    User "1" --> "*" Listing : sells
    User "1" --> "*" MarketplaceOrder : buys
    User "1" --> "*" MarketplaceOrder : sells
    User "1" --> "*" CollectionItem
    User "1" --> "*" WishlistItem
    User "1" --> "*" Notification

    Category "1" --> "*" CatalogItem
    CatalogItem "1" --> "*" Product
    CatalogItem "1" --> "*" Listing
    CatalogItem "1" --> "*" Trade
    CatalogItem "1" --> "*" PricePoint

    Cart "1" --> "*" CartItem
    CartItem "*" --> "1" Product

    Order "1" --> "*" OrderItem
    Order "1" --> "0..1" Shipment
    Order "*" --> "0..1" Coupon
    Order "*" --> "1" User

    Listing "1" --> "*" MarketplaceOrder
    MarketplaceOrder "1" --> "0..1" Trade
    MarketplaceOrder "1" --> "0..1" Shipment
    MarketplaceOrder "1" --> "0..1" SellerReview

    Shipment "1" --> "*" ShipmentEvent
```

### Enums หลัก

| Enum | ค่าที่ใช้ |
| --- | --- |
| `Role` | `customer`, `manager`, `admin` |
| `OrderStatus` | `PENDING` → `PAID` → `SHIPPED` → `DELIVERED` |
| `MarketplaceOrderStatus` | `PENDING_PAYMENT` → `PAID_HELD` → `SHIPPED` → `DELIVERED` → `COMPLETED` |
| `ListingStatus` | `ACTIVE`, `SOLD`, `CANCELLED`, `SUSPENDED` |
| `ShipmentStatus` | `PENDING` → `SHIPPED` → `IN_TRANSIT` → `DELIVERED` |
| `CardCondition` | `MINT`, `NEAR_MINT`, `EXCELLENT`, `GOOD`, `PLAYED`, `DAMAGED` |

## ระบบเครดิต (Credit / Wallet)

> **Demo mode ใช้เครดิตแทนเงินสดทั้งหมด** — ไม่ต้องต่อ Stripe/Clerk ก็ทดสอบ flow ครบได้

```mermaid
flowchart LR
    subgraph Customer
        TOPUP[เติมเครดิต<br/>/account/wallet]
        SHOP[ซื้อ Shop<br/>ชำระเครดิต]
        BUY[ซื้อ Marketplace<br/>หักเครดิต → Escrow]
    end

    subgraph Seller
        SELL[ขายสำเร็จ]
        CREDIT[ได้รับเครดิต]
        WITHDRAW[ขอถอน<br/>/account/withdraw]
    end

    subgraph Staff
        GRANT[Admin/Manager<br/>เติมเครดิตให้ผู้ใช้]
        APPROVE[อนุมัติถอน<br/>โอนเงินสดนอกระบบ]
    end

    TOPUP --> SHOP
    TOPUP --> BUY
    BUY --> SELL --> CREDIT --> WITHDRAW --> APPROVE
    GRANT --> TOPUP
```

| ฟีเจอร์ | หน้า/API | คำอธิบาย |
| --- | --- | --- |
| เติมเครดิต (ลูกค้า) | `/account/wallet` | Demo: เติมทันทีไม่ผ่าน payment gateway |
| ชำระ Shop | `/checkout` | หักเครดิต + คูปอง + ค่าจัดส่ง |
| ชำระ Marketplace | กดซื้อ listing | หักเครดิตเข้า Escrow (heldBalance) |
| ปล่อย Escrow | Worker auto-release | โอนเครดิตให้ผู้ขาย (sellerPayout) |
| ถอนเครดิต | `/account/withdraw` | ผู้ขายขอถอน → เมเนเจอร์อนุมัติ → โอนเงินสด |
| Admin เติมเครดิต | `/admin?tab=wallet` | Manager/Admin ให้เครดิตผู้ใช้ |
| คืนเครดิต Shop | Admin Shop Orders | คืนเครดิตเมื่อ refund |

**ทำไมใช้เครดิต?** ลูกค้าต้องเติมเครดิตก่อนซื้อ ทำให้ยากต่อการซื้อของตัวเองเพื่อปั๊มยอดขาย (self-purchase) และแยกเงินสดจริงออกจากระบบ marketplace

---

## SLA — Service Level Agreement

> เป้าหมายระดับบริการสำหรับ **Production** (Vercel + Railway/Render + Supabase/Neon + Upstash)

### Availability & Performance

| Metric | เป้าหมาย | ช่วงวัด | หมายเหตุ |
| --- | --- | --- | --- |
| **Uptime (Web + API)** | ≥ 99.5% | รายเดือน | ไม่รวม planned maintenance |
| **API Response (p95)** | < 500 ms | REST read endpoints | catalog, products, listings |
| **API Response (p95)** | < 1,500 ms | REST write endpoints | checkout, create listing |
| **Web Page Load (LCP)** | < 2.5 s | หน้าหลัก, shop, marketplace | บน 4G / broadband |
| **WebSocket Latency** | < 2 s | recent sales feed | จาก trade ใหม่ → client |
| **Database Query (p95)** | < 200 ms | indexed queries | Prisma + PostgreSQL |

### Business Operations

| กระบวนการ | เป้าหมาย | รายละเอียด |
| --- | --- | --- |
| **Credit Top-up** | ≤ 5 วินาที | Demo: ทันที / Production: Stripe |
| **Marketplace Escrow Hold** | ทันทีหลังชำระ | สถานะ `PAID_HELD` ภายใน 60 วินาที |
| **Escrow Auto-Release** | ภายใน 24 ชม. หลังครบกำหนด | Worker ตรวจ `releaseDueAt` ทุกชั่วโมง |
| **Withdrawal Approval** | ≤ 1 วันทำการ | เมเนเจอร์อนุมัติคำขอถอน |
| **Price Aggregation** | อัปเดตภายใน 1 ชม. | Worker สร้าง `PricePoint` รายวัน |

### Support & Incident

| ระดับ | คำอธิบาย | Response Time | Resolution Target |
| --- | --- | --- | --- |
| **P1 — Critical** | ระบบล่ม, ชำระเงินไม่ได้ | ≤ 1 ชม. | ≤ 4 ชม. |
| **P2 — High** | marketplace/escrow ผิดพลาด | ≤ 4 ชม. | ≤ 24 ชม. |
| **P3 — Medium** | ฟีเจอร์เสียบางส่วน | ≤ 1 วันทำการ | ≤ 3 วันทำการ |
| **P4 — Low** | UI/UX, คำถามทั่วไป | ≤ 2 วันทำการ | ตามแผน sprint |

---

> เป้าหมายระดับบริการสำหรับ **Production** (Vercel + Railway/Render + Supabase/Neon + Upstash)

### Availability & Performance

| Metric | เป้าหมาย | ช่วงวัด | หมายเหตุ |
| --- | --- | --- | --- |
| **Uptime (Web + API)** | ≥ 99.5% | รายเดือน | ไม่รวม planned maintenance |
| **API Response (p95)** | < 500 ms | REST read endpoints | catalog, products, listings |
| **API Response (p95)** | < 1,500 ms | REST write endpoints | checkout, create listing |
| **Web Page Load (LCP)** | < 2.5 s | หน้าหลัก, shop, marketplace | บน 4G / broadband |
| **WebSocket Latency** | < 2 s | recent sales feed | จาก trade ใหม่ → client |
| **Database Query (p95)** | < 200 ms | indexed queries | Prisma + PostgreSQL |

### Business Operations

| กระบวนการ | เป้าหมาย | รายละเอียด |
| --- | --- | --- |
| **Shop Payment** | ≤ 30 วินาที | Stripe Checkout redirect → webhook confirm |
| **Marketplace Escrow Hold** | ทันทีหลังชำระ | สถานะ `PAID_HELD` ภายใน 60 วินาที |
| **Escrow Auto-Release** | ภายใน 24 ชม. หลังครบกำหนด | Worker ตรวจ `releaseDueAt` ทุกชั่วโมง |
| **Price Aggregation** | อัปเดตภายใน 1 ชม. | Worker สร้าง `PricePoint` รายวัน |
| **Tracking Sync** | ภายใน 4 ชม. | Flash webhook หรือ manual update |
| **Image Upload** | ≤ 10 วินาที | presign + PUT ไป R2 (ไฟล์ ≤ 5 MB) |
| **Notification Delivery** | ≤ 5 นาที | หลัง order/shipment status เปลี่ยน |

### Support & Incident

| ระดับ | คำอธิบาย | Response Time | Resolution Target |
| --- | --- | --- | --- |
| **P1 — Critical** | ระบบล่ม, ชำระเงินไม่ได้ | ≤ 1 ชม. | ≤ 4 ชม. |
| **P2 — High** | marketplace/escrow ผิดพลาด | ≤ 4 ชม. | ≤ 24 ชม. |
| **P3 — Medium** | ฟีเจอร์เสียบางส่วน | ≤ 1 วันทำการ | ≤ 3 วันทำการ |
| **P4 — Low** | UI/UX, คำถามทั่วไป | ≤ 2 วันทำการ | ตามแผน sprint |

### Planned Maintenance

- แจ้งล่วงหน้า **≥ 24 ชม.** ผ่านหน้าเว็บ / notification
- หน้าต่าง maintenance แนะนำ: **อังคาร 02:00–04:00 (UTC+7)**
- Rollback ภายใน **30 นาที** หาก deploy ล้มเหลว

---

## UAT — User Acceptance Testing

> **ความครอบคลุมปัจจุบัน: ~90%** (38/42 test cases ผ่านใน Demo mode)

### สรุปสถานะ UAT

| Persona | ผ่าน | บางส่วน | ยังขาด | รวม |
| --- | --- | --- | --- | --- |
| **Customer** | 16 | 1 | 1 | 18 |
| **Manager** | 12 | 1 | 1 | 14 |
| **Admin** | 10 | 0 | 0 | 10 |
| **รวม** | **38** | **2** | **2** | **42** |

### สิ่งที่เสร็จแล้ว (Demo mode)

- Auth, Account, Shop, Cart, Checkout (เครดิต + คูปอง + ค่าจัดส่ง)
- Marketplace escrow ด้วยเครดิต, Wishlist, Collection, Notifications
- Seller reviews, กราฟราคา, Recent sales (Socket.IO)
- Admin: Products CRUD, Listings suspend, Platform settings, Wallet grant
- ถอนเครดิต + เมเนเจอร์อนุมัติ, Shop refund คืนเครดิต, Dispute refund

### ยังขาด / บางส่วน (~10%)

| ฟีเจอร์ | สถานะ | หมายเหตุ |
| --- | --- | --- |
| Make an Offer | บางส่วน | ปุ่มมี ยังไม่มี negotiation flow |
| Shop product reviews | ยังขาด | มีแค่ marketplace seller review |
| Stripe live payment | นอก scope Demo | ใช้เครดิตแทนใน Demo |
| Catalog taxonomy CRUD UI | บางส่วน | ดูได้ สร้างผ่าน API ยังไม่มีฟอร์มเต็ม |

### สภาพแวดล้อมทดสอบ

| รายการ | Demo Mode | Production Mode |
| --- | --- | --- |
| Auth | Dev session login ที่ `/account` | Clerk sign-in/sign-up |
| Payment | **เครดิต** (Wallet) | Stripe + เครดิต |
| Escrow payout | เครดิตให้ผู้ขาย | Stripe Connect transfer |
| DB | `pnpm db:seed` | staging database |

### UAT Test Cases (อัปเดต)

#### TC-01: Authentication & Roles — ✅ ผ่าน 4/4

#### TC-02: Shop + Credits — ✅ ผ่าน 5/5

| Step | Action | Expected Result | ✓ |
| --- | --- | --- | --- |
| 1 | เติมเครดิตที่ `/account/wallet` | ยอดเพิ่มทันที | ☑ |
| 2 | Add to cart → checkout | เห็นคูปอง WELCOME10, ค่าจัดส่ง | ☑ |
| 3 | ชำระด้วยเครดิต | order `PAID`, เครดิตหัก | ☑ |

#### TC-03: Marketplace Escrow + Credits — ✅ ผ่าน 6/6

| Step | Action | Expected Result | ✓ |
| --- | --- | --- | --- |
| 1 | ซื้อ listing ด้วยเครดิต | `PAID_HELD`, heldBalance เพิ่ม | ☑ |
| 2 | Seller จัดส่ง + buyer confirm | seller ได้เครดิต | ☑ |
| 3 | Seller ถอนที่ `/account/withdraw` | คำขอ PENDING | ☑ |
| 4 | Manager อนุมัติที่ `/admin?tab=wallet` | สถานะ COMPLETED | ☑ |

#### TC-04 – TC-06: Price chart, Collection, Shipping — ✅ ผ่าน

#### TC-07: Admin / Manager — ✅ ผ่าน 8/8

| Step | Action | ✓ |
| --- | --- | --- |
| สร้าง/แก้ไข/ลบ product | `/admin?tab=products` | ☑ |
| Suspend listing | `/admin?tab=listings` | ☑ |
| Platform settings | `/admin?tab=settings` | ☑ |
| เติมเครดิตให้ผู้ใช้ | `/admin?tab=wallet` | ☑ |
| คืนเครดิต shop order | Shop Orders → คืนเครดิต | ☑ |

#### TC-08: News & Notifications — ✅ ผ่าน 3/3

### UAT Sign-off Criteria

| เกณฑ์ | เป้าหมาย | สถานะ |
| --- | --- | --- |
| Test cases ผ่าน | ≥ 90% | **90%** ✅ |
| Credit + Escrow flow | ผ่านครบ | ✅ |
| Demo mode พร้อมสาธิต | ใช้งานได้ทันที | ✅ |

---

## วิธีรันโปรเจ็กต์

### สิ่งที่ต้องมี

| โปรแกรม | เวอร์ชัน | ใช้ทำอะไร |
| --- | --- | --- |
| **Node.js** | ≥ 20 | รัน Next.js, NestJS, Worker |
| **pnpm** | 10.x | จัดการ monorepo |
| **Docker Desktop** | ล่าสุด | รัน PostgreSQL + Redis |

```bash
node -v          # v20+
pnpm -v          # 10.x
docker compose version
```

### รันครั้งแรก (Quick Start)

```bash
# 1) Clone
git clone https://github.com/danaiwut/Card_sell_Ecommerce.git
cd Card_sell_Ecommerce

# 2) ติดตั้ง dependencies
pnpm install

# 3) เปิด PostgreSQL + Redis
docker compose up -d

# 4) ตั้งค่า environment
cp .env.example .env

# 5) เตรียมฐานข้อมูล
pnpm db:generate
pnpm db:push
pnpm db:seed

# 6) สตาร์ท dev server (เปิดทิ้งไว้)
pnpm dev
```

เปิดเบราว์เซอร์: **http://localhost:3000**

### Services ที่รันขึ้นมา

| Service | Port | URL |
| --- | --- | --- |
| **Web (Next.js)** | 3000 | http://localhost:3000 |
| **API (NestJS)** | 4000 | http://localhost:4000 (internal) |
| **PostgreSQL** | 5432 | `localhost:5432` |
| **Redis** | 6379 | `localhost:6379` |
| **Worker (BullMQ)** | — | background process |

เบราว์เซอร์เรียกแค่ port **3000** — Next.js proxy REST ไป `/backend/*` และ Socket.IO ไป NestJS ที่ port 4000

### Demo Mode (ไม่ต้องมี API key)

เมื่อ `CLERK_*` และ `STRIPE_*` ว่างอยู่ — **ทุกอย่างเป็นของจริงยกเว้น payment gateway**:

1. เปิด http://localhost:3000/account
2. เลือก role: `customer`, `manager`, หรือ `admin`
3. กด Sign in (dev session)
4. ไป `/account/wallet` — ได้เครดิตต้อนรับ ฿5,000 อัตโนมัติ (หรือเติมเพิ่ม)

| หน้า | URL | ทำอะไรได้ |
| --- | --- | --- |
| กระเป๋าเครดิต | `/account/wallet` | เติมเครดิต, ดูประวัติ |
| ถอนเครดิต | `/account/withdraw` | ผู้ขายขอถอน → เมเนเจอร์อนุมัติ |
| ร้านค้า | `/shop` → `/checkout` | ซื้อด้วยเครดิต + คูปอง WELCOME10 |
| Marketplace | `/marketplace` | ซื้อด้วยเครดิต, escrow, กราฟราคา |
| คอลเลกชัน | `/collection` | การ์ดของฉัน + wishlist |
| ขายของ | `/account/sell` | ลง listing, รับเครดิตเมื่อขายสำเร็จ |
| Admin | `/admin` | products, wallet, settings, listings |

### Production Mode

ตั้งค่าใน `.env`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Cloudflare R2 (optional — อัปโหลดรูป)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_PUBLIC_URL="https://..."
```

### รันครั้งถัดไป

```bash
docker compose up -d    # ถ้า container ยังไม่ up
pnpm dev
```

### หยุดระบบ

```bash
# Ctrl+C ใน terminal ที่รัน pnpm dev
docker compose down
```

### คำสั่งที่มีประโยชน์

```bash
pnpm db:studio      # Prisma Studio — ดู/แก้ข้อมูลใน DB
pnpm typecheck      # ตรวจ TypeScript ทั้ง monorepo
pnpm build          # build production
pnpm lint           # lint ทุก package
```

### แก้ปัญหาที่พบบ่อย

| ปัญหา | สาเหตุ | วิธีแก้ |
| --- | --- | --- |
| `ERR_CONNECTION_REFUSED` | ยังไม่รัน `pnpm dev` | รัน `pnpm dev` แล้วรอ web + api + worker ขึ้นครบ |
| `DATABASE_URL not found` | ไม่มี `.env` | `cp .env.example .env` |
| `P1001 Can't reach database` | Postgres ยังไม่ up | `docker compose up -d` |
| Port 3000 ถูกใช้ | process อื่นครอบ | `lsof -i :3000` แล้วปิด process |

> คู่มือรันแบบละเอียด (ภาษาไทย): ดู [`app.md`](./app.md)

---

## โครงสร้าง Monorepo

```
Card_sell_Ecommerce/
├── apps/
│   ├── web/          # Next.js 15 — storefront, marketplace, dashboards
│   ├── api/          # NestJS — REST API + Socket.IO gateway
│   └── worker/       # BullMQ — escrow release, price aggregation, notifications
├── packages/
│   ├── db/           # Prisma schema + client + seed
│   ├── shared/       # types, Zod schemas, 20-category taxonomy
│   └── ui/           # shared React components
├── docs/             # design docs, n8n workflows
├── docker-compose.yml
├── .env.example
└── turbo.json
```

---

## Deployment

| Component | Recommended Host | Dockerfile |
| --- | --- | --- |
| `apps/web` | **Vercel** (Next.js) | — |
| `apps/api` | Railway / Render / Fly | `apps/api/Dockerfile` |
| `apps/worker` | Railway / Render / Fly | `apps/worker/Dockerfile` |
| PostgreSQL | **Supabase** / Neon | — |
| Redis | **Upstash** | — |
| Images | **Cloudflare R2** | — |

### Checklist ก่อน Deploy

- [ ] ตั้ง `DATABASE_URL`, `REDIS_URL` เดียวกันทุก service
- [ ] ตั้ง `INTERNAL_API_SECRET` เดียวกันบน api + worker
- [ ] ตั้ง Stripe webhook → `POST {API_URL}/payments/webhook`
- [ ] ตั้ง Clerk webhook (ถ้าใช้) → `POST {API_URL}/auth/webhook`
- [ ] ตั้ง `CORS_ORIGIN` เป็น production domain
- [ ] รัน `pnpm db:migrate` บน production database

CI build + typecheck ทุก push ผ่าน [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

---

## License

Private project — All rights reserved.
