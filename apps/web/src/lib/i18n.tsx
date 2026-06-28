"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Locale = "th" | "en";

type Dict = Record<string, { th: string; en: string }>;

const DICT: Dict = {
  "nav.home": { th: "หน้าแรก", en: "HOME" },
  "nav.shop": { th: "ร้านค้า", en: "SHOP" },
  "nav.marketplace": { th: "มาร์เก็ตเพลส", en: "MARKETPLACE" },
  "nav.collection": { th: "คอลเลกชัน", en: "COLLECTION" },
  "nav.news": { th: "ข่าวสาร", en: "NEWS" },
  "home.presents": { th: "CARDVERSE นำเสนอ", en: "CARDVERSE PRESENTS" },
  "home.title": { th: "สะสมทั้งมัลติเวิร์ส", en: "Collect the Multiverse" },
  "home.subtitle": {
    th: "การ์ดของแท้ จัดส่งทั่วประเทศ พร้อม Marketplace สำหรับนักสะสม",
    en: "Authentic cards shipped nationwide, with a marketplace for collectors",
  },
  "home.shopNow": { th: "ช้อปเลย", en: "SHOP NOW" },
  "home.chooseUniverse": { th: "เลือกจักรวาลของคุณ", en: "CHOOSE YOUR UNIVERSE" },
  "home.trending": { th: "กำลังมาแรง", en: "TRENDING NOW" },
  "home.newArrival": { th: "สินค้าใหม่", en: "NEW ARRIVAL" },
  "home.preorder": { th: "พรีออเดอร์", en: "PRE-ORDER" },
  "common.viewAll": { th: "ดูทั้งหมด", en: "VIEW ALL" },
  "common.filter": { th: "ตัวกรอง", en: "FILTER" },
  "common.apply": { th: "ใช้งาน", en: "APPLY" },
  "common.addToCart": { th: "เพิ่มลงตะกร้า", en: "ADD TO CART" },
  "common.buyNow": { th: "ซื้อเลย", en: "BUY NOW" },
  "common.wishlist": { th: "รายการโปรด", en: "Wishlist" },
  "common.search": { th: "ค้นหาการ์ด ชุด คีย์เวิร์ด...", en: "Search cards, sets, keywords..." },
  "shop.game": { th: "เกม", en: "GAME" },
  "shop.type": { th: "ประเภท", en: "TYPE" },
  "shop.price": { th: "ราคา (฿)", en: "PRICE (฿)" },
  "shop.all": { th: "ทั้งหมด", en: "All" },
  "market.card": { th: "การ์ด", en: "CARD" },
  "market.set": { th: "ชุด", en: "SET" },
  "market.rarity": { th: "ความหายาก", en: "RARITY" },
  "market.seller": { th: "ผู้ขาย", en: "SELLER" },
  "market.price": { th: "ราคา", en: "PRICE" },
  "market.recentSales": { th: "การขายล่าสุด", en: "RECENT SALES" },
  "market.marketPrice": { th: "ราคาตลาด", en: "MARKET PRICE" },
  "market.lowestPrice": { th: "ราคาต่ำสุด", en: "LOWEST PRICE" },
  "market.today": { th: "วันนี้", en: "Today" },
  "market.sell": { th: "ลงขายการ์ด", en: "Sell a Card" },
  "cart.title": { th: "ตะกร้าสินค้า", en: "Shopping Cart" },
  "cart.checkout": { th: "ชำระเงิน", en: "CHECKOUT" },
  "cart.subtotal": { th: "ยอดรวม", en: "SUBTOTAL" },
  "cart.shipping": { th: "ค่าจัดส่ง", en: "SHIPPING" },
  "cart.total": { th: "รวมทั้งหมด", en: "TOTAL" },
  "cart.continue": { th: "ช้อปต่อ", en: "CONTINUE SHOPPING" },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof DICT | string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "th",
  setLocale: () => {},
  t: (k) => String(k),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    const saved = window.localStorage.getItem("cv_locale") as Locale | null;
    if (saved) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem("cv_locale", l);
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = DICT[key];
      return entry ? entry[locale] : key;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
