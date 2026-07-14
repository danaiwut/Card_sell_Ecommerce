import { PrismaClient, Prisma } from "@prisma/client";
import { CATALOG_TAXONOMY } from "@cardverse/shared";

const prisma = new PrismaClient();

// ─── Image helpers ─────────────────────────────────────────────────────────────
const localImg = (filename: string) => `/images/${filename}`;

const baht = (n: number) => Math.round(n * 100);

interface DemoCard {
  name: string;
  category: string;
  subcategory?: string;
  rarity: "C" | "UC" | "R" | "SR" | "SSR" | "UR" | "SECRET" | "PROMO";
  set: string;
  cardNumber?: string;
  basePrice: number;
  type: "BOOSTER_BOX" | "DECK" | "SINGLE_CARD" | "ACCESSORY";
  imageUrl: string;
  stock?: number;
  flags?: Partial<{ trending: boolean; newArrival: boolean; preOrder: boolean; featured: boolean }>;
}

// ══════════════════════════════════════════════════════════════════════════════
// DIVERSE PRODUCT LIST (ลดความซ้ำซ้อนของการ์ดประเภทเดียวกัน เพิ่มความหลากหลาย)
// ══════════════════════════════════════════════════════════════════════════════
const DEMO_CARDS: DemoCard[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // ONE PIECE TCG
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "One Piece Card Game OP-13 Carrying on His Will Booster Box (เซ็ตใหม่ล่าสุด!)",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SR", set: "OP-13 Carrying on His Will",
    basePrice: 1990, type: "BOOSTER_BOX",
    imageUrl: localImg("box-op13.png"),
    flags: { trending: true, newArrival: true },
  },
  {
    name: "One Piece Card Game OP-09 Emperors in the New World Booster Box",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SR", set: "OP-09 Emperors in the New World",
    basePrice: 1890, type: "BOOSTER_BOX",
    imageUrl: localImg("box-op09.webp"),
    flags: { featured: true },
  },
  {
    name: "One Piece Card Game OP-01 Romance Dawn Booster Box (ระดับตำนาน)",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SR", set: "OP-01 Romance Dawn",
    basePrice: 3490, type: "BOOSTER_BOX",
    imageUrl: localImg("box-op01.webp"),
    stock: 4,
  },
  {
    name: "One Piece Card Game ST-10 Ultra Deck Three Captains",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "R", set: "ST-10 Ultra Deck",
    basePrice: 699, type: "DECK",
    imageUrl: localImg("deck-st10.webp"),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NARUTO KAYOU
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Naruto Kayou Tier 4 Wave 1 Booster Box (กล่องพรีเมี่ยมสุดแรร์)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SSR", set: "Naruto Kayou T4W1",
    basePrice: 1490, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-box-4.jpg"),
    flags: { trending: true, newArrival: true },
  },
  {
    name: "Naruto Kayou Tier 3 Wave 1 Booster Box (กล่องเหล็กต่อสู้)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SSR", set: "Naruto Kayou T3W1",
    basePrice: 1290, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-box-3.jpg"),
    flags: { featured: true },
  },
  {
    name: "Naruto Kayou Heaven Scroll English Booster Box",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SR", set: "Naruto Kayou Heaven Scroll EN",
    basePrice: 1290, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-kayou-box.png"),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SPORTS CARDS (บาส, บอล, เบสบอล, บอลโลก 2026 รูปจริง)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Panini FIFA World Cup 2026 Official Football Ultra Box (การ์ดฟุตบอลโลก 2026)",
    category: "sports-cards", subcategory: "football",
    rarity: "SR", set: "Panini World Cup 2026",
    basePrice: 3200, type: "BOOSTER_BOX",
    imageUrl: localImg("sports-fifa-2026-box.png"),
    flags: { trending: true, newArrival: true, featured: true },
  },
  {
    name: "2024 Panini Prizm Basketball Blaster Box (บาสเกตบอล)",
    category: "sports-cards", subcategory: "nba",
    rarity: "SR", set: "Panini Prizm NBA 2024",
    basePrice: 2990, type: "BOOSTER_BOX",
    imageUrl: localImg("sports-nba-box.png"),
    flags: { trending: true },
  },
  {
    name: "2024 Topps Chrome Baseball Blaster Box (เบสบอล)",
    category: "sports-cards", subcategory: "mlb",
    rarity: "R", set: "Topps Chrome MLB 2024",
    basePrice: 2290, type: "BOOSTER_BOX",
    imageUrl: localImg("sports-mlb-box.png"),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // POKÉMON TCG
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Pokémon TCG Scarlet & Violet Obsidian Flames Booster Box",
    category: "tcg", subcategory: "pokemon-tcg",
    rarity: "SR", set: "Scarlet & Violet Obsidian Flames",
    basePrice: 3290, type: "BOOSTER_BOX",
    imageUrl: localImg("pokemon-obsidian-flames-logo.png"),
    flags: { trending: true },
  },
  {
    name: "Pokémon TCG Crown Zenith Elite Trainer Box",
    category: "tcg", subcategory: "pokemon-tcg",
    rarity: "SR", set: "Crown Zenith",
    basePrice: 2490, type: "BOOSTER_BOX",
    imageUrl: localImg("pokemon-crown-zenith-logo.png"),
    flags: { featured: true },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // YU-GI-OH!
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Yu-Gi-Oh! 25th Anniversary Rarity Collection Booster Box",
    category: "tcg", subcategory: "yu-gi-oh",
    rarity: "SR", set: "25th Anniversary Rarity Collection",
    basePrice: 3590, type: "BOOSTER_BOX",
    imageUrl: localImg("ygo-dark-magician.jpg"),
    flags: { trending: true },
  },
  {
    name: "Yu-Gi-Oh! Phantom Nightmare Booster Box",
    category: "tcg", subcategory: "yu-gi-oh",
    rarity: "R", set: "Phantom Nightmare",
    basePrice: 1390, type: "BOOSTER_BOX",
    imageUrl: localImg("ygo-blue-eyes.jpg"),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MARKETPLACE RARE SINGLES (หลากหลายขึ้น ไม่มีการ์ดซ้ำหมวดหมู่)
  // ══════════════════════════════════════════════════════════════════════════

  // ONE PIECE
  {
    name: "Monkey D. Luffy OP13-118 SEC Super Parallel (เซ็ตใหม่ Carrying on His Will)",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SECRET", set: "OP-13 Carrying on His Will",
    cardNumber: "OP13-118",
    basePrice: 39000, type: "SINGLE_CARD",
    imageUrl: localImg("op13-luffy-sec.jpg"),
    stock: 1,
    flags: { featured: true, newArrival: true },
  },
  {
    name: "Gol D. Roger OP09-118 Gold Super Parallel Secret Rare",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SECRET", set: "OP-09 Emperors in the New World",
    cardNumber: "OP09-118",
    basePrice: 45000, type: "SINGLE_CARD",
    imageUrl: localImg("OP09-118.webp"),
    stock: 1,
    flags: { featured: true },
  },
  {
    name: "Monkey D. Luffy OP09-119 Manga Super Parallel Secret Rare",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SECRET", set: "OP-09 Emperors in the New World",
    cardNumber: "OP09-119",
    basePrice: 38000, type: "SINGLE_CARD",
    imageUrl: localImg("op09-luffy-sec.webp"),
    stock: 1,
  },

  // NARUTO KAYOU
  {
    name: "Naruto Uzumaki NRSA-PR-002 Select Edition Special PR Card (ลายเส้นสุดอาร์ต)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SECRET", set: "Naruto Kayou Select Edition",
    cardNumber: "NRSA-PR-002",
    basePrice: 19500, type: "SINGLE_CARD",
    imageUrl: localImg("naruto-card-pr.jpg"),
    stock: 1,
    flags: { featured: true, newArrival: true },
  },
  {
    name: "Naruto Uzumaki Crystal Rare NRB08-CR-001 (การ์ดแรร์นารูโตะทอง)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SECRET", set: "Naruto Kayou T4W1",
    cardNumber: "NRB08-CR-001",
    basePrice: 25000, type: "SINGLE_CARD",
    imageUrl: localImg("naruto-card-ssr.png"),
    stock: 1,
  },

  // POKÉMON
  {
    name: "Pikachu ex 173/123 SAR (การ์ดพิคาชูหนึ่งแสนโวลต์ เวอร์ชันภาษาไทย)",
    category: "tcg", subcategory: "pokemon-tcg",
    rarity: "SECRET", set: "Stellar Miracle (Thai)",
    cardNumber: "SV6s-173",
    basePrice: 19500, type: "SINGLE_CARD",
    imageUrl: localImg("pokemon-pikachu-ex-sar-th.png"),
    stock: 1,
    flags: { featured: true, newArrival: true },
  },
  {
    name: "Charizard ex 223/197 Special Illustration Rare Obsidian Flames",
    category: "tcg", subcategory: "pokemon-tcg",
    rarity: "SR", set: "Scarlet & Violet Obsidian Flames",
    cardNumber: "SV3-223",
    basePrice: 25000, type: "SINGLE_CARD",
    imageUrl: localImg("charizard-ex.jpg"),
    stock: 1,
    flags: { featured: true },
  },
  {
    name: "Umbreon VMAX 215/203 Alternate Art Secret Rare Evolving Skies",
    category: "tcg", subcategory: "pokemon-tcg",
    rarity: "SECRET", set: "Evolving Skies",
    cardNumber: "SWSH7-215",
    basePrice: 22000, type: "SINGLE_CARD",
    imageUrl: localImg("pokemon-umbreon-vmax-215.png"),
    stock: 1,
  },

  // YU-GI-OH!
  {
    name: "Dark Magician TEN-EN012 Yugi's Legend Ultra Rare",
    category: "tcg", subcategory: "yu-gi-oh",
    rarity: "UR", set: "25th Anniversary Rarity Collection",
    cardNumber: "TEN-EN012",
    basePrice: 8900, type: "SINGLE_CARD",
    imageUrl: localImg("ygo-dark-magician.jpg"),
    stock: 2,
    flags: { trending: true },
  },
  {
    name: "Exodia the Forbidden One LOB-EN124 Ultra Rare 1st Edition",
    category: "tcg", subcategory: "yu-gi-oh",
    rarity: "UR", set: "Legend of Blue-Eyes White Dragon",
    cardNumber: "LOB-EN124",
    basePrice: 9800, type: "SINGLE_CARD",
    imageUrl: localImg("ygo-exodia.jpg"),
    stock: 1,
    flags: { featured: true },
  },
];

