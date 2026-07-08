import { PrismaClient, Prisma } from "@prisma/client";
import { CATALOG_TAXONOMY } from "@cardverse/shared";

const prisma = new PrismaClient();

// ─── Image helpers ─────────────────────────────────────────────────────────────
const localImg = (filename: string) => `/images/${filename}`;
const picsumImg = (seed: string) => `https://picsum.photos/seed/${seed}/400/556`;

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
// PRODUCT LIST
// ══════════════════════════════════════════════════════════════════════════════
const DEMO_CARDS: DemoCard[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // ONE PIECE TCG
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "One Piece Card Game OP-09 Emperors in the New World Booster Box",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SR", set: "OP-09 Emperors in the New World",
    basePrice: 1890, type: "BOOSTER_BOX",
    imageUrl: localImg("box-op09.webp"),
    flags: { trending: true },
  },
  {
    name: "One Piece Card Game OP-10 Royal Blood Booster Box",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SR", set: "OP-10 Royal Blood",
    basePrice: 1790, type: "BOOSTER_BOX",
    imageUrl: localImg("box-op10.webp"),
    flags: { newArrival: true },
  },
  {
    name: "One Piece Card Game OP-01 Romance Dawn Booster Box",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SR", set: "OP-01 Romance Dawn",
    basePrice: 3490, type: "BOOSTER_BOX",
    imageUrl: localImg("box-op01.webp"),
    stock: 4,
    flags: { featured: true },
  },
  {
    name: "One Piece Card Game EB-01 Memorial Collection Booster Box",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SR", set: "EB-01 Memorial Collection",
    basePrice: 1190, type: "BOOSTER_BOX",
    imageUrl: localImg("box-eb01b.webp"),
    flags: { newArrival: true },
  },
  {
    name: "One Piece Card Game ST-10 Ultra Deck Three Captains",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "R", set: "ST-10 Ultra Deck",
    basePrice: 699, type: "DECK",
    imageUrl: localImg("deck-st10.webp"),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NARUTO KAYOU  (ใส่รูปจริงที่อัปโหลดมา และเพิ่มกล่อง)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Naruto Kayou Tier 1 Wave 1 Booster Box (การ์ดนารูโตะกล่องส้ม)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "R", set: "Naruto Kayou T1W1",
    basePrice: 790, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-box-1.jpg"),
    flags: { trending: true },
  },
  {
    name: "Naruto Kayou Tier 2 Wave 1 Booster Box",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SR", set: "Naruto Kayou T2W1",
    basePrice: 990, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-box-2.jpg"),
  },
  {
    name: "Naruto Kayou Tier 3 Wave 1 Booster Box (กล่องเหล็กต่อสู้สุดเท่)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SSR", set: "Naruto Kayou T3W1",
    basePrice: 1290, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-box-3.jpg"),
    flags: { trending: true },
  },
  {
    name: "Naruto Kayou Tier 4 Wave 1 Booster Box (กล่องพรีเมี่ยมสุดแรร์)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SSR", set: "Naruto Kayou T4W1",
    basePrice: 1490, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-box-4.jpg"),
    flags: { trending: true, newArrival: true },
  },
  {
    name: "Naruto Kayou Heaven Scroll English Booster Box",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SR", set: "Naruto Kayou Heaven Scroll EN",
    basePrice: 1290, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-kayou-box.png"),
  },
  {
    name: "Naruto Kayou Akatsuki Edition Special Box",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SSR", set: "Naruto Kayou Akatsuki Edition",
    basePrice: 1890, type: "BOOSTER_BOX",
    imageUrl: localImg("naruto-box-3.jpg"),
    stock: 5,
    flags: { featured: true },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DISNEY LORCANA
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Disney Lorcana Azurite Sea Booster Box (Set 7 — Newest!)",
    category: "tcg", subcategory: "disney-lorcana",
    rarity: "SR", set: "Azurite Sea",
    basePrice: 2490, type: "BOOSTER_BOX",
    imageUrl: picsumImg("disney-lorcana-azurite-sea-set7-box"),
    flags: { newArrival: true, trending: true },
  },
  {
    name: "Disney Lorcana Shimmering Skies Booster Box",
    category: "tcg", subcategory: "disney-lorcana",
    rarity: "SR", set: "Shimmering Skies",
    basePrice: 2290, type: "BOOSTER_BOX",
    imageUrl: picsumImg("disney-lorcana-shimmering-skies-set6-box"),
    flags: { trending: true },
  },
  {
    name: "Disney Lorcana Ursula's Return Booster Box",
    category: "tcg", subcategory: "disney-lorcana",
    rarity: "SR", set: "Ursula's Return",
    basePrice: 2190, type: "BOOSTER_BOX",
    imageUrl: picsumImg("disney-lorcana-ursulas-return-set4-box"),
  },
  {
    name: "Disney Lorcana The First Chapter Booster Box",
    category: "tcg", subcategory: "disney-lorcana",
    rarity: "R", set: "The First Chapter",
    basePrice: 1790, type: "BOOSTER_BOX",
    imageUrl: picsumImg("disney-lorcana-the-first-chapter-set1-box"),
    stock: 6,
    flags: { featured: true },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SPORTS CARDS (การ์ดกีฬาพร้อมรูปภาพจริง!)
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "2024 Panini Prizm Basketball Blaster Box (บาสเกตบอล)",
    category: "sports-cards", subcategory: "nba",
    rarity: "SR", set: "Panini Prizm NBA 2024",
    basePrice: 2990, type: "BOOSTER_BOX",
    imageUrl: localImg("sports-nba-box.png"),
    flags: { trending: true, featured: true },
  },
  {
    name: "2024 Topps Chrome Soccer UEFA Champions League Box (ฟุตบอล)",
    category: "sports-cards", subcategory: "football",
    rarity: "SR", set: "Topps Chrome UCL 2024",
    basePrice: 2490, type: "BOOSTER_BOX",
    imageUrl: localImg("sports-ucl-box.png"),
    flags: { newArrival: true, trending: true },
  },
  {
    name: "2024 Topps Chrome Baseball Blaster Box (เบสบอล)",
    category: "sports-cards", subcategory: "mlb",
    rarity: "R", set: "Topps Chrome MLB 2024",
    basePrice: 2290, type: "BOOSTER_BOX",
    imageUrl: localImg("sports-mlb-box.png"),
    flags: { newArrival: true },
  },
  {
    name: "2024 Panini Prizm NFL Football Blaster Box (อเมริกันฟุตบอล)",
    category: "sports-cards", subcategory: "nfl",
    rarity: "SR", set: "Panini Prizm NFL 2024",
    basePrice: 2890, type: "BOOSTER_BOX",
    imageUrl: localImg("sports-nfl-box.png"),
    flags: { preOrder: true },
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
    name: "Pokémon TCG Scarlet & Violet 151 Booster Bundle",
    category: "tcg", subcategory: "pokemon-tcg",
    rarity: "SR", set: "Scarlet & Violet 151",
    basePrice: 4490, type: "BOOSTER_BOX",
    imageUrl: picsumImg("pokemon-sv151-booster-bundle-box"),
    stock: 8,
    flags: { featured: true },
  },
  {
    name: "Pokémon TCG Crown Zenith Elite Trainer Box",
    category: "tcg", subcategory: "pokemon-tcg",
    rarity: "SR", set: "Crown Zenith",
    basePrice: 2490, type: "BOOSTER_BOX",
    imageUrl: localImg("pokemon-crown-zenith-logo.png"),
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
    flags: { newArrival: true },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DRAGON BALL SUPER CARD GAME
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: "Dragon Ball Super Card Game Fusion World FB04 Booster Box",
    category: "anime-manga", subcategory: "dragon-ball-super",
    rarity: "SR", set: "Fusion World FB04",
    basePrice: 1490, type: "BOOSTER_BOX",
    imageUrl: picsumImg("dbs-fusion-world-fb04-box"),
    flags: { trending: true, newArrival: true },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MARKETPLACE RARE SINGLES
  // ══════════════════════════════════════════════════════════════════════════

  // ONE PIECE — Rare marketplace singles
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
    flags: { featured: true },
  },
  {
    name: "Shanks OP09-001 Alt Art Leader Gold Parallel",
    category: "anime-manga", subcategory: "one-piece",
    rarity: "SSR", set: "OP-09 Emperors in the New World",
    cardNumber: "OP09-001",
    basePrice: 22000, type: "SINGLE_CARD",
    imageUrl: localImg("op09-shanks-leader.webp"),
    stock: 1,
    flags: { trending: true },
  },

  // NARUTO KAYOU — Rare marketplace singles (รูปจริงอัปโหลดมา!)
  {
    name: "Naruto Uzumaki Crystal Rare NRB08-CR-001 (การ์ดแรร์นารูโตะทอง)",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SECRET", set: "Naruto Kayou T4W1",
    cardNumber: "NRB08-CR-001",
    basePrice: 25000, type: "SINGLE_CARD",
    imageUrl: localImg("naruto-card-ssr.png"),
    stock: 1,
    flags: { featured: true },
  },
  {
    name: "Itachi Uchiha Ultra Rare NRB07-UR-014 Naruto Kayou",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "UR", set: "Naruto Kayou T2W3",
    cardNumber: "NRB07-UR-014",
    basePrice: 18000, type: "SINGLE_CARD",
    imageUrl: picsumImg("itachi-uchiha-ultra-rare-nrb07-ur014"),
    stock: 1,
    flags: { trending: true },
  },
  {
    name: "Kakashi Hatake Crystal Rare NRB07-CR-001 Naruto Kayou",
    category: "anime-manga", subcategory: "weiss-schwarz",
    rarity: "SECRET", set: "Naruto Kayou T2W3",
    cardNumber: "NRB07-CR-001",
    basePrice: 22000, type: "SINGLE_CARD",
    imageUrl: picsumImg("kakashi-hatake-crystal-rare-nrb07-cr001"),
    stock: 1,
    flags: { featured: true },
  },

  // DISNEY LORCANA — Rare marketplace singles
  {
    name: "Elsa Queen of Arendelle Enchanted Card 23/204 The First Chapter",
    category: "tcg", subcategory: "disney-lorcana",
    rarity: "SECRET", set: "The First Chapter",
    cardNumber: "TFC-023",
    basePrice: 28000, type: "SINGLE_CARD",
    imageUrl: picsumImg("disney-lorcana-elsa-queen-enchanted-tfc-023"),
    stock: 1,
    flags: { featured: true },
  },
  {
    name: "Mickey Mouse Brave Little Tailor Enchanted 1/204 The First Chapter",
    category: "tcg", subcategory: "disney-lorcana",
    rarity: "SECRET", set: "The First Chapter",
    cardNumber: "TFC-001",
    basePrice: 35000, type: "SINGLE_CARD",
    imageUrl: picsumImg("disney-lorcana-mickey-mouse-enchanted-tfc-001"),
    stock: 1,
    flags: { featured: true },
  },

  // POKÉMON — Rare marketplace singles (รูปจริงภาษาไทย!)
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
    flags: { featured: true },
  },

  // YU-GI-OH! — Rare marketplace singles
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
  for (let i = 0; i < CATALOG_TAXONOMY.length; i++) {
    const c = CATALOG_TAXONOMY[i];
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
    const extraImages = [card.imageUrl, picsumImg(slug + "-alt1"), picsumImg(slug + "-alt2"), picsumImg(slug + "-alt3")];

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
      slug: "disney-lorcana-azurite-sea-launch-thailand",
      kind: "SET_RELEASE",
      title: "Disney Lorcana Azurite Sea — Set ล่าสุดวางขายแล้วในไทย!",
      excerpt: "Azurite Sea เซ็ตที่ 7 ของ Disney Lorcana มาแล้ว! พร้อมการ์ด Enchanted ใหม่หลายใบที่นักสะสมต้องมี",
      imageUrl: img("disney-lorcana-azurite-sea-launch"),
    },
    {
      slug: "naruto-kayou-t4w1-thailand-launch",
      kind: "SET_RELEASE",
      title: "Naruto Kayou T4W1 — Crystal Rare Naruto Uzumaki มาถึงไทยแล้ว!",
      excerpt: "Naruto Kayou Tier 4 Wave 1 เซ็ตที่ rare ที่สุด พร้อมการ์ด Crystal Rare และ Ultra Rare ที่นักสะสมทั่วโลกตามหา",
      imageUrl: img("naruto-kayou-t4w1-thailand-launch"),
    },
    {
      slug: "one-piece-op09-emperors-release",
      kind: "SET_RELEASE",
      title: "One Piece OP-09 Emperors in the New World — Gol D. Roger กลับมา!",
      excerpt: "Roger Gold Super Parallel SEC ราคาพุ่งสูงถึง 45,000 บาท! ชุด OP-09 hot ที่สุดในประวัติศาสตร์ One Piece TCG",
      imageUrl: img("op09-emperors-news"),
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
    { code: "LORCANA15", description: "ลด 15% สำหรับสินค้า Disney Lorcana", percentOff: 15, active: true },
    { code: "NARUTO20", description: "ลด 20% สำหรับสินค้า Naruto Kayou", percentOff: 20, active: true },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: c });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting Cardivers seed...\n");
  await cleanSeedData();
  await seedTaxonomy();
  await seedCatalogAndProducts();
  await seedDemoSellersAndTrades();
  await seedNews();
  await seedCoupons();
  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
