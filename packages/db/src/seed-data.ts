import { CATALOG_TAXONOMY } from "@cardverse/shared";
import { createEntityId } from "./id";
import { JsonRepository, type JsonRecord } from "./json-repository";
import { dataFilePath } from "./paths";
import { MODEL_FILES } from "./schema";

const NOW = new Date("2026-07-23T00:00:00.000Z").toISOString();
const DAY_MS = 24 * 60 * 60 * 1000;

/** Files that require a real user — left empty for you to fill after sign-in. */
export const USER_LINKED_FILES = [
  "wallets.json",
  "transactions.json",
  "withdrawal-requests.json",
  "top-up-requests.json",
  "addresses.json",
  "carts.json",
  "cart-items.json",
  "orders.json",
  "order-items.json",
  "listings.json",
  "offers.json",
  "marketplace-orders.json",
  "trades.json",
  "notifications.json",
  "collection-items.json",
  "shipments.json",
  "shipment-events.json",
  "reviews.json",
  "product-reviews.json",
  "price-points.json",
] as const;

function img(slug: string): string {
  return `https://picsum.photos/seed/cardverse-${slug}/800/800`;
}

function findCategory(categories: JsonRecord[], slug: string): JsonRecord {
  const row = categories.find((c) => c.slug === slug);
  if (!row) throw new Error(`Missing category slug: ${slug}`);
  return row;
}

function findSubcategory(subcategories: JsonRecord[], categoryId: string, slug: string): JsonRecord {
  const row = subcategories.find((s) => s.categoryId === categoryId && s.slug === slug);
  if (!row) throw new Error(`Missing subcategory ${slug} for category ${categoryId}`);
  return row;
}

function findBrand(brands: JsonRecord[], slug: string): JsonRecord | undefined {
  return brands.find((b) => b.slug === slug);
}

function findSet(sets: JsonRecord[], slug: string): JsonRecord | undefined {
  return sets.find((s) => s.slug === slug);
}

export function createCategorySeed(): JsonRecord[] {
  return CATALOG_TAXONOMY.map((category, index) => ({
    id: createEntityId("cat", category.slug),
    slug: category.slug,
    name: category.name,
    nameTh: category.nameTh,
    emoji: category.emoji,
    note: category.note ?? null,
    sortOrder: index,
    createdAt: NOW,
    updatedAt: NOW,
  }));
}

export function createSubcategorySeed(categories: JsonRecord[]): JsonRecord[] {
  return CATALOG_TAXONOMY.flatMap((category) => {
    const categoryRecord = categories.find((item) => item.slug === category.slug);
    if (!categoryRecord) return [];
    return category.subcategories.map((subcategory) => ({
      id: createEntityId("sub", `${category.slug}/${subcategory.slug}`),
      categoryId: categoryRecord.id,
      slug: subcategory.slug,
      name: subcategory.name,
      createdAt: NOW,
      updatedAt: NOW,
    }));
  });
}

