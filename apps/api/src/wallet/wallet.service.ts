import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { toBaht } from "../common/serializers";

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async getOrCreate(userId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;

    const wallet = await this.prisma.wallet.create({ data: { userId } });

    // Demo mode: grant welcome credits so new users can shop immediately.
    if (!process.env.STRIPE_SECRET_KEY) {
      const welcome = 500_000; // ฿5,000 in satang
      await this.credit(wallet.id, welcome, "TOP_UP", {
        description: "เครดิตต้อนรับ Demo ฿5,000",
        referenceType: "welcome",
      });
      return (await this.prisma.wallet.findUnique({ where: { id: wallet.id } }))!;
    }

    return wallet;
  }

  async getSummary(userId: string) {
    const wallet = await this.getOrCreate(userId);
    return {
      balance: toBaht(wallet.balance),
      heldBalance: toBaht(wallet.heldBalance),
      available: toBaht(wallet.balance),
      total: toBaht(wallet.balance + wallet.heldBalance),
    };
  }

  async listTransactions(userId: string, limit = 50) {
    const wallet = await this.getOrCreate(userId);
    const rows = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: toBaht(t.amount),
      balanceAfter: toBaht(t.balanceAfter),
      description: t.description,
      referenceType: t.referenceType,
      referenceId: t.referenceId,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  /** Demo top-up — instant credit without real payment gateway. */
  async topUp(userId: string, amountBaht: number) {
    if (amountBaht < 10 || amountBaht > 100_000) {
      throw new BadRequestException("จำนวนเติมเครดิตต้องอยู่ระหว่าง ฿10 – ฿100,000");
    }
    const amount = Math.round(amountBaht * 100);
    const wallet = await this.getOrCreate(userId);
    const updated = await this.credit(wallet.id, amount, "TOP_UP", {
      description: `เติมเครดิต ฿${amountBaht.toLocaleString()}`,
      referenceType: "topup",
    });
    await this.queue.enqueueNotification({
      userId,
      type: "CREDIT",
      title: "เติมเครดิตสำเร็จ",
      body: `ยอดเครดิตคงเหลือ ฿${toBaht(updated.balance).toLocaleString()}`,
      link: "/account/wallet",
    });
    return { balance: toBaht(updated.balance), added: amountBaht };
  }

  /** Admin/Manager grants credits to a user. */
  async adminGrant(
    targetUserId: string,
    amountBaht: number,
    grantedById: string,
    note?: string,
  ) {
    if (amountBaht <= 0 || amountBaht > 500_000) {
      throw new BadRequestException("จำนวนเครดิตไม่ถูกต้อง");
    }
    const amount = Math.round(amountBaht * 100);
    const wallet = await this.getOrCreate(targetUserId);
    const updated = await this.credit(wallet.id, amount, "ADMIN_GRANT", {
      description: note ?? `เครดิตจากแอดมิน ฿${amountBaht.toLocaleString()}`,
      referenceType: "grant",
      createdById: grantedById,
    });
    await this.queue.enqueueNotification({
      userId: targetUserId,
      type: "CREDIT",
      title: "ได้รับเครดิต",
      body: `+฿${amountBaht.toLocaleString()} — ยอดคงเหลือ ฿${toBaht(updated.balance).toLocaleString()}`,
      link: "/account/wallet",
    });
    return { balance: toBaht(updated.balance), granted: amountBaht };
  }

  /** Deduct credits for shop purchase. */
  async payShopOrder(userId: string, orderId: string, amountSatang: number) {
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance < amountSatang) {
      throw new BadRequestException(
        `เครดิตไม่พอ — ต้องการ ฿${toBaht(amountSatang).toLocaleString()} แต่มี ฿${toBaht(wallet.balance).toLocaleString()}`,
      );
    }
    return this.debit(wallet.id, amountSatang, "PURCHASE", {
      description: `ชำระคำสั่งซื้อร้านค้า`,
      referenceType: "order",
      referenceId: orderId,
    });
  }

  /** Hold credits in escrow for marketplace purchase. */
  async holdEscrow(userId: string, orderId: string, amountSatang: number) {
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance < amountSatang) {
      throw new BadRequestException(
        `เครดิตไม่พอ — ต้องการ ฿${toBaht(amountSatang).toLocaleString()} แต่มี ฿${toBaht(wallet.balance).toLocaleString()}`,
      );
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amountSatang },
          heldBalance: { increment: amountSatang },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ESCROW_HOLD",
          amount: -amountSatang,
          balanceAfter: w.balance,
          description: `หักเครดิตเข้า Escrow (Marketplace)`,
          referenceType: "marketplace_order",
          referenceId: orderId,
        },
      });
      return w;
    });
    return updated;
  }

  /** Release escrow to seller after delivery confirmed. */
  async releaseEscrow(
    buyerId: string,
    sellerId: string,
    orderId: string,
    amountSatang: number,
    sellerPayoutSatang: number,
  ) {
    const buyerWallet = await this.getOrCreate(buyerId);
    const sellerWallet = await this.getOrCreate(sellerId);

    await this.prisma.$transaction(async (tx) => {
      const buyer = await tx.wallet.update({
        where: { id: buyerWallet.id },
        data: { heldBalance: { decrement: amountSatang } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: buyerWallet.id,
          type: "ESCROW_RELEASE",
          amount: 0,
          balanceAfter: buyer.balance,
          description: `ปล่อย Escrow ให้ผู้ขาย ฿${toBaht(sellerPayoutSatang).toLocaleString()}`,
          referenceType: "marketplace_order",
          referenceId: orderId,
        },
      });

      const seller = await tx.wallet.update({
        where: { id: sellerWallet.id },
        data: { balance: { increment: sellerPayoutSatang } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: sellerWallet.id,
          type: "ESCROW_RELEASE",
          amount: sellerPayoutSatang,
          balanceAfter: seller.balance,
          description: `ได้รับเครดิตจากการขาย`,
          referenceType: "marketplace_order",
          referenceId: orderId,
        },
      });
    });
  }

  /** Refund escrow back to buyer wallet. */
  async refundEscrow(buyerId: string, orderId: string, amountSatang: number) {
    const wallet = await this.getOrCreate(buyerId);
    await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          heldBalance: { decrement: amountSatang },
          balance: { increment: amountSatang },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: amountSatang,
          balanceAfter: w.balance,
          description: `คืนเครดิตจาก Escrow`,
          referenceType: "marketplace_order",
          referenceId: orderId,
        },
      });
    });
  }

  /** Seller requests withdrawal — credits exchanged with manager offline. */
  async requestWithdrawal(userId: string, amountBaht: number, note?: string) {
    if (amountBaht < 100) {
      throw new BadRequestException("ถอนขั้นต่ำ ฿100");
    }
    const amount = Math.round(amountBaht * 100);
    const wallet = await this.getOrCreate(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException("เครดิตไม่พอสำหรับการถอน");
    }

    const withdrawal = await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAWAL",
          amount: -amount,
          balanceAfter: w.balance,
          description: `ขอถอนเครดิต ฿${amountBaht.toLocaleString()}`,
          referenceType: "withdrawal",
        },
      });
      return tx.withdrawalRequest.create({
        data: { userId, amount, note, status: "PENDING" },
      });
    });

    await this.queue.enqueueNotification({
      userId,
      type: "WITHDRAWAL",
      title: "ส่งคำขอถอนเครดิตแล้ว",
      body: `฿${amountBaht.toLocaleString()} — รอเมเนเจอร์อนุมัติ`,
      link: "/account/withdraw",
    });

    return {
      id: withdrawal.id,
      amount: amountBaht,
      status: withdrawal.status,
    };
  }

  async listMyWithdrawals(userId: string) {
    const rows = await this.prisma.withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((w) => ({
      id: w.id,
      amount: toBaht(w.amount),
      status: w.status,
      note: w.note,
      managerNote: w.managerNote,
      processedAt: w.processedAt?.toISOString() ?? null,
      createdAt: w.createdAt.toISOString(),
    }));
  }

  async listPendingWithdrawals() {
    const rows = await this.prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((w) => ({
      id: w.id,
      amount: toBaht(w.amount),
      status: w.status,
      note: w.note,
      user: { id: w.user.id, displayName: w.user.displayName, email: w.user.email },
      createdAt: w.createdAt.toISOString(),
    }));
  }

  async approveWithdrawal(withdrawalId: string, managerId: string, note?: string) {
    const req = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });
    if (!req) throw new NotFoundException("ไม่พบคำขอถอน");
    if (req.status !== "PENDING") throw new BadRequestException("คำขอนี้ดำเนินการแล้ว");

    await this.prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: "COMPLETED",
        processedById: managerId,
        processedAt: new Date(),
        managerNote: note ?? "อนุมัติแล้ว — โอนเงินสดให้ผู้ขายเรียบร้อย",
      },
    });

    await this.queue.enqueueNotification({
      userId: req.userId,
      type: "WITHDRAWAL",
      title: "ถอนเครดิตสำเร็จ",
      body: `฿${toBaht(req.amount).toLocaleString()} — เมเนเจอร์โอนเงินสดให้แล้ว`,
      link: "/account/withdraw",
    });

    return { ok: true };
  }

  async rejectWithdrawal(
    withdrawalId: string,
    managerId: string,
    reason?: string,
  ) {
    const req = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });
    if (!req) throw new NotFoundException("ไม่พบคำขอถอน");
    if (req.status !== "PENDING") throw new BadRequestException("คำขอนี้ดำเนินการแล้ว");

    const wallet = await this.getOrCreate(req.userId);
    await this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: req.amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "WITHDRAWAL_REFUND",
          amount: req.amount,
          balanceAfter: w.balance,
          description: reason ?? "คืนเครดิต — คำขอถอนถูกปฏิเสธ",
          referenceType: "withdrawal",
          referenceId: withdrawalId,
        },
      });
      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          processedById: managerId,
          processedAt: new Date(),
          managerNote: reason ?? "ปฏิเสธคำขอถอน",
        },
      });
    });

    await this.queue.enqueueNotification({
      userId: req.userId,
      type: "WITHDRAWAL",
      title: "คำขอถอนถูกปฏิเสธ",
      body: reason ?? "เครดิตถูกคืนเข้ากระเป๋าแล้ว",
      link: "/account/withdraw",
    });

    return { ok: true };
  }

  async listAllWallets() {
    const wallets = await this.prisma.wallet.findMany({
      include: { user: true },
      orderBy: { balance: "desc" },
      take: 200,
    });
    return wallets.map((w) => ({
      userId: w.userId,
      displayName: w.user.displayName,
      email: w.user.email,
      role: w.user.role,
      balance: toBaht(w.balance),
      heldBalance: toBaht(w.heldBalance),
    }));
  }

  private async credit(
    walletId: string,
    amount: number,
    type:
      | "TOP_UP"
      | "ADMIN_GRANT"
      | "PURCHASE"
      | "ESCROW_HOLD"
      | "ESCROW_RELEASE"
      | "WITHDRAWAL"
      | "WITHDRAWAL_REFUND"
      | "REFUND",
    meta: {
      description?: string;
      referenceType?: string;
      referenceId?: string;
      createdById?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId,
          type,
          amount,
          balanceAfter: w.balance,
          ...meta,
        },
      });
      return w;
    });
  }

  private async debit(
    walletId: string,
    amount: number,
    type: "PURCHASE" | "WITHDRAWAL",
    meta: {
      description?: string;
      referenceType?: string;
      referenceId?: string;
    },
  ) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException("เครดิตไม่เพียงพอ");
    }
    return this.prisma.$transaction(async (tx) => {
      const w = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId,
          type,
          amount: -amount,
          balanceAfter: w.balance,
          ...meta,
        },
      });
      return w;
    });
  }
}
