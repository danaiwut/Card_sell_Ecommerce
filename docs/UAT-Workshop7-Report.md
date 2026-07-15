# CardVerse — UAT Report (Workshop #7)

> **โครงงาน:** CardVerse — Full-stack Collectible-Card E-commerce Marketplace  
> **รายวิชา:** CSI204 ดิจิทัลแพลตฟอร์มสำหรับพัฒนาซอฟต์แวร์  
> **ประเภทการทดสอบ:** Manual User Acceptance Testing (UAT)  
> **วันที่ทดสอบ:** 15 กรกฎาคม 2026  
> **สภาพแวดล้อม:** Local dev — `pnpm dev` + Docker (Postgres / Redis)  
> **ผู้จัดทำ:** นายศิวากร แทนทรัพย์ · 67128056

---

## Executive Summary

| ตัวชี้วัด | ผลลัพธ์ |
| --- | --- |
| Test Cases ทั้งหมด | **28** |
| ผ่าน | **28** |
| ไม่ผ่าน | **0** |
| **อัตราการผ่าน** | **100%** ✅ |
| เป้าหมาย Sign-off | ≥ 90% |

ระบบ CardVerse ผ่านเกณฑ์ UAT ครบทุก Persona (Customer · Manager · Admin) หลังแก้ไข 3 ประเด็นที่พบในรอบทดสอบก่อนหน้า และ Regression ของ Admin ผ่านครบ

---

## Persona Overview

| Persona | คำอธิบาย | สิทธิ์หลัก |
| --- | --- | --- |
| **Customer** | ลูกค้าที่ login แล้ว ซื้อ/ขาย Shop + Marketplace | Wallet · Cart · Checkout · Escrow · Wishlist · ลงขาย |
| **Manager** | พนักงานร้าน เข้า Admin Panel | สินค้า · Orders · Listings · News · Withdrawals · Reports · Users (อ่านอย่างเดียว) |
| **Admin** | ผู้ดูแลระบบสูงสุด | สิทธิ์ Manager ทั้งหมด + **เปลี่ยน Role ผู้ใช้** |

---

## Customer — 12 Test Cases

| รหัส | รายการทดสอบ | สถานะ | หมายเหตุ |
| --- | --- | :---: | --- |
| **UAT-C01** | Login และดู Account Overview | ✅ ผ่าน | `/account` แสดง dashboard ครบ |
| **UAT-C02** | Demo Top-up ที่ `/account/wallet` | ✅ ผ่าน | ยอดเครดิตอัปเดตทันที |
| **UAT-C03** | Add to cart จาก `/shop/[slug]` | ✅ ผ่าน | Badge ตะกร้าอัปเดต |
| **UAT-C04** | ปรับ qty / ลบสินค้าใน `/cart` | ✅ ผ่าน | ยอดคำนวณถูกต้อง |
| **UAT-C05** | ใส่คูปอง `WELCOME10` ตอน Checkout | ✅ ผ่าน | ส่วนลด 10% |
| **UAT-C06** | Checkout ชำระเครดิต — กดยืนยันซ้ำ (Negative) | ✅ ผ่าน | มี row lock + ล้างตะกร้าทันที ไม่ตัดเงินซ้ำ |
| **UAT-C07** | ดูประวัติคำสั่งซื้อ `/account/orders` | ✅ ผ่าน | สถานะ + tracking |
| **UAT-C08** | ซื้อ Marketplace ด้วยเครดิต (Escrow) | ✅ ผ่าน | Status `PAID_HELD` |
| **UAT-C09** | ยืนยันรับสินค้า (Release Escrow) | ✅ ผ่าน | เงินปล่อยให้ seller |
| **UAT-C10** | กด **Make an Offer** บน Marketplace | ✅ ผ่าน | Modal ฟอร์มเสนอราคา + แจ้งเตือนผู้ขาย |
| **UAT-C11** | ลงขายใหม่ที่ `/account/sell` | ✅ ผ่าน | Listing สร้างสำเร็จ |
| **UAT-C12** | เพิ่ม / ลบ Wishlist | ✅ ผ่าน | Sync กับ `/account/wishlist` |

**Customer Pass Rate: 12/12 (100%)**

---

## Manager — 10 Test Cases

| รหัส | รายการทดสอบ | สถานะ | หมายเหตุ |
| --- | --- | :---: | --- |
| **UAT-M01** | Login Manager → Admin Panel | ✅ ผ่าน | `/admin` layout แยกจากหน้าร้าน |
| **UAT-M02** | Dashboard Reports (KPI 8 รายการ) | ✅ ผ่าน | `/admin?tab=reports` |
| **UAT-M03** | เพิ่ม / แก้ไขราคาและสต๊อกสินค้า | ✅ ผ่าน | CRUD products |
| **UAT-M04** | Suspend Listing ที่ผิดกฎ | ✅ ผ่าน | Listing ถูกระงับ |
| **UAT-M05** | อัปเดต Carrier / Tracking | ✅ ผ่าน | Shipment timeline อัปเดต |
| **UAT-M06** | อนุมัติคำขอถอนเครดิต | ✅ ผ่าน | Status → COMPLETED |
| **UAT-M07** | จัดการ Draft ข่าว + Approve | ✅ ผ่าน | เผยแพร่บน `/news` |
| **UAT-M08** | ดู Users (ไม่มีสิทธิ์เปลี่ยน Role) | ✅ ผ่าน | Role เป็น read-only |
| **UAT-M09** | ค้นหา / กรอง Users เมื่อข้อมูลเยอะ | ✅ ผ่าน | ช่องค้นหา + filter role + pagination |
| **UAT-M10** | แก้ Fee % และ Escrow Auto-release Days | ✅ ผ่าน | Settings บันทึกได้ |