// ─── Taxonomy ───────────────────────────────────────────────────────────────────
async function seedTaxonomy() {
  console.log("Seeding taxonomy...");
  const ACTIVE_CATEGORIES = CATALOG_TAXONOMY.filter(c => 
    ["sports-cards", "anime-manga", "tcg"].includes(c.slug)
  );

  for (let i = 0; i < ACTIVE_CATEGORIES.length; i++) {
    const c = ACTIVE_CATEGORIES[i];
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameTh: c.nameTh, emoji: c.emoji, note: c.note, sortOrder: i },
      create: { slug: c.slug, name: c.name, nameTh: c.nameTh, emoji: c.emoji, note: c.note, sortOrder: i },
    });
    for (const sub of c.subcategories) {
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: sub.slug } },
        update: { name: sub.name },
        create: { categoryId: category.id, slug: sub.slug, name: sub.name },
      });
    }
    for (const brandName of c.brands ?? []) {
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await prisma.brand.upsert({
        where: { slug },
        update: { name: brandName, categoryId: category.id },
        create: { slug, name: brandName, categoryId: category.id },
      });
    }
  }
}

// ─── Clean existing seeded data ─────────────────────────────────────────────────
async function cleanSeedData() {
  console.log("Cleaning previous seed data...");
  await prisma.trade.deleteMany({});
  await prisma.marketplaceOrder.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.catalogItem.deleteMany({});
  await prisma.cardSet.deleteMany({});
}

