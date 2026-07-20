import { Injectable } from "@nestjs/common";
import type { MarketStatsDto, PricePoint } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { createKeyedResponseCache } from "../common/response-cache";
import { serializeTrade, toBaht } from "../common/serializers";

const DAY_MS = 24 * 60 * 60 * 1000;
const statsCache = createKeyedResponseCache<MarketStatsDto>(60_000);
const recentSalesCache = createKeyedResponseCache<unknown[]>(30_000);

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Market stats for a catalog item. The chart and the today/7d/30d figures
   * are derived ONLY from completed marketplace sales (Trade), i.e. real
   * transacted prices — never from list prices.
   */
  async stats(catalogItemId: string, days = 30): Promise<MarketStatsDto> {
    return statsCache.get(`${catalogItemId}:${days}`, async () => {
      const since = new Date(Date.now() - days * DAY_MS);
      const trades = await this.prisma.trade.findMany({
        where: { catalogItemId, soldAt: { gte: since } },
        orderBy: { soldAt: "asc" },
        select: { price: true, soldAt: true },
      });

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayTrades = trades.filter((t) => t.soldAt >= startOfDay);
      const avg7 = this.avg(trades, 7);
      const avg30 = this.avg(trades, 30);

      const lowest = await this.prisma.listing.findFirst({
        where: { catalogItemId, status: "ACTIVE" },
        orderBy: { price: "asc" },
        select: { price: true },
      });

      return {
        catalogItemId,
        today: todayTrades.length ? toBaht(this.mean(todayTrades.map((t) => t.price))) : null,
        avg7d: avg7,
        avg30d: avg30,
        lowestActiveListing: lowest ? toBaht(lowest.price) : null,
        history: this.bucketByDay(trades),
      };
    });
  }

  async recentSales(limit = 15) {
    return recentSalesCache.get(String(limit), async () => {
      const trades = await this.prisma.trade.findMany({
        orderBy: { soldAt: "desc" },
        take: limit,
        include: {
          catalogItem: true,
          seller: true,
        },
      });
      return trades.map(serializeTrade);
    });
  }

  private avg(trades: { price: number; soldAt: Date }[], days: number): number | null {
    const since = new Date(Date.now() - days * DAY_MS);
    const subset = trades.filter((t) => t.soldAt >= since);
    if (!subset.length) return null;
    return toBaht(this.mean(subset.map((t) => t.price)));
  }

  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private bucketByDay(trades: { price: number; soldAt: Date }[]): PricePoint[] {
    const buckets = new Map<string, number[]>();
    for (const t of trades) {
      const day = new Date(t.soldAt);
      day.setHours(0, 0, 0, 0);
      const key = day.toISOString().slice(0, 10);
      const arr = buckets.get(key) ?? [];
      arr.push(t.price);
      buckets.set(key, arr);
    }
    return [...buckets.entries()].map(([date, prices]) => ({
      date,
      avg: toBaht(this.mean(prices)),
      low: toBaht(Math.min(...prices)),
      high: toBaht(Math.max(...prices)),
      volume: prices.length,
    }));
  }
}
