/**
 * Canonical CardVerse taxonomy.
 *
 * This is the single source of truth for the 20 collection categories,
 * their sub-collections, and example brands/producers. Sellers in the
 * marketplace MUST pick from this taxonomy (via CatalogItem) instead of
 * typing free-form values, so listings stay tidy and price charts can be
 * aggregated per canonical card.
 */

export interface TaxonomyCategory {
  /** stable slug used as Category.slug in the DB */
  slug: string;
  /** English display name */
  name: string;
  /** Thai display name */
  nameTh: string;
  emoji: string;
  /** optional short note */
  note?: string;
  subcategories: TaxonomySubcategory[];
  /** example brands / producers for the whole category */
  brands?: string[];
}

export interface TaxonomySubcategory {
  slug: string;
  name: string;
}

export const CATALOG_TAXONOMY: TaxonomyCategory[] = [
  {
    slug: "sports-cards",
    name: "Sports Cards",
    nameTh: "การ์ดกีฬา",
    emoji: "🏀",
    brands: ["Panini", "Topps", "Upper Deck"],
    subcategories: [
      { slug: "nba", name: "NBA" },
      { slug: "nfl", name: "NFL" },
      { slug: "mlb", name: "MLB" },
      { slug: "football", name: "Football / Soccer" },
      { slug: "formula-1", name: "Formula 1" },
      { slug: "ufc", name: "UFC" },
      { slug: "wwe", name: "WWE" },
      { slug: "esports", name: "Esports" },
    ],
  },
  {
    slug: "anime-manga",
    name: "Anime / Manga Cards",
    nameTh: "การ์ดอนิเมะ / มังงะ",
    emoji: "🎌",
    subcategories: [
      { slug: "one-piece", name: "One Piece Card Game" },
      { slug: "dragon-ball-super", name: "Dragon Ball Super Card Game" },
      { slug: "weiss-schwarz", name: "Weiß Schwarz" },
      { slug: "union-arena", name: "Union Arena" },
      { slug: "lycee-overture", name: "Lycee Overture" },
    ],
  },
  {
    slug: "tcg",
    name: "Trading Card Games (TCG)",
    nameTh: "เกมการ์ดที่เล่นได้จริง",
    emoji: "🎲",
    note: "Playable trading card games",
    subcategories: [
      { slug: "magic-the-gathering", name: "Magic: The Gathering" },
      { slug: "pokemon-tcg", name: "Pokémon Trading Card Game" },
      { slug: "yu-gi-oh", name: "Yu-Gi-Oh! Trading Card Game" },
      { slug: "disney-lorcana", name: "Disney Lorcana" },
    ],
  },
  {
    slug: "pop-culture-movie",
    name: "Pop Culture / Movie",
    nameTh: "ป๊อปคัลเจอร์ / ภาพยนตร์",
    emoji: "🎬",
    brands: ["Upper Deck", "Topps"],
    subcategories: [
      { slug: "marvel", name: "Marvel" },
      { slug: "dc", name: "DC" },
      { slug: "star-wars", name: "Star Wars" },
      { slug: "harry-potter", name: "Harry Potter" },
      { slug: "disney", name: "Disney" },
      { slug: "pixar", name: "Pixar" },
    ],
  },
  {
    slug: "celebrity",
    name: "Celebrity Cards",
    nameTh: "การ์ดคนดัง",
    emoji: "⭐",
    subcategories: [
      { slug: "singer", name: "Singer" },
      { slug: "actor", name: "Actor" },
      { slug: "idol", name: "Idol" },
      { slug: "youtuber", name: "YouTuber" },
      { slug: "streamer", name: "Streamer" },
    ],
  },
  {
    slug: "kpop-photocards",
    name: "K-Pop Photocards",
    nameTh: "โฟโต้การ์ด K-Pop",
    emoji: "🎤",
    note: "Very large market: Lucky Draw, Album, Broadcast, Fansign, Event cards",
    subcategories: [
      { slug: "bts", name: "BTS" },
      { slug: "blackpink", name: "BLACKPINK" },
      { slug: "twice", name: "TWICE" },
      { slug: "newjeans", name: "NewJeans" },
      { slug: "aespa", name: "aespa" },
    ],
  },
  {
    slug: "vtuber",
    name: "VTuber Cards",
    nameTh: "การ์ด VTuber",
    emoji: "🎮",
    subcategories: [
      { slug: "hololive", name: "hololive production" },
      { slug: "nijisanji", name: "NIJISANJI" },
    ],
  },
  {
    slug: "game-character",
    name: "Game Character Cards",
    nameTh: "การ์ดตัวละครเกม",
    emoji: "🎮",
    note: "Mostly collectible cards",
    subcategories: [
      { slug: "genshin", name: "Genshin Impact" },
      { slug: "honkai", name: "Honkai" },
      { slug: "league-of-legends", name: "League of Legends" },
      { slug: "valorant", name: "Valorant" },
      { slug: "minecraft", name: "Minecraft" },
    ],
  },
  {
    slug: "art-cards",
    name: "Art Cards",
    nameTh: "การ์ดอาร์ต",
    emoji: "🎨",
    note: "Artist-drawn: Limited, Signed, Numbered",
    subcategories: [
      { slug: "limited", name: "Limited" },
      { slug: "signed", name: "Signed" },
      { slug: "numbered", name: "Numbered" },
      { slug: "illustration", name: "Illustration Card" },
    ],
  },
  {
    slug: "artist-series",
    name: "Artist Series",
    nameTh: "ซีรีส์ศิลปิน",
    emoji: "🖌️",
    note: "Cards from famous artists",
    subcategories: [
      { slug: "original-artwork", name: "Original Artwork" },
      { slug: "sketch-card", name: "Sketch Card" },
      { slug: "commission-card", name: "Commission Card" },
    ],
  },
  {
    slug: "luxury",
    name: "Luxury Cards",
    nameTh: "การ์ดวัสดุพิเศษ",
    emoji: "💎",
    note: "Special materials",
    subcategories: [
      { slug: "gold-foil", name: "Gold Foil" },
      { slug: "silver-foil", name: "Silver Foil" },
      { slug: "metal", name: "Metal Card" },
      { slug: "titanium", name: "Titanium" },
      { slug: "acrylic", name: "Acrylic" },
      { slug: "wood", name: "Wood" },
      { slug: "carbon-fiber", name: "Carbon Fiber" },
    ],
  },
  {
    slug: "nft-hybrid",
    name: "NFT + Physical Hybrid",
    nameTh: "NFT + การ์ดจริง",
    emoji: "🔗",
    note: "Buy NFT, receive physical card. Blockchain features are placeholder for now.",
    subcategories: [
      { slug: "redemption-card", name: "Redemption Card" },
      { slug: "blockchain-auth", name: "Blockchain Authentication" },
    ],
  },
  {
    slug: "brand-collaboration",
    name: "Brand Collaboration",
    nameTh: "การ์ดแบรนด์ร่วมกับศิลปิน",
    emoji: "🤝",
    subcategories: [
      { slug: "coca-cola", name: "Coca-Cola" },
      { slug: "mcdonalds", name: "McDonald's" },
      { slug: "adidas", name: "Adidas" },
      { slug: "nike", name: "Nike" },
    ],
  },
  {
    slug: "music",
    name: "Music Cards",
    nameTh: "การ์ดเพลง",
    emoji: "🎵",
    note: "Beyond K-pop",
    subcategories: [
      { slug: "rock", name: "Rock" },
      { slug: "hip-hop", name: "Hip-hop" },
      { slug: "jazz", name: "Jazz" },
      { slug: "orchestra", name: "Orchestra" },
    ],
  },
  {
    slug: "historical",
    name: "Historical Cards",
    nameTh: "การ์ดประวัติศาสตร์",
    emoji: "📜",
    subcategories: [
      { slug: "important-figures", name: "Important Figures" },
      { slug: "wars", name: "Wars" },
      { slug: "trains", name: "Trains" },
      { slug: "aircraft", name: "Aircraft" },
      { slug: "historical-events", name: "Historical Events" },
    ],
  },
  {
    slug: "animal",
    name: "Animal Cards",
    nameTh: "การ์ดสัตว์",
    emoji: "🐱",
    subcategories: [
      { slug: "cats", name: "Cats" },
      { slug: "dogs", name: "Dogs" },
      { slug: "horses", name: "Horses" },
      { slug: "dinosaurs", name: "Dinosaurs" },
      { slug: "rare-animals", name: "Rare Animals" },
    ],
  },
  {
    slug: "car",
    name: "Car Cards",
    nameTh: "การ์ดรถยนต์",
    emoji: "🚗",
    subcategories: [
      { slug: "ferrari", name: "Ferrari" },
      { slug: "lamborghini", name: "Lamborghini" },
      { slug: "porsche", name: "Porsche" },
      { slug: "jdm", name: "JDM" },
      { slug: "formula-1", name: "Formula 1" },
    ],
  },
  {
    slug: "food-beverage",
    name: "Food & Beverage Cards",
    nameTh: "การ์ดอาหาร & เครื่องดื่ม",
    emoji: "🍔",
    subcategories: [
      { slug: "starbucks", name: "Starbucks" },
      { slug: "coca-cola", name: "Coca-Cola" },
      { slug: "snacks", name: "Snacks" },
      { slug: "milk-tea", name: "Milk Tea" },
    ],
  },
  {
    slug: "original-character",
    name: "Original Character (OC)",
    nameTh: "ตัวละครออริจินัล (OC)",
    emoji: "✨",
    note: "Artist-created characters, no franchise license, with lore and rarity tiers",
    subcategories: [
      { slug: "with-lore", name: "With Lore" },
      { slug: "rarity-tiers", name: "Rarity Tiers" },
      { slug: "limited-edition", name: "Limited Edition" },
    ],
  },
  {
    slug: "mystery-blind-box",
    name: "Mystery Blind Box Cards",
    nameTh: "การ์ดกล่องสุ่ม",
    emoji: "🎁",
    note: "Randomized collectible packs",
    subcategories: [
      { slug: "secret", name: "Secret" },
      { slug: "chase", name: "Chase" },
      { slug: "ultra-rare", name: "Ultra Rare" },
      { slug: "signed", name: "Signed" },
      { slug: "serial-numbered", name: "Serial Numbered" },
    ],
  },
];

export const CATEGORY_SLUGS = CATALOG_TAXONOMY.map((c) => c.slug);
export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
