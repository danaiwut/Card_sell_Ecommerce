# CardVerse — คู่มือรันเว็บในเครื่อง (Local)

เอกสารนี้อธิบายวิธีรัน CardVerse บนเครื่องตัวเอง **แบบเดียวกับที่ใช้งานได้จริง** ในโปรเจกต์นี้  
Repository: [https://github.com/danaiwut/Card_sell_Ecommerce](https://github.com/danaiwut/Card_sell_Ecommerce)

---

## สิ่งที่ต้องมีก่อนเริ่ม

| โปรแกรม | เวอร์ชันที่แนะนำ | ใช้ทำอะไร |
|---|---|---|
| **Node.js** | 20 ขึ้นไป | รัน Next.js, NestJS, worker |
| **pnpm** | 10.x | จัดการ monorepo |
| **Docker Desktop** | ล่าสุด | รัน PostgreSQL + Redis ในเครื่อง |

ตรวจสอบว่าติดตั้งแล้ว:

```bash
node -v    # ควรได้ v20 ขึ้นไป
pnpm -v
docker compose version
```

> บน macOS ถ้า terminal หา `docker` ไม่เจอ ให้เปิด **Docker Desktop** ก่อน แล้วลองใหม่

---

## โครงสร้างที่รันขึ้นมา

เมื่อรันครบแล้ว จะมี service ดังนี้:

| Service | Port | URL |
|---|---|---|
| **เว็บ (Next.js)** | 3000 | http://localhost:3000 |
| **API (NestJS)** | 4000 | http://localhost:4000 (ใช้ภายใน) |
| **PostgreSQL** | 5432 | `localhost:5432` |
| **Redis** | 6379 | `localhost:6379` |
| **Worker (BullMQ)** | — | รันเบื้องหลัง ไม่ต้องเปิดเบราว์เซอร์ |

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

### 3) เปิด PostgreSQL + Redis ด้วย Docker

```bash
docker compose up -d
```

ตรวจว่า container ขึ้นแล้ว:

```bash
docker compose ps
```

ควรเห็นประมาณนี้:

| Container | Port | Status |
|---|---|---|
| `ecom-postgres-1` | 5432 | Up (healthy) |
| `ecom-redis-1` | 6379 | Up |

### 4) สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

ค่า default ใน `.env.example` ใช้กับ Docker ด้านบนได้เลย **ไม่ต้องใส่ Clerk/Stripe key** ก็รันได้ (โหมด demo)

> ไฟล์ `.env` จะไม่ถูก push ขึ้น GitHub (อยู่ใน `.gitignore`)

### 5) เตรียมฐานข้อมูล

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

- `db:generate` — สร้าง Prisma Client
- `db:push` — สร้างตารางใน PostgreSQL
- `db:seed` — ใส่ข้อมูล demo (20 หมวดหมู่, สินค้า, marketplace, trades)

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

สำหรับรันครั้งแรกทั้งหมด (หลัง `pnpm install` และ `docker compose up -d` แล้ว):

```bash
cp .env.example .env
pnpm db:generate
pnpm db:push
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
# 1) เปิด Docker containers (ถ้ายังไม่ up)
docker compose up -d

# 2) สตาร์ท dev server
pnpm dev
```

แล้วเปิด http://localhost:3000

> ไม่ต้อง `db:seed` ซ้ำทุกครั้ง ยกเว้นต้องการ reset ข้อมูล

---

## หยุด / ปิดระบบ

```bash
# หยุด dev server: กด Ctrl+C ใน terminal ที่รัน pnpm dev

# หยุด Docker containers
docker compose down
```

---

## แก้ปัญหาที่พบบ่อย

### เบราว์เซอร์ขึ้น `ERR_CONNECTION_REFUSED`

**สาเหตุ:** ยังไม่ได้รัน `pnpm dev` หรือปิด terminal ไปแล้ว

**แก้:** รัน `pnpm dev` แล้วรอจน web + api ขึ้นครบ จากนั้น refresh หน้า http://localhost:3000

> **ไม่เกี่ยวกับ** Clerk/Stripe key — error นี้หมายถึงไม่มี server ฟังที่ port 3000

---

### `pnpm db:push` ขึ้น `Environment variable not found: DATABASE_URL`

**สาเหตุ:** ยังไม่มีไฟล์ `.env`

**แก้:**

```bash
cp .env.example .env
pnpm db:push
```

---

### API ไม่ต่อ DB (`P1001 Can't reach database server`)

**สาเหตุ:** Docker Postgres ยังไม่ up

**แก้:**

```bash
docker compose up -d
docker compose ps    # ตรวจว่า postgres healthy
pnpm dev
```

---

### Port 3000 ถูกใช้อยู่แล้ว

**แก้:** หา process ที่ใช้ port 3000 แล้วปิด หรือ kill process นั้น

```bash
lsof -i :3000
```

---

### หน้าเว็บขึ้นแต่ข้อมูลไม่โหลด / API error

ตรวจว่า terminal ที่รัน `pnpm dev` มีทั้ง 3 ตัว:

- `@cardverse/web:dev`
- `@cardverse/api:dev`
- `@cardverse/worker:dev`

ถ้า API crash ให้ดู error ใน terminal แล้วตรวจว่า Postgres + Redis ยัง up อยู่

---

## Port และ Environment สำคัญ

ค่าหลักใน `.env` (จาก `.env.example`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cardverse?schema=public"
REDIS_URL="redis://localhost:6379"

API_PORT=4000
API_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"

NEXT_PUBLIC_API_URL="http://localhost:3000/backend"
NEXT_PUBLIC_WS_URL="http://localhost:3000"
```

| ตัวแปร | ความหมาย |
|---|---|
| `DATABASE_URL` | เชื่อม PostgreSQL ใน Docker |
| `REDIS_URL` | เชื่อม Redis ใน Docker |
| `NEXT_PUBLIC_API_URL` | URL ที่ frontend เรียก API (ผ่าน Next.js proxy) |
| `NEXT_PUBLIC_WS_URL` | Socket.IO สำหรับ live recent-sales feed |
| `CLERK_*`, `STRIPE_*` | ว่างไว้ได้ในโหมด demo |

---

## คำสั่งอื่นที่มีประโยชน์

```bash
pnpm db:studio      # เปิด Prisma Studio ดู/แก้ข้อมูลใน DB
pnpm typecheck      # ตรวจ TypeScript ทั้ง monorepo
pnpm build          # build production
pnpm lint           # lint ทุก package
```

---

## โครงสร้างโปรเจกต์ (สรุป)

```
apps/
  web/       Next.js 15 — หน้าเว็บ (port 3000)
  api/       NestJS — REST + Socket.IO (port 4000)
  worker/    BullMQ — งานเบื้องหลัง (escrow, notifications)
packages/
  db/        Prisma schema + seed
  shared/    types, enums, taxonomy 20 หมวด
docker-compose.yml   PostgreSQL + Redis
.env.example         ตัวอย่าง env (copy เป็น .env)
```

---

## สรุปสั้น ๆ

1. `docker compose up -d` — เปิด DB
2. `cp .env.example .env` — ตั้งค่า env
3. `pnpm db:generate && pnpm db:push && pnpm db:seed` — เตรียมข้อมูล (ครั้งแรก)
4. `pnpm dev` — รันเว็บ (**เปิดทิ้งไว้**)
5. เปิด **http://localhost:3000**

ไม่ต้องใส่ Clerk/Stripe key ก็ใช้งาน demo ได้ครบ flow หลัก
