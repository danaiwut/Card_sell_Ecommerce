/**
 * Consolidate all demo users into danaiwut077 and delete the rest.
 *
 * Usage (from repo root, with DATABASE_URL in .env):
 *   pnpm db:consolidate-users
 */
import { PrismaClient } from "@prisma/client";

const OWNER = {
  displayName: "danaiwut077",
  clerkId: "dev_danaiwut077",
  email: "danaiwut077@dev.cardverse",
  role: "admin",
};

const DEMO_PATTERNS = [
  { email: { endsWith: "@dev.cardverse" } },
  { email: { endsWith: "@cardverse.demo" } },
  { clerkId: { startsWith: "dev_" } },
  { clerkId: { startsWith: "seed_seller_" } },
  { email: { contains: "demo" } },
];

const prisma = new PrismaClient();

async function ensureOwner() {
  return prisma.user.upsert({
    where: { clerkId: OWNER.clerkId },
    create: OWNER,
    update: {
      displayName: OWNER.displayName,
      email: OWNER.email,
      role: OWNER.role,
    },
  });
}

async function reassignOwnership(ownerId, fromUserId) {
  await prisma.listing.updateMany({ where: { sellerId: fromUserId }, data: { sellerId: ownerId } });
  await prisma.marketplaceOrder.updateMany({
    where: { sellerId: fromUserId },
    data: { sellerId: ownerId },
  });
  await prisma.marketplaceOrder.updateMany({
    where: { buyerId: fromUserId },
    data: { buyerId: ownerId },
  });
  await prisma.trade.updateMany({ where: { sellerId: fromUserId }, data: { sellerId: ownerId } });
  await prisma.order.updateMany({ where: { userId: fromUserId }, data: { userId: ownerId } });
  await prisma.listingOffer.updateMany({
    where: { buyerId: fromUserId },
    data: { buyerId: ownerId },
  });
  await prisma.collectionItem.updateMany({
    where: { userId: fromUserId },
    data: { userId: ownerId },
  });
  await prisma.notification.updateMany({
    where: { userId: fromUserId },
    data: { userId: ownerId },
  });
  await prisma.sellerReview.updateMany({
    where: { authorId: fromUserId },
    data: { authorId: ownerId },
  });
  await prisma.sellerReview.updateMany({
    where: { sellerId: fromUserId },
    data: { sellerId: ownerId },
  });
  await prisma.newsPost.updateMany({ where: { authorId: fromUserId }, data: { authorId: ownerId } });
  await prisma.withdrawalRequest.updateMany({
    where: { userId: fromUserId },
    data: { userId: ownerId },
  });
  await prisma.topUpRequest.updateMany({
    where: { userId: fromUserId },
    data: { userId: ownerId },
  });
  await prisma.topUpRequest.updateMany({
    where: { processedById: fromUserId },
    data: { processedById: ownerId },
  });
  await prisma.address.updateMany({ where: { userId: fromUserId }, data: { userId: ownerId } });

  const fromCart = await prisma.cart.findUnique({ where: { userId: fromUserId } });
  if (fromCart) {
    const ownerCart = await prisma.cart.upsert({
      where: { userId: ownerId },
      create: { userId: ownerId },
      update: {},
    });
    await prisma.cartItem.updateMany({
      where: { cartId: fromCart.id },
      data: { cartId: ownerCart.id },
    });
    await prisma.cart.delete({ where: { id: fromCart.id } });
  }

  const fromWallet = await prisma.wallet.findUnique({ where: { userId: fromUserId } });
  if (fromWallet) {
    const ownerWallet = await prisma.wallet.upsert({
      where: { userId: ownerId },
      create: { userId: ownerId, balance: fromWallet.balance, heldBalance: fromWallet.heldBalance },
      update: {
        balance: { increment: fromWallet.balance },
        heldBalance: { increment: fromWallet.heldBalance },
      },
    });
    await prisma.walletTransaction.updateMany({
      where: { walletId: fromWallet.id },
      data: { walletId: ownerWallet.id },
    });
    await prisma.wallet.delete({ where: { id: fromWallet.id } });
  }
}

async function main() {
  const owner = await ensureOwner();
  console.log(`Owner: ${owner.displayName} (${owner.id})`);

  const demoUsers = await prisma.user.findMany({
    where: {
      AND: [{ id: { not: owner.id } }, { OR: DEMO_PATTERNS }],
    },
    select: { id: true, email: true, displayName: true, clerkId: true },
  });

  console.log(`Found ${demoUsers.length} demo user(s) to remove`);

  for (const user of demoUsers) {
    console.log(`  Reassigning & deleting: ${user.displayName} (${user.email})`);
    await reassignOwnership(owner.id, user.id);
    await prisma.user.delete({ where: { id: user.id } });
  }

  console.log("Done — all demo users consolidated into danaiwut077");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
