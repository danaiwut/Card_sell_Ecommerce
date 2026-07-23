#!/usr/bin/env node
/**
 * One-time import: Supabase/PostgreSQL (Prisma schema) → local JSON files.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." pnpm db:import
 *
 * Loads DATABASE_URL from root .env or packages/db/.env if not set in the shell.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

/** Prisma model name → PostgreSQL table name (default) → JSON file */
const TABLE_MAP = [
  ["User", "users.json"],
  ["Wallet", "wallets.json"],
  ["WalletTransaction", "transactions.json"],
  ["WithdrawalRequest", "withdrawal-requests.json"],
  ["TopUpRequest", "top-up-requests.json"],
  ["Address", "addresses.json"],
  ["Category", "categories.json"],
  ["Subcategory", "subcategories.json"],
  ["Brand", "brands.json"],
  ["CardSet", "card-sets.json"],
  ["CatalogItem", "catalog-items.json"],
  ["Product", "products.json"],
  ["Cart", "carts.json"],
  ["CartItem", "cart-items.json"],
  ["Order", "orders.json"],
  ["OrderItem", "order-items.json"],
  ["Coupon", "coupons.json"],
  ["Listing", "listings.json"],
  ["ListingOffer", "offers.json"],
  ["MarketplaceOrder", "marketplace-orders.json"],
  ["Trade", "trades.json"],
  ["PricePoint", "price-points.json"],
  ["SellerReview", "reviews.json"],
  ["Shipment", "shipments.json"],
  ["ShipmentEvent", "shipment-events.json"],
  ["CollectionItem", "collection-items.json"],
  ["Notification", "notifications.json"],
  ["NewsPost", "news.json"],
  ["PlatformSetting", "settings.json"],
];

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const fromRoot = parseEnvFile(path.join(repoRoot, ".env")).DATABASE_URL;
  if (fromRoot?.trim()) return fromRoot.trim();
  const fromPkg = parseEnvFile(path.join(repoRoot, "packages/db/.env")).DATABASE_URL;
  if (fromPkg?.trim()) return fromPkg.trim();
  return null;
}

function hostLabel(connectionString) {
  try {
    const normalized = connectionString.replace(/^postgresql:/, "http:");
    return new URL(normalized).hostname;
  } catch {
    return "(unknown host)";
  }
}

function serializeValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (typeof value === "object" && !Array.isArray(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  return value;
}

function serializeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = serializeValue(value);
  }
  return out;
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  );
  return rows.length > 0;
}

async function fetchTable(client, tableName) {
  const { rows } = await client.query(`SELECT * FROM "${tableName}"`);
  return rows.map(serializeRow);
}

async function main() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    console.error(
      "DATABASE_URL not found.\n" +
        "Add your Supabase connection string to .env:\n" +
        '  DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"\n' +
        "Then run: pnpm db:import",
    );
    process.exit(1);
  }

  const dataDir =
    process.env.CARDVERSE_DATA_DIR?.trim() ||
    parseEnvFile(path.join(repoRoot, ".env")).CARDVERSE_DATA_DIR ||
    path.join(repoRoot, "data");

  const resolvedDataDir = path.resolve(repoRoot, dataDir.replace(/^\.\//, ""));
  await mkdir(resolvedDataDir, { recursive: true });

  console.log(`Connecting to ${hostLabel(databaseUrl)} …`);
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log("Connected.\n");

    const summary = [];
    let totalRows = 0;

    for (const [tableName, fileName] of TABLE_MAP) {
      const exists = await tableExists(client, tableName);
      if (!exists) {
        summary.push({ table: tableName, file: fileName, rows: 0, status: "missing table" });
        continue;
      }

      const records = await fetchTable(client, tableName);
      const filePath = path.join(resolvedDataDir, fileName);
      await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
      totalRows += records.length;
      summary.push({ table: tableName, file: fileName, rows: records.length, status: "ok" });
    }

    console.log("Import summary:");
    for (const row of summary) {
      const pad = row.table.padEnd(22);
      console.log(`  ${pad} → ${row.file.padEnd(28)} ${String(row.rows).padStart(5)}  ${row.status}`);
    }
    console.log(`\nTotal: ${totalRows} rows → ${resolvedDataDir}`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("Import failed:", error.message || error);
  process.exit(1);
});