export function createBrandSeed(categories: JsonRecord[]): JsonRecord[] {
  const rows: JsonRecord[] = [];
  const seen = new Set<string>();

  const add = (categorySlug: string, slug: string, name: string, global = false) => {
    if (seen.has(slug)) return;
    seen.add(slug);
    const category = global ? null : findCategory(categories, categorySlug);
    rows.push({
      id: createEntityId("brand", slug),
      categoryId: category?.id ?? null,
      slug,
      name,
      createdAt: NOW,
      updatedAt: NOW,
    });
  };

  for (const category of CATALOG_TAXONOMY) {
    for (const name of category.brands ?? []) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      add(category.slug, slug, name);
    }
  }

  add("tcg", "pokemon-company", "The Pokémon Company");
  add("tcg", "wizards-of-the-coast", "Wizards of the Coast");
  add("tcg", "konami", "Konami");
  add("tcg", "bandai", "Bandai");
  add("anime-manga", "bandai-one-piece", "Bandai (One Piece)");
  add("anime-manga", "bushiroad", "Bushiroad");
  add("kpop-photocards", "hybe", "HYBE Labels");
  add("kpop-photocards", "yg", "YG Entertainment");
  add("kpop-photocards", "jyp", "JYP Entertainment");
  add("game-character", "mihoyo", "miHoYo");
  add("accessories", "ultra-pro", "Ultra Pro", true);
  add("accessories", "dragon-shield", "Dragon Shield", true);
  add("accessories", "ultimate-guard", "Ultimate Guard", true);

  return rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export function createCardSetSeed(): JsonRecord[] {
  const sets: Array<{ slug: string; name: string; releaseDate: string | null }> = [
    { slug: "sv-prismatic-evolutions", name: "Pokémon SV: Prismatic Evolutions", releaseDate: "2025-01-17T00:00:00.000Z" },
    { slug: "sv-151", name: "Pokémon SV: 151", releaseDate: "2023-09-22T00:00:00.000Z" },
    { slug: "op-09", name: "One Piece OP-09 Emperors in the New World", releaseDate: "2024-08-31T00:00:00.000Z" },
    { slug: "op-10", name: "One Piece OP-10 Royal Blood", releaseDate: "2025-03-14T00:00:00.000Z" },
    { slug: "mh3", name: "Magic: Modern Horizons 3", releaseDate: "2024-06-14T00:00:00.000Z" },
    { slug: "dsk", name: "Magic: Duskmourn — House of Horror", releaseDate: "2024-09-27T00:00:00.000Z" },
    { slug: "qcac", name: "Yu-Gi-Oh! Quarter Century Bonanza", releaseDate: "2024-10-11T00:00:00.000Z" },
    { slug: "lorcana-azurite-sea", name: "Disney Lorcana: Azurite Sea", releaseDate: "2024-11-15T00:00:00.000Z" },
    { slug: "lorcana-shimmering", name: "Disney Lorcana: Shimmering Skies", releaseDate: "2024-08-09T00:00:00.000Z" },
    { slug: "dbs-fusion-world-fw", name: "Dragon Ball Fusion World — Awakened Pulse", releaseDate: "2024-05-17T00:00:00.000Z" },
    { slug: "panini-prizm-nba-24", name: "Panini Prizm NBA 2023-24", releaseDate: "2024-02-01T00:00:00.000Z" },
  ];

  return sets.map((set) => ({
    id: createEntityId("set", set.slug),
    slug: set.slug,
    name: set.name,
    releaseDate: set.releaseDate,
    createdAt: NOW,
    updatedAt: NOW,
  }));
}

interface CatalogSeedDef {
  slug: string;
  name: string;
  categorySlug: string;
  subcategorySlug: string;
  brandSlug?: string;
  setSlug?: string;
  rarity?: string;
  cardNumber?: string;
}

