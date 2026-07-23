# CardVerse — คู่มือรันเว็บในเครื่อง (Local)

เอกสารนี้อธิบายวิธีรัน CardVerse บนเครื่องตัวเอง **แบบเดียวกับที่ใช้งานได้จริง** ในโปรเจกต์นี้  
Repository: [https://github.com/danaiwut/Card_sell_Ecommerce](https://github.com/danaiwut/Card_sell_Ecommerce)

---

## สิ่งที่ต้องมีก่อนเริ่ม

| โปรแกรม | เวอร์ชันที่แนะนำ | ใช้ทำอะไร |
|---|---|---|
| **Node.js** | 20 ขึ้นไป | รัน Next.js, NestJS, worker |
| **pnpm** | 10.x | จัดการ monorepo |
| **Docker Desktop** | ล่าสุด (optional) | รัน Redis สำหรับ worker queue |

ตรวจสอบว่าติดตั้งแล้ว:

```bash
node -v    # ควรได้ v20 ขึ้นไป
pnpm -v
docker compose version   # optional
```

> บน macOS ถ้า terminal หา `docker` ไม่เจอ ให้เปิด **Docker Desktop** ก่อน แล้วลองใหม่

---

## โครงสร้างที่รันขึ้นมา

เมื่อรันครบแล้ว จะมี service ดังนี้:

| Service | Port | URL |
|---|---|---|
| **เว็บ (Next.js)** | 3000 | http://localhost:3000 |
| **API (NestJS)** | 4000 | http://localhost:4000 (ใช้ภายใน) |
| **Redis** | 6379 | `localhost:6379` (optional) |
| **Worker (BullMQ)** | — | รันเบื้องหลัง ไม่ต้องเปิดเบราว์เซอร์ |

**ข้อมูลทั้งหมด** เก็บในไฟล์ JSON ที่ `data/*.json` และรูปสินค้าที่ `data/uploads/` — **ไม่ต้องใช้ PostgreSQL หรือ Supabase**

เบราว์เซอร์เปิดแค่ **http://localhost:3000**  
Next.js จะ proxy คำขอ API ไปที่ NestJS ให้อัตโนมัติ (`/backend/*`, `/socket.io/*`)

---

## ขั้นตอนรันครั้งแรก (ทำตามลำดับ)

### 1) Clone โปรเจกต์

```bash
git clone https://github.com/danaiwut/Card_sell_Ecommerce.git
cd Card_sell_Ecommerce
```

### 2) ติดตั้ง dependencies

```bash
pnpm install
```

### 3) เปิด Redis ด้วย Docker (optional)

```bash
docker compose up -d
```

ตรวจว่า container ขึ้นแล้ว:

```bash
docker compose ps
```

ควรเห็น `ecom-redis-1` ที่ port 6379 (ถ้าไม่ใช้ worker ข้ามขั้นตอนนี้ได้)

### 4) สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

ค่า default ใน `.env.example` ใช้กับ local JSON storage ได้เลย **ไม่ต้องใส่ Clerk/Stripe key** ก็รันได้ (โหมด demo)

> ไฟล์ `.env` จะไม่ถูก push ขึ้น GitHub (อยู่ใน `.gitignore`)

### 5) เตรียมไฟล์ JSON

```bash
pnpm db:seed
```

- สร้างข้อมูล demo: หมวดหมู่, สินค้าร้าน, catalog, คูปอง, ข่าว
- **ไม่แตะ `users.json`** — ลงทะเบียน/sign-in แล้วระบบจะ sync user เอง
- ข้อมูลที่ผูก user (cart, wallet, listing, order) ว่างไว้ให้สร้างตอนใช้งาน

### 6) สตาร์ท dev server

```bash
pnpm dev
```

**คำสั่งนี้ต้องเปิดทิ้งไว้ใน terminal** — อย่าปิดจนกว่าจะเลิกใช้งาน

รอจนเห็นข้อความประมาณ:

```
@cardverse/api:dev: CardVerse API listening on http://localhost:4000
@cardverse/web:dev:  ✓ Ready ...
```

### 7) เปิดเว็บ

เปิดเบราว์เซอร์ไปที่:

**http://localhost:3000**

---

## คำสั่งรวม (copy วางได้เลย)

สำหรับรันครั้งแรกทั้งหมด:

```bash
cp .env.example .env
pnpm db:seed
pnpm dev
```

ถ้าต้องการ worker queue:

```bash
docker compose up -d
cp .env.example .env
pnpm db:seed
pnpm dev
```

---

## วิธี login / ทดสอบ (ไม่ต้องมี API key)

CardVerse รัน **Demo mode** ได้ทันทีเมื่อ `CLERK_*` และ `STRIPE_*` ว่างอยู่

1. เปิด http://localhost:3000/account
2. เลือก role: `customer`, `manager`, หรือ `admin`
3. กด Sign in (dev session)

จากนั้นลองได้:

| หน้า | URL | ทำอะไรได้ |
|---|---|---|
| หน้าแรก | `/` | ดู hero, หมวดหมู่ |
| ร้านค้า | `/shop` | ซื้อสินค้าจากร้าน CardVerse |
| Marketplace | `/marketplace` | ดู listing, กราฟราคา, recent sales |
| คอลเลกชัน | `/collection` | การ์ดของฉัน, wishlist |
| ขายของ | `/account/sell` | ลง listing, อัปเดต tracking |
| Admin | `/admin` | จัดการสินค้า (ต้อง login เป็น manager/admin) |

การชำระเงินและ Stripe Connect จะเป็น **mock** — ทดสอบ flow escrow + จัดส่งได้ครบ

---

## รันครั้งถัดไป (เปิดเครื่องใหม่)

```bash
pnpm dev
```

ถ้าใช้ worker:

```bash
docker compose up -d
pnpm dev
```

แล้วเปิด http://localhost:3000

---

## หยุด / ปิดระบบ

```bash
# หยุด dev server: กด Ctrl+C ใน terminal ที่รัน pnpm dev

# หยุด Docker containers (ถ้าเปิดไว้)
docker compose down
```

---

## แก้ปัญหาที่พบบ่อย

### เบราว์เซอร์ขึ้น `ERR_CONNECTION_REFUSED`

**สาเหตุ:** ยังไม่ได้รัน `pnpm dev` หรือปิด terminal ไปแล้ว

**แก้:** รัน `pnpm dev` แล้วรอจน web + api ขึ้นครบ จากนั้น refresh หน้า http://localhost:3000

---

### ข้อมูลไม่โหลด / ไฟล์ JSON หาย

**สาเหตุ:** ยังไม่ bootstrap หรือลบโฟลเดอร์ `data/` ไป

**แก้:**

```bash
pnpm db:seed
pnpm dev
```

---

### Port 3000 ถูกใช้อยู่แล้ว

**แก้:** หา process ที่ใช้ port 3000 แล้วปิด

```bash
lsof -i :3000
```

---

### หน้าเว็บขึ้นแต่ข้อมูลไม่โหลด / API error

ตรวจว่า terminal ที่รัน `pnpm dev` มีทั้ง 3 ตัว:

- `@cardverse/web:dev`
- `@cardverse/api:dev`
- `@cardverse/worker:dev`

ถ้า API crash ให้ดู error ใน terminal

---

## Port และ Environment สำคัญ

ค่าหลักใน `.env` (จาก `.env.example`):

```env
CARDVERSE_DATA_DIR="./data"
LOCAL_UPLOAD_DIR="./data/uploads"
REDIS_URL="redis://localhost:6379"

API_PORT=4000
API_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"

NEXT_PUBLIC_API_URL="http://localhost:3000/backend"
NEXT_PUBLIC_WS_URL="http://localhost:3000"
```

| ตัวแปร | ความหมาย |
|---|---|
| `CARDVERSE_DATA_DIR` | โฟลเดอร์เก็บ JSON (`data/*.json`) |
| `LOCAL_UPLOAD_DIR` | โฟลเดอร์เก็บรูปที่อัปโหลด |
| `REDIS_URL` | เชื่อม Redis ใน Docker (optional) |
| `NEXT_PUBLIC_API_URL` | URL ที่ frontend เรียก API (ผ่าน Next.js proxy) |
| `NEXT_PUBLIC_WS_URL` | Socket.IO สำหรับ live recent-sales feed |
| `CLERK_*`, `STRIPE_*` | ว่างไว้ได้ในโหมด demo |

---

## คำสั่งอื่นที่มีประโยชน์

```bash
pnpm db:seed   # สร้างข้อมูล demo ใน data/ (ยกเว้น users)
pnpm typecheck      # ตรวจ TypeScript ทั้ง monorepo
pnpm build          # build production
pnpm lint           # lint ทุก package
```

ดู/แก้ข้อมูล: เปิดไฟล์ใน `data/*.json` โดยตรง (เช่น `data/users.json`, `data/products.json`)

---

## โครงสร้างโปรเจกต์ (สรุป)

```
apps/
  web/       Next.js 15 — หน้าเว็บ (port 3000)
  api/       NestJS — REST + Socket.IO (port 4000)
  worker/    BullMQ — งานเบื้องหลัง (escrow, notifications)
packages/
  db/        JsonClient + bootstrap
  shared/    types, enums, taxonomy 20 หมวด
data/        JSON data store (users, orders, listings, …)
data/uploads/  รูปสินค้า
docker-compose.yml   Redis (optional)
.env.example         ตัวอย่าง env (copy เป็น .env)
```

---

## สรุปสั้น ๆ

1. `cp .env.example .env` — ตั้งค่า env
2. `pnpm db:seed` — เตรียมข้อมูล demo ใน `data/` (ยกเว้น users)
3. `docker compose up -d` — เปิด Redis (optional สำหรับ worker)
4. `pnpm dev` — รันเว็บ (**เปิดทิ้งไว้**)
5. เปิด **http://localhost:3000**

ข้อมูลทั้งหมดเก็บใน **`data/*.json`** ที่ root โปรเจกต์ — ไม่ต้องใช้ PostgreSQL/Supabase

ไม่ต้องใส่ Clerk/Stripe key ก็ใช้งาน demo ได้ครบ flow หลัก
