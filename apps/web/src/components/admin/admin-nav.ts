import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Coins,
  LayoutDashboard,
  Layers,
  Newspaper,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  Truck,
  Users,
} from "lucide-react";

export type AdminTab =
  | "reports"
  | "products"
  | "listings"
  | "catalog"
  | "news"
  | "shop-orders"
  | "marketplace-orders"
  | "shipping"
  | "disputes"
  | "users"
  | "wallet"
  | "settings";

export const ADMIN_TABS = new Set<AdminTab>([
  "reports",
  "products",
  "listings",
  "catalog",
  "news",
  "shop-orders",
  "marketplace-orders",
  "shipping",
  "disputes",
  "users",
  "wallet",
  "settings",
]);

export interface AdminNavItem {
  id: AdminTab;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_MAIN_NAV: AdminNavItem[] = [
  { id: "reports", label: "Dashboard", href: "/admin?tab=reports", icon: LayoutDashboard },
  { id: "products", label: "Products", href: "/admin?tab=products", icon: Package },
  { id: "listings", label: "Listings", href: "/admin?tab=listings", icon: Tag },
  { id: "catalog", label: "Catalog", href: "/admin?tab=catalog", icon: Layers },
  { id: "news", label: "News", href: "/admin?tab=news", icon: Newspaper },
  { id: "shop-orders", label: "Shop Orders", href: "/admin?tab=shop-orders", icon: ShoppingBag },
  { id: "marketplace-orders", label: "Marketplace", href: "/admin?tab=marketplace-orders", icon: ArrowLeftRight },
  { id: "shipping", label: "Shipping", href: "/admin?tab=shipping", icon: Truck },
  { id: "disputes", label: "Disputes", href: "/admin?tab=disputes", icon: AlertTriangle },
  { id: "wallet", label: "Wallet", href: "/admin?tab=wallet", icon: Coins },
  { id: "users", label: "Users", href: "/admin?tab=users", icon: Users },
  { id: "settings", label: "Settings", href: "/admin?tab=settings", icon: Settings },
];

export function getAdminTabLabel(tab: AdminTab): string {
  return ADMIN_MAIN_NAV.find((item) => item.id === tab)?.label ?? "Dashboard";
}

export function resolveAdminTab(tab: string | null): AdminTab {
  if (tab && ADMIN_TABS.has(tab as AdminTab)) return tab as AdminTab;
  return "reports";
}
