import { prisma } from "@cardverse/db";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function aggregatePrices(catalogItemId: string) {
  const since = new Date(Date.now() - 365 * DAY_MS);
  const trades = await prisma.trade.findMany({
    where: { catalogItemId, soldAt: { gte: since } },
    select: { price: true, soldAt: true },
  });

  const buckets = new Map<string, number[]>();
  for (const t of trades) {
    const day = new Date(t.soldAt);
    day.setUTCHours(0, 0, 0, 0);
    const key = day.toISOString();
    const arr = buckets.get(key) ?? [];
    arr.push(t.price);
    buckets.set(key, arr);
  }

  for (const [iso, prices] of buckets) {
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    await prisma.pricePoint.upsert({
      where: { catalogItemId_day: { catalogItemId, day: new Date(iso) } },
      update: { avg, low: Math.min(...prices), high: Math.max(...prices), volume: prices.length },
      create: {
        catalogItemId,
        day: new Date(iso),
        avg,
        low: Math.min(...prices),
        high: Math.max(...prices),
        volume: prices.length,
      },
    });
  }
  return { catalogItemId, buckets: buckets.size };
}