**Manager Pass Rate: 10/10 (100%)**

---

## Admin — 6 Test Cases

| รหัส | รายการทดสอบ | สถานะ | หมายเหตุ |
| --- | --- | :---: | --- |
| **UAT-A01** | Login Admin → Admin Panel | ✅ ผ่าน | เข้าถึงครบทุกแท็บ |
| **UAT-A02** | Dropdown เปลี่ยน Role ครบ 3 ระดับ | ✅ ผ่าน | customer / manager / admin |
| **UAT-A03** | เปลี่ยน Role customer → manager | ✅ ผ่าน | DB อัปเดต |
| **UAT-A04** | เปลี่ยน Role manager → customer | ✅ ผ่าน | สิทธิ์ถูกจำกัด |
| **UAT-A05** | Promote user เป็น admin | ✅ ผ่าน | เข้า Admin Panel ได้ |
| **UAT-A06** | Regression UAT-M02 ถึง M10 ในฐานะ Admin | ✅ ผ่าน | รวม M09 search ใช้งานได้ |

**Admin Pass Rate: 6/6 (100%)**

---

## สรุปผลรวม

```
┌─────────────┬───────┬─────────┬───────┐
│ Persona     │ ผ่าน  │ ไม่ผ่าน │ รวม   │
├─────────────┼───────┼─────────┼───────┤
│ Customer    │  12   │    0    │  12   │
│ Manager     │  10   │    0    │  10   │
│ Admin       │   6   │    0    │   6   │
├─────────────┼───────┼─────────┼───────┤
│ รวม         │  28   │    0    │  28   │
└─────────────┴───────┴─────────┴───────┘

อัตราการผ่าน: 100%  (เป้าหมาย ≥ 90% ✅)
```

---

## ปัญหาที่พบและแก้ไขแล้ว (Resolved Issues)

| Issue | Test Case | ปัญหาเดิม | การแก้ไข | สถานะ |
| --- | --- | --- | --- | :---: |
| **ISS-001** | UAT-C06 | กดชำระเงินซ้ำอาจตัดเครดิตหลายรอบ | Transaction + `FOR UPDATE` lock บน Cart, ล้าง cart items ก่อนสร้าง order; ปุ่ม frontend lock ระหว่าง processing | ✅ |
| **ISS-002** | UAT-C10 | ปุ่ม Make an Offer เป็นแค่ลิงก์ | Modal ฟอร์มเสนอราคา + API `POST /marketplace/listings/:id/offers` + แจ้งเตือนผู้ขาย | ✅ |
| **ISS-003** | UAT-M09, A06 | ไม่มีช่องค้นหา Users | Search by ชื่อ/อีเมล, filter role, pagination 15 รายการ/หน้า | ✅ |

---

## ขั้นตอนทดสอบที่สำคัญ (Re-test Scenarios)

### UAT-C06 — Double-submit Checkout

1. Login เป็น `customer@cardverse.demo`
2. เติมเครดิต → Add to cart → Checkout
3. หน้า Payment กด **ชำระเครดิต** อย่างรวดเร็ว 3–5 ครั้ง
4. **Expected:** สร้าง order เพียง 1 รายการ, ตัดเครดิตครั้งเดียว, redirect ไป order detail

### UAT-C10 — Make an Offer

1. เปิด `/marketplace/[catalogItemId]?listing=...`
2. กด **Make an Offer**
3. กรอกราคาต่ำกว่าราคาปิดการขาย + ข้อความ (optional)
4. **Expected:** แสดง success, seller ได้รับ notification

### UAT-M09 — Users Search

1. Login เป็น Manager → `/admin?tab=users`
2. พิมพ์ค้นหาชื่อหรืออีเมล, เลือก filter role
3. **Expected:** ตารางกรองทันที, แบ่งหน้าเมื่อข้อมูลเกิน 15 รายการ

---

## Sign-off

| รายการ | สถานะ |
| --- | --- |
| UAT Pass Rate ≥ 90% | ✅ 100% |
| Smoke test ทุก Persona | ✅ |
| Credit + Escrow flow | ✅ |
| Mobile 375px ใช้งานหลักได้ | ✅ |
| Admin layout แยกจากหน้าร้าน | ✅ |

**ผู้ทดสอบ:** นายศิวากร แทนทรัพย์  
**วันที่:** 15 กรกฎาคม 2026  
**ลายเซ็นอนุมัติ:** _________________________

---

## หมายเหตุสำหรับ Developer

หลัง pull โค้ดชุดนี้ ให้รัน migration สำหรับตาราง `ListingOffer`:

```bash
pnpm --filter @cardverse/db push
pnpm --filter @cardverse/db generate
```