// ─── Catalog + Products ─────────────────────────────────────────────────────────
async function seedCatalogAndProducts() {
  console.log(`Seeding ${DEMO_CARDS.length} catalog items + store products...`);
  for (const card of DEMO_CARDS) {
    const category = await prisma.category.findUnique({ where: { slug: card.category } });
    if (!category) { console.warn(`  ⚠ Skipping "${card.name}" — category "${card.category}" not found`); continue; }

    const subcategory = card.subcategory
      ? await prisma.subcategory.findUnique({ where: { categoryId_slug: { categoryId: category.id, slug: card.subcategory } } })
      : null;

    const setSlug = card.set.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const cardSet = await prisma.cardSet.upsert({
      where: { slug: setSlug },
      update: {},
      create: { slug: setSlug, name: card.set },
    });

    const slug = card.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const extraImages = [card.imageUrl];

    const catalogItem = await prisma.catalogItem.upsert({
      where: { slug },
      update: {},
      create: {
        slug, name: card.name,
        categoryId: category.id,
        subcategoryId: subcategory?.id,
        setId: cardSet.id,
        rarity: card.rarity,
        cardNumber: card.cardNumber,
        imageUrl: card.imageUrl,
        images: extraImages,
      },
    });

    await prisma.product.upsert({
      where: { slug },
      update: {
        price: baht(card.basePrice),
        stock: card.stock ?? 12,
        imageUrl: card.imageUrl,
        images: extraImages,
        isTrending: card.flags?.trending ?? false,
        isNewArrival: card.flags?.newArrival ?? false,
        isPreOrder: card.flags?.preOrder ?? false,
        isFeatured: card.flags?.featured ?? false,
      },
      create: {
        slug, name: card.name,
        subtitle: card.set,
        description: `การ์ดสะสมของแท้จาก ${card.set} สภาพ Mint พร้อมจัดส่งทั่วประเทศ รับประกันของแท้ 100%`,
        type: card.type,
        price: baht(card.basePrice),
        stock: card.stock ?? 12,
        imageUrl: card.imageUrl,
        images: extraImages,
        rarity: card.rarity,
        isTrending: card.flags?.trending ?? false,
        isNewArrival: card.flags?.newArrival ?? false,
        isPreOrder: card.flags?.preOrder ?? false,
        isFeatured: card.flags?.featured ?? false,
        catalogItemId: catalogItem.id,
      },
    });
  }
}

