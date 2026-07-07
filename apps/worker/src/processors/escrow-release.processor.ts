import { prisma } from "@cardverse/db";
import { callInternal } from "../internal-api";

export async function releaseEscrow(orderId: string) {
  const order = await prisma.marketplaceOrder.findUnique({ where: { id: orderId } });
  if (!order) return { skipped: "missing" };
  // Only auto-release if still in a shippable/holding state and past due.
  if (!["SHIPPED", "DELIVERED"].includes(order.status)) {
    return { skipped: order.status };
  }
  if (order.releaseDueAt && order.releaseDueAt.getTime() > Date.now()) {
    return { skipped: "not-due" };
  }
  return callInternal(`/orders/${orderId}/release-escrow`);
}
