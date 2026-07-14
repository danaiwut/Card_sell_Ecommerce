import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { CurrentUser, Roles } from "../auth/decorators";

@Controller("wallet")
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  summary(@CurrentUser("id") userId: string) {
    return this.wallet.getSummary(userId);
  }

  @Get("transactions")
  transactions(@CurrentUser("id") userId: string) {
    return this.wallet.listTransactions(userId);
  }

  @Post("top-up")
  topUp(@CurrentUser("id") userId: string, @Body() body: { amount: number }) {
    return this.wallet.topUp(userId, Number(body.amount));
  }

  @Post("withdraw")
  withdraw(
    @CurrentUser("id") userId: string,
    @Body() body: { amount: number; note?: string },
  ) {
    return this.wallet.requestWithdrawal(userId, Number(body.amount), body.note);
  }

  @Get("withdrawals")
  myWithdrawals(@CurrentUser("id") userId: string) {
    return this.wallet.listMyWithdrawals(userId);
  }

  @Roles("manager", "admin")
  @Get("admin/all")
  allWallets() {
    return this.wallet.listAllWallets();
  }

  @Roles("manager", "admin")
  @Post("admin/grant")
  grant(
    @CurrentUser("id") grantedById: string,
    @Body() body: { userId: string; amount: number; note?: string },
  ) {
    return this.wallet.adminGrant(body.userId, Number(body.amount), grantedById, body.note);
  }

  @Roles("manager", "admin")
  @Get("admin/withdrawals")
  pendingWithdrawals() {
    return this.wallet.listPendingWithdrawals();
  }

  @Roles("manager", "admin")
  @Post("admin/withdrawals/:id/approve")
  approve(
    @CurrentUser("id") managerId: string,
    @Param("id") id: string,
    @Body() body: { note?: string },
  ) {
    return this.wallet.approveWithdrawal(id, managerId, body.note);
  }

  @Roles("manager", "admin")
  @Post("admin/withdrawals/:id/reject")
  reject(
    @CurrentUser("id") managerId: string,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    return this.wallet.rejectWithdrawal(id, managerId, body.reason);
  }
}
