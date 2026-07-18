# CardVerse — UAT (User Acceptance Testing)

เอกสารทดสอบยอมรับระบบ แยกตาม **Persona** ครอบคลุมทั้งเว็บ (Storefront + Account + Admin Panel)

**เวอร์ชัน:** 2026-07-14  
**สภาพแวดล้อม:** Local dev (`pnpm dev` + Docker Postgres/Redis)  
**Responsive breakpoints ที่ทดสอบ:** Mobile 375px · Tablet 768px · Desktop 1280px

---

## สารบัญ

1. [บทบาทและวิธี Login](#บทบาทและวิธี-login)
2. [Guest — ผู้เยี่ยมชม](#guest--ผู้เยี่ยมชม)
3. [Customer — ลูกค้า](#customer--ลูกค้า)
4. [Manager — ผู้จัดการร้าน](#manager--ผู้จัดการร้าน)
5. [Admin — ผู้ดูแลระบบ](#admin--ผู้ดูแลระบบ)
6. [Responsive UAT (ทุก Persona)](#responsive-uat-ทุก-persona)
7. [Smoke Test แนะนำ](#smoke-test-แนะนำ)
8. [Sign-off Criteria](#sign-off-criteria)

---

## บทบาทและวิธี Login

| Persona | Role ใน DB | วิธี Login (Demo) | วิธี Login (Production) |
| --- | --- | --- | --- |
| **Guest** | — | ไม่ login | ไม่ login |
| **Customer** | `customer` | `/account` → เข้าสู่ระบบเป็น Customer | Clerk sign-in |
| **Manager** | `manager` | `/account` → เข้าสู่ระบบเป็น Manager | Clerk + role ใน metadata/DB |
| **Admin** | `admin` | `/account` → เข้าสู่ระบบเป็น Admin | Clerk + role `admin` |

**บัญชี Demo (dev session):**

| Email | Role | เครดิตเริ่มต้น |
| --- | --- | --- |
| `customer@cardverse.demo` | customer | ฿5,000 |
| `manager@cardverse.demo` | manager | ฿10,000 |
| `admin@cardverse.demo` | admin | ฿50,000 |

**Admin Panel:** http://localhost:3000/admin (layout แยก — ไม่มี navbar หน้าร้าน)

---

## Guest — ผู้เยี่ยมชม

### G-01: หน้าแรกและ Navigation

| ID | Step | Expected | Mobile | Tablet | Desktop |
| --- | --- | --- | --- | --- | --- |
| G-01-1 | เปิด `/` | Hero carousel, หมวดหมู่, สินค้าแนะนำ แสดงครบ | ☐ | ☐ | ☐ |
| G-01-2 | กดเมนู hamburger (มือถือ) | Drawer เมนู Home/Shop/Marketplace/News เปิดได้ | ☐ | — | — |
| G-01-3 | สลับภาษา TH/EN | ข้อความ UI เปลี่ยนภาษา | ☐ | ☐ | ☐ |
| G-01-4 | กดโลโก้ CardVerse | กลับหน้าแรก | ☐ | ☐ | ☐ |

### G-02: Shop (ร้านค้าออฟฟิเชียล)

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| G-02-1 | เปิด `/shop` | รายการสินค้า grid 2 คอลัมน์ (มือถือ) / 4 คอลัมน์ (เดสก์ท็อป) | ☐ |
| G-02-2 | ค้นหา / กรอง category, type, ราคา | ผลลัพธ์อัปเดตตาม filter | ☐ |
| G-02-3 | เปิด `/shop/[slug]` | รูป, ราคา, รายละเอียด, ปุ่ม Add to cart | ☐ |
| G-02-4 | กด Add to cart (ยังไม่ login) | Redirect ไป sign-in หรือแจ้งให้ login | ☐ |
| G-02-5 | Pagination | เปลี่ยนหน้าได้ | ☐ |

### G-03: Marketplace

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| G-03-1 | เปิด `/marketplace` | Listing grid + recent sales feed | ☐ |
| G-03-2 | กรอง rarity / category / ราคา | ผลลัพธ์ถูกต้อง | ☐ |
| G-03-3 | เปิด `/marketplace/[catalogItemId]` | กราฟราคา, รายการขาย, แท็บข้อมูลการ์ด | ☐ |
| G-03-4 | กด Buy (ยังไม่ login) | ต้อง login ก่อน | ☐ |
| G-03-5 | กด Sell | ไป sign-in หรือ account | ☐ |

### G-04: News

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| G-04-1 | เปิด `/news` | รายการข่าว + filter kind | ☐ |
| G-04-2 | เปิด `/news/[slug]` | อ่านบทความได้ | ☐ |

### G-05: หน้าที่ต้อง Login

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| G-05-1 | เปิด `/cart` | แสดงข้อความให้ login | ☐ |
| G-05-2 | เปิด `/checkout` | Redirect sign-in (Clerk mode) | ☐ |
| G-05-3 | เปิด `/account` | แสดงหน้า login | ☐ |
| G-05-4 | เปิด `/admin` | แสดง gate "Manager และ Admin เท่านั้น" | ☐ |

---

## Customer — ลูกค้า

> ครอบคลุมทุกอย่างของ Guest + บัญชี, ซื้อขาย, wallet, seller flow

### C-01: Authentication & Account

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-01-1 | Login เป็น customer | เข้า `/account` ได้ | ☐ |
| C-01-2 | ดู Overview dashboard | สถิติ orders/purchases/wishlist/listings | ☐ |
| C-01-3 | Mobile: account nav pills | เลื่อนเมนูแนวนอนได้, เปลี่ยนหน้าได้ | ☐ |
| C-01-4 | Desktop: account sidebar | เมนูด้านซ้ายครบ | ☐ |
| C-01-5 | แก้ display name ที่ `/account/settings` | บันทึกสำเร็จ | ☐ |
| C-01-6 | Logout | ออกจากระบบได้ | ☐ |

### C-02: Wallet / Credits

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-02-1 | เปิด `/account/wallet` | แสดงยอดเครดิต | ☐ |
| C-02-2 | Demo top-up (preset/custom) | ยอดเพิ่มทันที | ☐ |
| C-02-3 | ดู transaction history | รายการเคลื่อนไหวแสดง | ☐ |

### C-03: Shop Purchase Flow

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-03-1 | Add to cart จาก `/shop/[slug]` | สินค้าเข้าตะกร้า, badge cart อัปเดต | ☐ |
| C-03-2 | เปิด `/cart` — mobile | แสดงการ์ดสินค้า (ไม่ใช่ตาราง) | ☐ |
| C-03-3 | เปิด `/cart` — desktop | แสดงตาราง | ☐ |
| C-03-4 | ปรับ qty / ลบสินค้า | ยอดอัปเดต | ☐ |
| C-03-5 | Checkout: เลือกที่อยู่ + ขนส่ง | ขั้นตอน shipping ผ่าน | ☐ |
| C-03-6 | ใส่คูปอง `WELCOME10` | ส่วนลดคำนวณถูก | ☐ |
| C-03-7 | ชำระด้วยเครดิต | Order `PAID`, เครดิตหัก | ☐ |
| C-03-8 | ดู order ที่ `/account/orders` | รายการ + tracking | ☐ |
| C-03-9 | เปิด `/account/orders/[id]` | Timeline + รายการสินค้า | ☐ |

### C-04: Marketplace — Buyer

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-04-1 | ซื้อ listing ด้วยเครดิต | Status `PAID_HELD`, escrow ทำงาน | ☐ |
| C-04-2 | ดู `/account/purchases` | รายการซื้อ marketplace | ☐ |
| C-04-3 | เปิด `/account/purchases/[id]` | Tracking timeline | ☐ |
| C-04-4 | ยืนยันรับสินค้า | ปล่อยเงินให้ seller | ☐ |
| C-04-5 | ให้คะแนน seller (หลัง COMPLETED) | Review บันทึก | ☐ |
| C-04-6 | เปิดข้อพิพาท | Status DISPUTED | ☐ |
| C-04-7 | ดู `/account/shipments` | รวม shop + marketplace shipments | ☐ |

### C-05: Marketplace — Seller

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-05-1 | เปิด `/account/sell` | ฟอร์มลงขาย | ☐ |
| C-05-2 | Connect Stripe (หรือ demo onboard) | สถานะพร้อมขาย | ☐ |
| C-05-3 | สร้าง listing ใหม่ | แสดงใน My Listings | ☐ |
| C-05-4 | อัปเดต tracking ยอดขาย | Shipment อัปเดต | ☐ |
| C-05-5 | ขอถอนที่ `/account/withdraw` | คำขอ PENDING | ☐ |

### C-06: Wishlist & Collection

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-06-1 | Toggle wishlist บนสินค้า | บันทึกใน `/account/wishlist` | ☐ |
| C-06-2 | ลบจาก wishlist | รายการหาย | ☐ |
| C-06-3 | เปิด `/collection` | ดูคอลเลกชันส่วนตัว | ☐ |

### C-07: Notifications

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-07-1 | เปิด `/notifications` | รายการแจ้งเตือน | ☐ |
| C-07-2 | Mark read / mark all read | unread count ลด | ☐ |
| C-07-3 | Bell icon ใน header | badge แสดงจำนวน | ☐ |

### C-08: สิ่งที่ Customer ทำไม่ได้

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| C-08-1 | เปิด `/admin` | ถูก block (ไม่มีสิทธิ์) | ☐ |
| C-08-2 | ไม่เห็นลิงก์ Admin ใน account (mobile pills) | ไม่มีปุ่ม Admin | ☐ |

---

## Manager — ผู้จัดการร้าน

> ทุกอย่างของ Customer + เข้า Admin Panel ได้ (ยกเว้นเปลี่ยน role)

### M-01: เข้า Admin Panel

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-01-1 | Login เป็น manager | role แสดง manager | ☐ |
| M-01-2 | เปิด `/admin` | Sidebar layout (ไม่มี navbar หน้าร้าน) | ☐ |
| M-01-3 | Mobile: กด hamburger admin | Sidebar เปิด/ปิดได้ | ☐ |
| M-01-4 | กด "กลับหน้าร้าน" | กลับ `/` พร้อม navbar ปกติ | ☐ |

### M-02: Dashboard & Reports

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-02-1 | `/admin?tab=reports` | KPI cards แสดงครบ 8 รายการ | ☐ |
| M-02-2 | Responsive cards | 1 คอลัมน์ (มือถือ) → 4 คอลัมน์ (เดสก์ท็อป) | ☐ |

### M-03: Products (ร้านค้า)

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-03-1 | `/admin?tab=products` | ตารางสินค้า scroll ได้บนมือถือ | ☐ |
| M-03-2 | สร้าง product ใหม่ | บันทึกสำเร็จ | ☐ |
| M-03-3 | แก้ price/stock | อัปเดตใน DB | ☐ |
| M-03-4 | ลบ product | หายจากรายการ | ☐ |

### M-04: Listings & Catalog

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-04-1 | `/admin?tab=listings` | ดู active listings | ☐ |
| M-04-2 | Suspend listing | listing ถูกระงับ | ☐ |
| M-04-3 | `/admin?tab=catalog` | ดู taxonomy (read-only) | ☐ |

### M-05: Orders & Shipping

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-05-1 | `/admin?tab=shop-orders` | ดูออเดอร์ร้าน | ☐ |
| M-05-2 | อัปเดต tracking shop order | shipment อัปเดต | ☐ |
| M-05-3 | คืนเครดิต shop order (PAID) | refund สำเร็จ | ☐ |
| M-05-4 | `/admin?tab=marketplace-orders` | ดูออเดอร์ C2C | ☐ |
| M-05-5 | `/admin?tab=shipping` | คิวจัดส่งรวม | ☐ |
| M-05-6 | `/admin?tab=disputes` | ดูข้อพิพาท + refund buyer | ☐ |

### M-06: News

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-06-1 | `/admin?tab=news` | ดู draft queue | ☐ |
| M-06-2 | แก้ draft + Approve | เผยแพร่บน `/news` | ☐ |
| M-06-3 | สร้างข่าว manual | แสดงใน published | ☐ |
| M-06-4 | ลบข่าว | หายจากระบบ | ☐ |

### M-07: Wallet (Manager)

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-07-1 | `/admin?tab=wallet` | ดูยอดผู้ใช้ทั้งหมด | ☐ |
| M-07-2 | Grant credits ให้ user | ยอดเพิ่ม | ☐ |
| M-07-3 | อนุมัติคำขอถอน | status COMPLETED | ☐ |
| M-07-4 | ปฏิเสธคำขอถอน | status REJECTED | ☐ |

### M-08: Users (Manager — จำกัดสิทธิ์)

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-08-1 | `/admin?tab=users` | เห็นรายชื่อ user | ☐ |
| M-08-2 | Role column | **อ่านอย่างเดียว** ไม่มี dropdown | ☐ |

### M-09: Settings

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| M-09-1 | `/admin?tab=settings` | แก้ fee % และ escrow days | ☐ |
| M-09-2 | บันทึก settings | ค่าใหม่มีผล | ☐ |

---

## Admin — ผู้ดูแลระบบ

> ทุกอย่างของ Manager + **เปลี่ยน role ผู้ใช้ได้**

### A-01: สิทธิ์เฉพาะ Admin

| ID | Step | Expected | ✓ |
| --- | --- | --- | --- |
| A-01-1 | Login เป็น admin | role แสดง admin | ☐ |
| A-01-2 | `/admin?tab=users` | มี dropdown เปลี่ยน role | ☐ |
| A-01-3 | เปลี่ยน user เป็น manager | role อัปเดตใน DB | ☐ |
| A-01-4 | เปลี่ยน user กลับเป็น customer | role อัปเดต | ☐ |
| A-01-5 | Promote user เป็น admin | มีสิทธิ์ admin ครบ | ☐ |

### A-02: Regression (ทำซ้ำ Manager tests)

| ID | Scope | ✓ |
| --- | --- | --- |
| A-02-1 | M-02 ถึง M-09 ผ่านทั้งหมดในฐานะ admin | ☐ |

---

## Responsive UAT (ทุก Persona)

ทดสอบบน **Chrome DevTools** หรืออุปกรณ์จริง

| ID | หน้า | Mobile 375px | Tablet 768px | Desktop 1280px |
| --- | --- | --- | --- | --- |
| R-01 | `/` (Home) | Hero อ่านได้, ไม่ล้น | Grid สินค้า 2–3 คอลัมน์ | 4 คอลัมน์ |
| R-02 | Header หน้าร้าน | Hamburger menu ใช้งานได้ | Nav bar แสดง | Nav + actions ครบ |
| R-03 | `/shop`, `/marketplace` | Filter modal เปิดได้ | Grid ปกติ | Sidebar filter (ถ้ามี) |
| R-04 | Product detail | รูป + ปุ่มซื้อไม่ทับกัน | 2 คอลัมน์ | 2 คอลัมน์เต็ม |
| R-05 | `/cart` | Card layout | Table หรือ card | Table + summary ข้าง |
| R-06 | `/checkout` | ฟอร์มเต็มความกว้าง | 2 คอลัมน์ | 2 คอลัมน์ |
| R-07 | `/account/*` | Nav pills เลื่อนได้ | Sidebar บน / content ล่าง | Sidebar ซ้าย |
| R-08 | `/admin` | Sidebar drawer | Sidebar + content | Sidebar fixed |
| R-09 | Admin tables | Scroll แนวนอนได้ | Scroll ได้ | แสดงเต็ม |
| R-10 | Footer | 1 คอลัมน์ | 2 คอลัมน์ | 4 คอลัมน์ |

---

## Smoke Test แนะนำ

### Guest (5 นาที)
`/` → `/shop` → product → `/marketplace` → `/news`

### Customer (15 นาที)
Login → wallet top-up → shop checkout → track order → marketplace buy → confirm receipt → sell listing → withdraw

### Manager (10 นาที)
Admin reports → ship shop order → approve withdrawal → moderate listing → publish news

### Admin (5 นาที)
Manager flow + เปลี่ยน role ใน Users tab

---

## Sign-off Criteria

| เกณฑ์ | เป้าหมาย |
| --- | --- |
| Test cases ผ่าน (รวม Responsive) | ≥ 90% |
| ทุก Persona smoke test ผ่าน | ✅ |
| Mobile 375px ใช้งานหลักได้ครบ | ✅ |
| Admin แยก layout จากหน้าร้าน | ✅ |
| Credit + Escrow flow | ผ่านครบ |

---

## ฟีเจอร์นอกขอบเขต UAT (Known gaps)

| ฟีเจอร์ | สถานะ |
| --- | --- |
| Shop product reviews | ยังไม่มี |
| Stripe live payment | ใช้เครดิตใน Demo |
| Catalog taxonomy CRUD UI | ดูได้อย่างเดียว |
| Seller accept/reject offer UI | แจ้งเตือนแล้ว — UI จัดการ offer ยังไม่ครบ |

> **Workshop #7 UAT Report:** ดู [`UAT-Workshop7-Report.md`](./UAT-Workshop7-Report.md) — ผ่าน **100%** (28/28)

---

**ผู้ทดสอบ:** _______________  
**วันที่:** _______________  
**ลายเซ็นอนุมัติ:** _______________
