"use client";

import Link from "next/link";

const COLUMNS = [
  {
    title: "COMPANY",
    links: [
      { label: "About", href: "/" },
      { label: "Shop", href: "/shop" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "News", href: "/news" },
    ],
  },
  {
    title: "HELP",
    links: [
      { label: "Customer Support", href: "/account" },
      { label: "Track Order", href: "/account/orders" },
      { label: "Shipments", href: "/account/shipments" },
    ],
  },
  {
    title: "FAQ",
    links: [
      { label: "Account", href: "/account" },
      { label: "Login", href: "/sign-in" },
      { label: "Register", href: "/sign-up" },
    ],
  },
  {
    title: "RESOURCES",
    links: [
      { label: "Admin", href: "/admin" },
      { label: "Collection", href: "/collection" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 bg-white">
      <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="text-2xl font-black uppercase">
            CardVerse
          </Link>
          <p className="mt-3 max-w-xs text-sm text-black/50">
            Marketplace สำหรับนักสะสมการ์ดตัวจริง — authentic sealed products &amp; singles.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-medium uppercase tracking-wider text-black/40">{col.title}</h4>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-black/70 hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-black/10 py-6 text-center text-xs text-black/40">
        CardVerse © 2026, All Rights Reserved
      </div>
    </footer>
  );
}