export function createCatalogItemSeed(input: {
  categories: JsonRecord[];
  subcategories: JsonRecord[];
  brands: JsonRecord[];
  cardSets: JsonRecord[];
}): JsonRecord[] {
  const defs: CatalogSeedDef[] = [
    { slug: "charizard-ex-sv-prismatic", name: "Charizard ex (SV Prismatic Evolutions)", categorySlug: "tcg", subcategorySlug: "pokemon-tcg", brandSlug: "pokemon-company", setSlug: "sv-prismatic-evolutions", rarity: "SR", cardNumber: "006/131" },
    { slug: "pikachu-vmax-151", name: "Pikachu VMAX (SV 151)", categorySlug: "tcg", subcategorySlug: "pokemon-tcg", brandSlug: "pokemon-company", setSlug: "sv-151", rarity: "UR", cardNumber: "183/165" },
    { slug: "mew-ex-151", name: "Mew ex (SV 151)", categorySlug: "tcg", subcategorySlug: "pokemon-tcg", brandSlug: "pokemon-company", setSlug: "sv-151", rarity: "SR" },
    { slug: "luffy-gear5-leader", name: "Monkey D. Luffy (Gear 5 Leader)", categorySlug: "anime-manga", subcategorySlug: "one-piece", brandSlug: "bandai-one-piece", setSlug: "op-09", rarity: "SEC", cardNumber: "OP09-001" },
    { slug: "shanks-leader-op09", name: "Shanks (Leader OP-09)", categorySlug: "anime-manga", subcategorySlug: "one-piece", brandSlug: "bandai-one-piece", setSlug: "op-09", rarity: "SEC" },
    { slug: "lightning-bolt-mh3", name: "Lightning Bolt (Modern Horizons 3)", categorySlug: "tcg", subcategorySlug: "magic-the-gathering", brandSlug: "wizards-of-the-coast", setSlug: "mh3", rarity: "R" },
    { slug: "force-of-negation-mh3", name: "Force of Negation (MH3)", categorySlug: "tcg", subcategorySlug: "magic-the-gathering", brandSlug: "wizards-of-the-coast", setSlug: "mh3", rarity: "SR" },
    { slug: "blue-eyes-white-dragon", name: "Blue-Eyes White Dragon (Quarter Century)", categorySlug: "tcg", subcategorySlug: "yu-gi-oh", brandSlug: "konami", setSlug: "qcac", rarity: "UR" },
    { slug: "dark-magician-qcac", name: "Dark Magician (Quarter Century Secret)", categorySlug: "tcg", subcategorySlug: "yu-gi-oh", brandSlug: "konami", setSlug: "qcac", rarity: "SEC" },
    { slug: "mickey-mouse-brave-little", name: "Mickey Mouse — Brave Little Tailor (Lorcana)", categorySlug: "tcg", subcategorySlug: "disney-lorcana", brandSlug: "wizards-of-the-coast", setSlug: "lorcana-azurite-sea", rarity: "LEGENDARY" },
    { slug: "elsa-spirit-lorcana", name: "Elsa — Spirit of Winter (Lorcana)", categorySlug: "tcg", subcategorySlug: "disney-lorcana", setSlug: "lorcana-shimmering", rarity: "ENCHANTED" },
    { slug: "goku-ss4-leader", name: "Son Goku (SS4 Leader)", categorySlug: "anime-manga", subcategorySlug: "dragon-ball-super", brandSlug: "bandai", setSlug: "dbs-fusion-world-fw", rarity: "SR" },
    { slug: "lebron-james-prizm", name: "LeBron James Prizm Base", categorySlug: "sports-cards", subcategorySlug: "nba", brandSlug: "panini", setSlug: "panini-prizm-nba-24", rarity: "R" },
    { slug: "shohei-ohtani-topps", name: "Shohei Ohtani Topps Chrome", categorySlug: "sports-cards", subcategorySlug: "mlb", brandSlug: "topps", rarity: "SR" },
    { slug: "bts-jimin-face", name: "BTS Jimin — Face Album PC", categorySlug: "kpop-photocards", subcategorySlug: "bts", brandSlug: "hybe", rarity: "PROMO" },
    { slug: "blackpink-lisa-broadcast", name: "BLACKPINK Lisa Broadcast PC", categorySlug: "kpop-photocards", subcategorySlug: "blackpink", brandSlug: "yg", rarity: "PROMO" },
    { slug: "newjeans-hanni-season", name: "NewJeans Hanni Season Greetings PC", categorySlug: "kpop-photocards", subcategorySlug: "newjeans", rarity: "PROMO" },
    { slug: "raiden-shogun-genshin", name: "Raiden Shogun Character Card", categorySlug: "game-character", subcategorySlug: "genshin", brandSlug: "mihoyo", rarity: "SR" },
    { slug: "spider-man-marvel-chrome", name: "Spider-Man Marvel Chrome", categorySlug: "pop-culture-movie", subcategorySlug: "marvel", brandSlug: "upper-deck", rarity: "R" },
    { slug: "harry-potter-hogwarts", name: "Harry Potter Hogwarts Heroes", categorySlug: "pop-culture-movie", subcategorySlug: "harry-potter", rarity: "UC" },
  ];

  return defs.map((def) => {
    const category = findCategory(input.categories, def.categorySlug);
    const subcategory = findSubcategory(input.subcategories, String(category.id), def.subcategorySlug);
    const brand = def.brandSlug ? findBrand(input.brands, def.brandSlug) : undefined;
    const set = def.setSlug ? findSet(input.cardSets, def.setSlug) : undefined;

    return {
      id: createEntityId("catalog", def.slug),
      slug: def.slug,
      name: def.name,
      categoryId: category.id,
      subcategoryId: subcategory.id,
      brandId: brand?.id ?? null,
      setId: set?.id ?? null,
      rarity: def.rarity ?? null,
      cardNumber: def.cardNumber ?? null,
      releaseDate: set?.releaseDate ?? null,
      imageUrl: img(def.slug),
      images: [img(`${def.slug}-a`), img(`${def.slug}-b`)],
      attributes: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
  });
}

interface ProductSeedDef {
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  type: string;
  priceBaht: number;
  stock: number;
  catalogSlug?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isPreOrder?: boolean;
  soldCount?: number;
  rarity?: string;
}

export function createProductSeed(catalogItems: JsonRecord[]): JsonRecord[] {
  const catalogBySlug = new Map(catalogItems.map((item) => [String(item.slug), item]));

  const defs: ProductSeedDef[] = [
    { slug: "pokemon-prismatic-booster-box", name: "Pokémon SV Prismatic Evolutions Booster Box", subtitle: "36 packs · Thai/EN mixed allocation", description: "Booster box จาก set ยอดฮิต Prismatic Evolutions — เหมาะสำหรับเปิดเล่นหรือเก็บสะสม", type: "BOOSTER_BOX", priceBaht: 4290, stock: 48, catalogSlug: "charizard-ex-sv-prismatic", isFeatured: true, isTrending: true, soldCount: 126 },
    { slug: "pokemon-151-etb", name: "Pokémon SV 151 Elite Trainer Box", subtitle: "9 booster packs + accessories", description: "ETB ครบชุด พร้อม dice, sleeves และ promo", type: "DECK", priceBaht: 2890, stock: 35, catalogSlug: "pikachu-vmax-151", isNewArrival: true, soldCount: 89 },
    { slug: "one-piece-op09-box", name: "One Piece OP-09 Booster Box", subtitle: "24 packs", description: "Emperors in the New World — ลงขาย C2C ได้ทันทีหลังเปิด", type: "BOOSTER_BOX", priceBaht: 3590, stock: 40, catalogSlug: "luffy-gear5-leader", isTrending: true, soldCount: 74 },
    { slug: "one-piece-op10-preorder", name: "One Piece OP-10 Booster Box (Pre-order)", subtitle: "จองล่วงหน้า — ส่งประมาณ 2 สัปดาห์", description: "Royal Blood pre-order จากร้าน CardVerse โดยตรง", type: "BOOSTER_BOX", priceBaht: 3790, stock: 100, catalogSlug: "shanks-leader-op09", isPreOrder: true, isFeatured: true },
    { slug: "mtg-mh3-draft-box", name: "Magic: Modern Horizons 3 Draft Booster Box", description: "Modern Horizons 3 draft box สำหรับเล่น limited หรือเก็บสะสม", type: "BOOSTER_BOX", priceBaht: 5990, stock: 22, catalogSlug: "lightning-bolt-mh3", isFeatured: true, soldCount: 41 },
    { slug: "yugioh-quarter-century-box", name: "Yu-Gi-Oh! Quarter Century Bonanza Box", description: "รวม reprint คลาสสิก quarter century secret", type: "BOOSTER_BOX", priceBaht: 1890, stock: 55, catalogSlug: "blue-eyes-white-dragon", soldCount: 63 },
    { slug: "lorcana-azurite-sea-box", name: "Disney Lorcana: Azurite Sea Booster Box", description: "Set 6 Azurite Sea — 24 packs", type: "BOOSTER_BOX", priceBaht: 2490, stock: 30, catalogSlug: "mickey-mouse-brave-little", isNewArrival: true },
    { slug: "charizard-ex-nm-single", name: "Charizard ex — Near Mint Single", subtitle: "ตรวจการ์ดโดยทีม CardVerse", description: "Single จาก Prismatic Evolutions สภาพ NM พร้อม sleeve ให้", type: "SINGLE_CARD", priceBaht: 890, stock: 12, catalogSlug: "charizard-ex-sv-prismatic", rarity: "SR", isTrending: true, soldCount: 18 },
    { slug: "luffy-gear5-single", name: "Luffy Gear 5 Leader — NM", description: "Leader ยอดนิยม OP-09 สภาพ Near Mint", type: "SINGLE_CARD", priceBaht: 1290, stock: 8, catalogSlug: "luffy-gear5-leader", rarity: "SEC", soldCount: 22 },
    { slug: "ultra-pro-sleeves-100", name: "Ultra Pro Matte Sleeves (100 ct)", description: "Sleeve มาตรฐานสำหรับการ์ด TCG ขนาด standard", type: "ACCESSORY", priceBaht: 129, stock: 200, isFeatured: true, soldCount: 340 },
    { slug: "dragon-shield-matte", name: "Dragon Shield Matte Jet Sleeves", description: "ทนทาน สัมผัสดี เหมาะกับเล่นจริง", type: "ACCESSORY", priceBaht: 189, stock: 150, soldCount: 210 },
    { slug: "ultimate-guard-deck-box", name: "Ultimate Guard Boulder Deck Box", description: "Deck box 100+ ใบ พร้อม magnet lid", type: "ACCESSORY", priceBaht: 459, stock: 80, isNewArrival: true, soldCount: 55 },
    { slug: "playmat-cardverse", name: "CardVerse Official Playmat", subtitle: "Limited first run", description: "Playmat ลาย CardVerse ขนาด tournament", type: "ACCESSORY", priceBaht: 790, stock: 45, isFeatured: true },
    { slug: "top-loader-pack", name: "Top Loader Rigid Case (25 pack)", description: "ใส่การ์ดแข็งป้องกันรอยข при отправ", type: "ACCESSORY", priceBaht: 249, stock: 120 },
    { slug: "bts-jimin-pc-official", name: "BTS Jimin Face Album Photocard (Official)", description: "โฟโต้การ์ดจากอัลบั้ม Face — ของแท้จากร้าน", type: "SINGLE_CARD", priceBaht: 590, stock: 6, catalogSlug: "bts-jimin-face", rarity: "PROMO", isNewArrival: true },
    { slug: "lorcana-starter-deck", name: "Disney Lorcana Starter Deck — Amber & Amethyst", description: "Starter deck พร้อมเล่น 60 ใบ", type: "DECK", priceBaht: 690, stock: 40, catalogSlug: "elsa-spirit-lorcana" },
  ];

  return defs.map((def) => {
    const catalog = def.catalogSlug ? catalogBySlug.get(def.catalogSlug) : undefined;
    return {
      id: createEntityId("product", def.slug),
      slug: def.slug,
      name: def.name,
      subtitle: def.subtitle ?? null,
      description: def.description,
      type: def.type,
      price: def.priceBaht * 100,
      stock: def.stock,
      imageUrl: catalog ? String(catalog.imageUrl) : img(def.slug),
      images: catalog ? (catalog.images as string[]) : [img(def.slug)],
      isPreOrder: def.isPreOrder ?? false,
      isFeatured: def.isFeatured ?? false,
      isTrending: def.isTrending ?? false,
      isNewArrival: def.isNewArrival ?? false,
      rarity: def.rarity ?? catalog?.rarity ?? null,
      soldCount: def.soldCount ?? 0,
      catalogItemId: catalog?.id ?? null,
      createdAt: NOW,
      updatedAt: NOW,
    };
  });
}

export function createCouponSeed(): JsonRecord[] {
  const expires = new Date(Date.now() + 180 * DAY_MS).toISOString();
  return [
    {
      id: createEntityId("coupon", "welcome10"),
      code: "WELCOME10",
      description: "ส่วนลด 10% สำหรับลูกค้าใหม่ (สูงสุดตามยอดสินค้า)",
      percentOff: 10,
      amountOff: null,
      maxRedemptions: null,
      timesRedeemed: 0,
      active: true,
      expiresAt: expires,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: createEntityId("coupon", "cardverse500"),
      code: "CARD500",
      description: "ลด ฿500 เมื่อซื้อครบ ฿3,000",
      percentOff: null,
      amountOff: 50000,
      maxRedemptions: 200,
      timesRedeemed: 0,
      active: true,
      expiresAt: expires,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: createEntityId("coupon", "freeship"),
      code: "FREESHIP",
      description: "ส่งฟรี (ลดค่าจัดส่ง ฿80)",
      percentOff: null,
      amountOff: 8000,
      maxRedemptions: 500,
      timesRedeemed: 0,
      active: true,
      expiresAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

export function createNewsSeed(): JsonRecord[] {
  const posts = [
    {
      slug: "prismatic-evolutions-restock",
      kind: "NEWS",
      title: "Pokémon Prismatic Evolutions  restock สัปดาห์นี้",
      excerpt: "Booster box และ ETB กลับมาเติมสต็อกที่ร้าน CardVerse แล้ว",
      body: "Prismatic Evolutions กลับมาพร้อม allocation จำกัด — สั่งซื้อได้ที่หน้า Shop หรือรอ listing จากผู้ขายใน Marketplace",
      eventDate: null,
    },
    {
      slug: "one-piece-op10-preview",
      kind: "SET_RELEASE",
      title: "One Piece OP-10 Royal Blood — เปิด pre-order",
      excerpt: "จอง OP-10 ล่วงหน้าได้แล้วที่ร้าน CardVerse",
      body: "Royal Blood มาพร้อม leader และ SEC ใหม่ — pre-order รับประกัน allocation จากร้าน",
      eventDate: "2025-03-14T00:00:00.000Z",
    },
    {
      slug: "cardverse-grand-opening",
      kind: "EVENT",
      title: "CardVerse Grand Opening — เปิดตัวแพลตฟอร์ม",
      excerpt: "รวม Shop + Marketplace + Escrow ในที่เดียว",
      body: "ขอบคุณที่มาร่วมเปิดตัว CardVerse — ลงทะเบียน รับเครดิตต้อนรับ และลองซื้อขาย C2C ด้วยระบบ Escrow",
      eventDate: "2026-07-23T00:00:00.000Z",
    },
    {
      slug: "marketplace-escrow-guide",
      kind: "NEWS",
      title: "คู่มือ Escrow: ซื้อขาย C2C อย่างปลอดภัย",
      excerpt: "เงินถูก hold จนกว่าผู้ซื้อยืนยันได้รับของ",
      body: "เมื่อซื้อผ่าน Marketplace ระบบจะ hold เครดิต/เงินไว้ — ผู้ขายอัปเดต tracking แล้วปล่อยเงินหลังยืนยันการรับของ",
      eventDate: null,
    },
    {
      slug: "lorcana-set6-spotlight",
      kind: "PRICE_UPDATE",
      title: "Lorcana Azurite Sea — การ์ดที่ตลาดตาม",
      excerpt: "Mickey Brave Little Tailor ยังเป็นตัว top chase",
      body: "ราคาตลาดอ้างอิงจากยอดขายจริงบน Marketplace — ดูกราฟได้ที่หน้า catalog item",
      eventDate: null,
    },
    {
      slug: "kpop-photocard-tips",
      kind: "NEWS",
      title: "เคล็ดลับเก็บโฟโต้การ์ด K-Pop",
      excerpt: "ใช้ sleeve + toploader ทุกใบ",
      body: "โฟโต้การ์ด K-Pop มักมีรอยง่าย — แนะนำเก็บใน binder แบบ side-load และระบุ condition ชัดเจนตอนลงขาย",
      eventDate: null,
    },
  ];

  return posts.map((post) => ({
    id: createEntityId("news", post.slug),
    slug: post.slug,
    kind: post.kind,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    imageUrl: img(`news-${post.slug}`),
    published: true,
    eventDate: post.eventDate,
    sourceUrl: null,
    externalId: null,
    sourceName: "CardVerse",
    importedAt: null,
    authorId: null,
    createdAt: NOW,
    updatedAt: NOW,
  }));
}

export function createSettingsSeed(): JsonRecord[] {
  return [
    { id: createEntityId("setting", "site-name"), key: "site-name", value: "CardVerse", createdAt: NOW, updatedAt: NOW },
    { id: createEntityId("setting", "site-description"), key: "site-description", value: "Collectible card marketplace — Shop & C2C with Escrow", createdAt: NOW, updatedAt: NOW },
    { id: createEntityId("setting", "marketplace-fee-percent"), key: "marketplace-fee-percent", value: 8, createdAt: NOW, updatedAt: NOW },
    { id: createEntityId("setting", "escrow-auto-release-days"), key: "escrow-auto-release-days", value: 7, createdAt: NOW, updatedAt: NOW },
    { id: createEntityId("setting", "maintenance-mode"), key: "maintenance-mode", value: false, createdAt: NOW, updatedAt: NOW },
    { id: createEntityId("setting", "welcome-credit"), key: "welcome-credit", value: 500000, createdAt: NOW, updatedAt: NOW },
  ];
}

export interface SeedOptions {
  /** Keep existing users.json untouched (default: true). */
  preserveUsers?: boolean;
  /** Only write when target file is empty (bootstrap mode). */
  ifEmpty?: boolean;
}

async function writeRecords(fileName: string, records: JsonRecord[], ifEmpty: boolean) {
  const repo = new JsonRepository<JsonRecord>(dataFilePath(fileName));
  if (ifEmpty) {
    await repo.seedIfEmpty(records);
  } else {
    await repo.replaceAll(records);
  }
}

export async function seedJsonData(options: SeedOptions = {}): Promise<void> {
  const { preserveUsers = true, ifEmpty = false } = options;

  const categories = createCategorySeed();
  const subcategories = createSubcategorySeed(categories);
  const brands = createBrandSeed(categories);
  const cardSets = createCardSetSeed();
  const catalogItems = createCatalogItemSeed({ categories, subcategories, brands, cardSets });
  const products = createProductSeed(catalogItems);
  const coupons = createCouponSeed();
  const news = createNewsSeed();
  const settings = createSettingsSeed();

  const catalogWrites: Array<[string, JsonRecord[]]> = [
    ["categories.json", categories],
    ["subcategories.json", subcategories],
    ["brands.json", brands],
    ["card-sets.json", cardSets],
    ["catalog-items.json", catalogItems],
    ["products.json", products],
    ["coupons.json", coupons],
    ["news.json", news],
    ["settings.json", settings],
  ];

  for (const [file, records] of catalogWrites) {
    await writeRecords(file, records, ifEmpty);
  }

  if (!ifEmpty) {
    for (const file of USER_LINKED_FILES) {
      await new JsonRepository<JsonRecord>(dataFilePath(file)).replaceAll([]);
    }
  } else {
    for (const file of USER_LINKED_FILES) {
      await new JsonRepository<JsonRecord>(dataFilePath(file)).seedIfEmpty([]);
    }
    if (!MODEL_FILES.user.endsWith("users.json")) {
      // no-op safeguard
    }
  }

  const usersRepo = new JsonRepository<JsonRecord>(dataFilePath("users.json"));
  if (preserveUsers) {
    try {
      await usersRepo.readAll();
    } catch {
      await usersRepo.replaceAll([]);
    }
  } else if (!ifEmpty) {
    await usersRepo.replaceAll([]);
  } else {
    await usersRepo.seedIfEmpty([]);
  }
}

export function seedSummary(): Record<string, number> {
  const categories = createCategorySeed();
  const subcategories = createSubcategorySeed(categories);
  const brands = createBrandSeed(categories);
  const cardSets = createCardSetSeed();
  const catalogItems = createCatalogItemSeed({ categories, subcategories, brands, cardSets });
  return {
    categories: categories.length,
    subcategories: subcategories.length,
    brands: brands.length,
    cardSets: cardSets.length,
    catalogItems: catalogItems.length,
    products: createProductSeed(catalogItems).length,
    coupons: createCouponSeed().length,
    news: createNewsSeed().length,
    settings: createSettingsSeed().length,
  };
}
