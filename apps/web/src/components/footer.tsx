import Link from "next/link";
import Image from "next/image";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Cards", href: "/shop" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Track Order", href: "/account/orders" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/account" },
      { label: "Register", href: "/account" },
      { label: "Settings", href: "/account/settings" },
    ],
  },
  {
    title: "Admin",
    links: [
      { label: "Dashboard", href: "/admin" },
      { label: "Products", href: "/admin/products" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10 bg-cream">
      <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Cardivers Logo"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
            <h3 className="font-display text-lg font-semibold">CardVerse</h3>
          </Link>
          <p className="mt-2 text-sm text-ink/60">
            Marketplace สำหรับนักสะสมการ์ดตัวจริง
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-ink/60 hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink/10 py-4 text-center text-xs text-ink/50">
        © 2026 CardVerse
      </div>
    </footer>
  );
}
