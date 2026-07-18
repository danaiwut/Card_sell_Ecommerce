import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { ClerkProviderShell } from "@/components/clerk-provider-shell";
import { SiteShell } from "@/components/site-shell";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CardVerse — Collect the Multiverse",
  description: "Authentic collectible cards & marketplace for serious collectors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <ClerkProviderShell>
          <SiteShell>{children}</SiteShell>
        </ClerkProviderShell>
      </body>
    </html>
  );
}