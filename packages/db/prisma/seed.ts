import { PrismaClient, Prisma } from "@prisma/client";
import { CATALOG_TAXONOMY } from "@cardverse/shared";

const prisma = new PrismaClient();

const img = (seed: string) => `https://picsum.photos/seed/${seed}/600/800`;
const baht = (n: number) => n * 100; // store satang

async function seedTaxonomy() {
  console.log("Seeding taxonomy (20 categories)...");
  for (let i = 0; i < CATALOG_TAXONOMY.length; i++) {
    const c = CATALOG_TAXONOMY[i];
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameTh: c.nameTh, emoji: c.emoji, note: c.note, sortOrder: i },
      create: {
        slug: c.slug,
        name: c.name,
        nameTh: c.nameTh,
        emoji: c.emoji,
        note: c.note,
        sortOrder: i,
      },
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

interface DemoCard {
  name: string;
  category: string;
  subcategory?: string;
  rarity: "C" | "UC" | "R" | "SR" | "SSR" | "UR" | "SECRET" | "PROMO";
  set: string;
  cardNumber?: string;
  basePrice: number; // baht
  type: "BOOSTER_BOX" | "DECK" | "SINGLE_CARD" | "ACCESSORY";
  flags?: Partial<{ trending: boolean; newArrival: boolean; preOrder: boolean; featured: boolean }>;
}

const DEMO_CARDS: DemoCard[] = [
  { name: "Monkey D. Luffy OP-09", category: "anime-manga", subcategory: "one-piece", rarity: "SSR", set: "OP-09 Booster", cardNumber: "OP09-001", basePrice: 3990, type: "BOOSTER_BOX", flags: { trending: true } },
  { name: "Roronoa Zoro Promo", category: "anime-manga", subcategory: "one-piece", rarity: "SR", set: "Promo Pack", cardNumber: "P-001", basePrice: 1290, type: "SINGLE_CARD", flags: { trending: true } },
  { name: "Charizard ex Special", category: "tcg", subcategory: "pokemon-tcg", rarity: "UR", set: "Scarlet & Violet", cardNumber: "SV-006", basePrice: 5490, type: "SINGLE_CARD", flags: { trending: true, preOrder: true } },
  { name: "Pikachu V Box", category: "tcg", subcategory: "pokemon-tcg", rarity: "R", set: "Crown Zenith", cardNumber: "CZ-021", basePrice: 2490, type: "BOOSTER_BOX", flags: { trending: true, preOrder: true } },
  { name: "Naruto Uzumaki Sage", category: "anime-manga", subcategory: "weiss-schwarz", rarity: "SR", set: "Shippuden Set", cardNumber: "SH-099", basePrice: 1890, type: "SINGLE_CARD", flags: { newArrival: true, preOrder: true } },
  { name: "Sasuke Rinnegan", category: "anime-manga", subcategory: "weiss-schwarz", rarity: "SSR", set: "Final Battle", cardNumber: "FB-013", basePrice: 2290, type: "SINGLE_CARD", flags: { newArrival: true, preOrder: true } },
  { name: "Dragon Knight Original", category: "original-character", subcategory: "with-lore", rarity: "C", set: "Realm I", cardNumber: "R1-001", basePrice: 990, type: "SINGLE_CARD", flags: { newArrival: true } },
  { name: "Phoenix Empress", category: "art-cards", subcategory: "limited", rarity: "R", set: "Realm II", cardNumber: "R2-007", basePrice: 1790, type: "SINGLE_CARD", flags: { newArrival: true } },
  { name: "LeBron James Prizm", category: "sports-cards", subcategory: "nba", rarity: "SSR", set: "Panini Prizm 2024", cardNumber: "PZ-023", basePrice: 4590, type: "SINGLE_CARD", flags: { featured: true } },
  { name: "BTS Jungkook Lucky Draw", category: "kpop-photocards", subcategory: "bts", rarity: "SECRET", set: "Golden Album", cardNumber: "GA-007", basePrice: 3290, type: "SINGLE_CARD", flags: { featured: true } },
];

async function seedCatalogAndProducts() {
  console.log("Seeding catalog items + store products...");
  for (const card of DEMO_CARDS) {
    const category = await prisma.category.findUnique({ where: { slug: card.category } });
    if (!category) continue;
    const subcategory = card.subcategory
      ? await prisma.subcategory.findUnique({
          where: { categoryId_slug: { categoryId: category.id, slug: card.subcategory } },
        })
      : null;

    const setSlug = card.set.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const cardSet = await prisma.cardSet.upsert({
      where: { slug: setSlug },
      update: {},
      create: { slug: setSlug, name: card.set },
    });

    const slug = card.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const seedKey = slug;

    const catalogItem = await prisma.catalogItem.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: card.name,
        categoryId: category.id,
        subcategoryId: subcategory?.id,
        setId: cardSet.id,
        rarity: card.rarity,
        cardNumber: card.cardNumber,
        imageUrl: img(seedKey),
        images: [img(seedKey), img(seedKey + "-2"), img(seedKey + "-3"), img(seedKey + "-4")],
      },
    });

    await prisma.product.upsert({
      where: { slug },
      update: {
        price: baht(card.basePrice),
        isTrending: card.flags?.trending ?? false,
        isNewArrival: card.flags?.newArrival ?? false,
        isPreOrder: card.flags?.preOrder ?? false,
        isFeatured: card.flags?.featured ?? false,
      },
      create: {
        slug,
        name: card.name,
        subtitle: card.set,
        description: `การ์ดสะสมของแท้จาก ${card.set} สภาพ Mint พร้อมจัดส่งทั่วประเทศ`,
        type: card.type,
        price: baht(card.basePrice),
        stock: 12,
        imageUrl: img(seedKey),
        images: [img(seedKey), img(seedKey + "-a"), img(seedKey + "-b"), img(seedKey + "-c")],
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

async function seedDemoSellersAndTrades() {
  console.log("Seeding demo sellers, listings & trade history...");
  const sellers = [];
  for (let i = 0; i < 4; i++) {
    const seller = await prisma.user.upsert({
      where: { email: `seller${i}@cardverse.demo` },
      update: {},
      create: {
        clerkId: `seed_seller_${i}`,
        email: `seller${i}@cardverse.demo`,
        displayName: `TraderX${i}`,
        role: "customer",
        stripeConnectOnboarded: true,
        stripeConnectAccountId: `acct_demo_${i}`,
        sellerRating: 4 + (i % 2) * 0.5,
        sellerRatingCount: 20 + i * 7,
      },
    });
    sellers.push(seller);
  }

  const catalogItems = await prisma.catalogItem.findMany({ take: 8 });

  for (const item of catalogItems) {
    // active listings from a couple of sellers
    for (let s = 0; s < 2; s++) {
      const seller = sellers[(catalogItems.indexOf(item) + s) % sellers.length];
      await prisma.listing.create({
        data: {
          catalogItemId: item.id,
          sellerId: seller.id,
          price: baht(1000 + Math.floor(Math.random() * 4000)),
          condition: "NEAR_MINT",
          quantity: 1,
          status: "ACTIVE",
        },
      });
    }

    // historical trades over the past 30 days to feed the price chart
    const trades: Prisma.TradeCreateManyInput[] = [];
    let price = 1500 + Math.floor(Math.random() * 3000);
    for (let d = 30; d >= 0; d--) {
      const drift = Math.floor((Math.random() - 0.45) * 200);
      price = Math.max(500, price + drift);
      const soldAt = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const seller = sellers[d % sellers.length];
      // Trades need a marketplace order; create a lightweight completed order
      const order = await prisma.marketplaceOrder.create({
        data: {
          listing: {
            create: {
              catalogItemId: item.id,
              sellerId: seller.id,
              price: baht(price),
              condition: "NEAR_MINT",
              status: "SOLD",
            },
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
      trades.push({
        catalogItemId: item.id,
        marketplaceOrderId: order.id,
        sellerId: seller.id,
        price: baht(price),
        soldAt,
      });
    }
    await prisma.trade.createMany({ data: trades });
  }
}

async function seedNews() {
  console.log("Seeding news & events...");
  const posts = [
    { slug: "one-piece-op-09-release", kind: "SET_RELEASE", title: "NEW SET RELEASE: One Piece OP-09", excerpt: "ชุดใหม่ล่าสุดจาก One Piece พร้อมการ์ด SSR ใหม่ 5 ใบ", imageUrl: img("news1") },
    { slug: "cardverse-tournament-round-2", kind: "EVENT", title: "Card Verse Tournament Round 2", excerpt: "ทัวร์นาเมนต์รอบที่ 2 เปิดรับสมัครแล้ววันนี้", imageUrl: img("news2"), eventDate: new Date("2026-07-10") },
    { slug: "pokemon-league-cup-may", kind: "EVENT", title: "Pokémon League Cup", excerpt: "ลีกคัพประจำเดือน รางวัลใหญ่กว่าเดิม", imageUrl: img("news3"), eventDate: new Date("2026-07-11") },
    { slug: "price-update-weekly", kind: "PRICE_UPDATE", title: "Price Update", excerpt: "อัปเดตราคาตลาดประจำสัปดาห์", imageUrl: img("news4") },
    { slug: "one-piece-championship", kind: "EVENT", title: "One Piece Championship", excerpt: "ศึกชิงแชมป์ One Piece ระดับประเทศ", imageUrl: img("news5"), eventDate: new Date("2026-07-12") },
  ] as const;

  for (const p of posts) {
    await prisma.newsPost.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p },
    });
  }
}

async function seedCoupons() {
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", description: "ลด 10% สำหรับลูกค้าใหม่", percentOff: 10, active: true },
  });
}

async function main() {
  await seedTaxonomy();
  await seedCatalogAndProducts();
  await seedDemoSellersAndTrades();
  await seedNews();
  await seedCoupons();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