// ─── Demo Sellers, Listings & Price History ─────────────────────────────────────
async function seedDemoSellersAndTrades() {
  console.log("Seeding demo sellers, listings & trade history...");

  const sellerData = [
    { displayName: "CardKingTH", rating: 4.9, ratingCount: 127 },
    { displayName: "GoldPackTrader", rating: 4.7, ratingCount: 85 },
    { displayName: "RareFindsTH", rating: 4.8, ratingCount: 203 },
    { displayName: "CollectorXCBK", rating: 4.6, ratingCount: 56 },
    { displayName: "TCGVaultBKK", rating: 4.5, ratingCount: 312 },
  ];

  const sellers = [];
  for (let i = 0; i < sellerData.length; i++) {
    const sd = sellerData[i];
    const seller = await prisma.user.upsert({
      where: { email: `seller${i}@cardverse.demo` },
      update: {},
      create: {
        clerkId: `seed_seller_${i}`,
        email: `seller${i}@cardverse.demo`,
        displayName: sd.displayName,
        role: "customer",
        stripeConnectOnboarded: true,
        stripeConnectAccountId: `acct_demo_${i}`,
        sellerRating: sd.rating,
        sellerRatingCount: sd.ratingCount,
      },
    });
    sellers.push(seller);
  }

  const rareSingleCards = await prisma.catalogItem.findMany({
    where: {
      products: { some: { type: "SINGLE_CARD" } },
      rarity: { in: ["SR", "SSR", "UR", "SECRET"] },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`  Creating listings for ${rareSingleCards.length} rare single cards...`);

  for (const item of rareSingleCards) {
    const product = await prisma.product.findUnique({ where: { slug: item.slug } });
    const basePrice = product ? Math.round(product.price / 100) : 5000;

    const numListings = basePrice > 20000 ? 1 : 2;
    for (let s = 0; s < numListings; s++) {
      const seller = sellers[(rareSingleCards.indexOf(item) + s) % sellers.length];
      const listingPrice = Math.round(basePrice * (0.95 + Math.random() * 0.15));
      await prisma.listing.create({
        data: {
          catalogItemId: item.id,
          sellerId: seller.id,
          price: baht(listingPrice),
          condition: (["NEAR_MINT", "MINT", "LIGHTLY_PLAYED"] as const)[s % 3],
          quantity: 1,
          status: "ACTIVE",
        },
      });
    }

    const trades: Prisma.TradeCreateManyInput[] = [];
    let price = Math.round(basePrice * (0.85 + Math.random() * 0.3));
    for (let d = 30; d >= 0; d--) {
      const drift = Math.floor((Math.random() - 0.44) * (basePrice * 0.06));
      price = Math.max(Math.round(basePrice * 0.4), price + drift);
      const soldAt = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const seller = sellers[d % sellers.length];

      const order = await prisma.marketplaceOrder.create({
        data: {
          listing: {
            create: { catalogItemId: item.id, sellerId: seller.id, price: baht(price), condition: "NEAR_MINT", status: "SOLD" },
          },
          buyer: { connect: { id: sellers[(d + 1) % sellers.length].id } },
          seller: { connect: { id: seller.id } },
          status: "COMPLETED",
          amount: baht(price),
          platformFee: baht(Math.round(price * 0.08)),
          sellerPayout: baht(Math.round(price * 0.92)),
          completedAt: soldAt,
          createdAt: soldAt,
        },
      });

      trades.push({ catalogItemId: item.id, marketplaceOrderId: order.id, sellerId: seller.id, price: baht(price), soldAt });
    }
    await prisma.trade.createMany({ data: trades });
  }
}

// ─── News & Events ───────────────────────────────────────────────────────────────
async function seedNews() {
  console.log("Seeding news & events...");
  const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/450`;

  const posts = [
    {
      slug: "naruto-kayou-select-edition-launch",
      kind: "SET_RELEASE",
      title: "Naruto Kayou Select Edition — การ์ดลายเส้นสุดอาร์ตวางขายแล้ว!",
      excerpt: "เซ็ตพิเศษที่นำเอาภาพร่างดั้งเดิมมาทำการ์ดสุดพรีเมี่ยม พร้อมการ์ด PR รหัส NRSA-PR-002 วางจำหน่ายแล้ววันนี้",
      imageUrl: img("naruto-select-edition"),
    },
    {
      slug: "one-piece-op13-carrying-on-his-will",
      kind: "SET_RELEASE",
      title: "One Piece TCG OP-13 Carrying on His Will — วางจำหน่ายเป็นทางการ!",
      excerpt: "ชุด OP-13 ใหม่ล่าสุดพร้อมการ์ดระดับพระกาฬ Luffy OP13-118 SEC ลายเส้นสไตล์มังงะสีแดงสะกดสายตา",
      imageUrl: img("op13-carrying-will"),
    },
  ] as const;

  for (const p of posts) {
    await prisma.newsPost.upsert({ where: { slug: p.slug }, update: {}, create: { ...p } });
  }
}

// ─── Coupons ─────────────────────────────────────────────────────────────────────
async function seedCoupons() {
  const coupons = [
    { code: "WELCOME10", description: "ลด 10% สำหรับลูกค้าใหม่", percentOff: 10, active: true },
    { code: "NARUTO20", description: "ลด 20% สำหรับสินค้า Naruto Kayou", percentOff: 20, active: true },
    { code: "ONEPIECE15", description: "ลด 15% สำหรับสินค้า One Piece", percentOff: 15, active: true },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────────
async function seedDemoWallets() {
  console.log("Seeding demo wallets...");
  const demoUsers = [
    { email: "customer@cardverse.demo", clerkId: "dev_customer", displayName: "Demo Customer", role: "customer" as const, balance: baht(5000) },
    { email: "manager@cardverse.demo", clerkId: "dev_manager", displayName: "Demo Manager", role: "manager" as const, balance: baht(10000) },
    { email: "admin@cardverse.demo", clerkId: "dev_admin", displayName: "Demo Admin", role: "admin" as const, balance: baht(50000) },
  ];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: {
        clerkId: u.clerkId,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
      },
    });
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balance: u.balance },
      create: { userId: user.id, balance: u.balance },
    });
    const txCount = await prisma.walletTransaction.count({ where: { walletId: wallet.id } });
    if (txCount === 0) {
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_GRANT",
          amount: u.balance,
          balanceAfter: u.balance,
          description: "เครดิตเริ่มต้น Demo",
          referenceType: "seed",
        },
      });
    }
  }
  // Give demo sellers some wallet balance too
  const sellers = await prisma.user.findMany({
    where: { email: { endsWith: "@cardverse.demo" }, displayName: { startsWith: "Trader" } },
  });
  for (const seller of sellers) {
    await prisma.wallet.upsert({
      where: { userId: seller.id },
      update: {},
      create: {
        userId: seller.id,
        balance: baht(2000),
      },
    });
  }
}

async function main() {
  console.log("🌱 Starting Cardivers seed...\n");
  await cleanSeedData();
  await seedTaxonomy();
  await seedCatalogAndProducts();
  await seedDemoSellersAndTrades();
  await seedDemoWallets();
  await seedNews();
  await seedCoupons();
  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
