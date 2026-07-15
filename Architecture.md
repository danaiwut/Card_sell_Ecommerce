# System Architecture — CardVerse
### ขอบเขต: Home / News / Notifications / Wishlist (Collection)

เอกสารนี้อธิบายสถาปัตยกรรมระบบในส่วนที่รับผิดชอบ อ้างอิงจากโค้ดจริง (`packages/db/prisma/schema.prisma`, `apps/api/src/**`, `apps/web/src/app/**`)

สำหรับ Requirement Analysis และ Use Case Diagram ดูเพิ่มเติมได้ที่ [`analysis-design.md`](./analysis-design.md)

---

## 1. System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["🖥️ apps/web (Next.js 15 App Router)"]
        Home["/ (Home)"]
        News["/news, /news/[slug]"]
        Notif["/notifications"]
        Wish["/collection (Wishlist)"]
    end

    subgraph API["⚙️ apps/api (NestJS)"]
        ProductsCtrl["ProductsController"]
        NewsCtrl["NewsController"]
        NotifCtrl["NotificationsController"]
        CollectionCtrl["CollectionController"]
    end

    subgraph Worker["🔄 apps/worker (BullMQ)"]
        JobQueue["Notification / Price Jobs"]
    end

    subgraph DB["🗄️ packages/db (Prisma + PostgreSQL)"]
        ProductTbl[(Product)]
        NewsTbl[(NewsPost)]
        NotifTbl[(Notification)]
        WishTbl[(WishlistItem)]
    end

    Home -->|GET /products| ProductsCtrl
    News -->|GET /news, /news/:slug| NewsCtrl
    Notif -->|GET /notifications<br/>POST /:id/read<br/>POST /read-all| NotifCtrl
    Wish -->|GET /collection/wishlist<br/>POST /collection/wishlist/toggle| CollectionCtrl

    ProductsCtrl --> ProductTbl
    NewsCtrl --> NewsTbl
    NotifCtrl --> NotifTbl
    CollectionCtrl --> WishTbl

    JobQueue -.enqueues.-> NotifTbl
```

### 1.1 Component Responsibility

| Layer | Component | หน้าที่ |
|---|---|---|
| Frontend | `apps/web/src/app/page.tsx` | Home: Hero Carousel + Featured Products |
| Frontend | `apps/web/src/app/news/**` | News list + detail page |
| Frontend | `apps/web/src/app/notifications/page.tsx` | รายการแจ้งเตือน + mark-read |
| Frontend | `apps/web/src/app/collection/page.tsx` | Wishlist พร้อม toggle |
| Backend | `NotificationsController` / `NotificationsService` | จัดการ read/read-all |
| Backend | `CollectionController` / `CollectionService` | จัดการ wishlist toggle (idempotent) |
| Backend | `NewsController` / `NewsService` | ดึงรายการข่าวและรายละเอียด |
| Data | Prisma models: `Notification`, `WishlistItem`, `NewsPost`, `CatalogItem` | เก็บข้อมูลจริงใน PostgreSQL |

---

## 2. Sequence Diagram: Toggle Wishlist

```mermaid
sequenceDiagram
    participant U as ผู้ใช้
    participant FE as /collection (Next.js)
    participant API as CollectionController
    participant SVC as CollectionService
    participant DB as PostgreSQL (WishlistItem)

    U->>FE: Hover การ์ด แล้วคลิกปุ่ม X
    FE->>API: POST /collection/wishlist/toggle { catalogItemId }
    API->>SVC: toggleWishlist(userId, catalogItemId)
    SVC->>DB: หา record ที่ (userId, catalogItemId)
    alt มีอยู่แล้ว
        DB-->>SVC: พบ record
        SVC->>DB: DELETE WishlistItem
    else ยังไม่มี
        DB-->>SVC: ไม่พบ
        SVC->>DB: CREATE WishlistItem
    end
    DB-->>SVC: สำเร็จ
    SVC-->>API: ผลลัพธ์
    API-->>FE: 200 OK
    FE->>FE: อัปเดต UI + Badge จำนวนรายการ
```

## 2.1 Sequence Diagram: Mark Notification as Read

```mermaid
sequenceDiagram
    participant U as ผู้ใช้
    participant FE as /notifications (Next.js)
    participant API as NotificationsController
    participant SVC as NotificationsService
    participant DB as PostgreSQL (Notification)

    U->>FE: คลิกที่รายการแจ้งเตือน
    FE->>API: POST /notifications/:id/read
    API->>SVC: markRead(userId, id)
    SVC->>DB: UPDATE Notification SET read = true
    DB-->>SVC: สำเร็จ
    SVC-->>API: ผลลัพธ์
    API-->>FE: 200 OK
    FE->>FE: ลด Unread Badge ลง 1
    FE->>U: นำทางไปยัง link ที่ระบุไว้ในรายการนั้น
```

---

## 3. Entity Relationship Diagram

อ้างอิงจาก `packages/db/prisma/schema.prisma` จริง (เฉพาะส่วนที่เกี่ยวข้องกับขอบเขตนี้):

```mermaid
erDiagram
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ WISHLIST_ITEM : owns
    USER ||--o{ NEWS_POST : authors
    CATALOG_ITEM ||--o{ WISHLIST_ITEM : "referenced by"
    CATALOG_ITEM ||--o{ COLLECTION_ITEM : "referenced by"

    USER {
        string id PK
        string email
        string name
    }
    NOTIFICATION {
        string id PK
        string userId FK
        enum type
        string title
        string body
        string link
        boolean read
        datetime createdAt
    }
    WISHLIST_ITEM {
        string id PK
        string userId FK
        string catalogItemId FK
        datetime createdAt
    }
    NEWS_POST {
        string id PK
        string slug
        enum kind
        string title
        string excerpt
        string body
        boolean published
        datetime eventDate
    }
    CATALOG_ITEM {
        string id PK
        string name
    }
```

---

## 4. สรุป

สถาปัตยกรรมของระบบในส่วนที่รับผิดชอบใช้รูปแบบ Client-Server แยกชั้นชัดเจน: Next.js Frontend เรียกใช้ REST API ของ NestJS ซึ่งเชื่อมต่อกับ PostgreSQL ผ่าน Prisma ORM โดยมี BullMQ Worker ทำหน้าที่สร้าง Notification แบบ Asynchronous อยู่เบื้องหลัง การ toggle wishlist ถูกออกแบบให้ idempotent ผ่าน unique constraint ระดับ database เพื่อป้องกันข้อมูลซ้ำซ้อน