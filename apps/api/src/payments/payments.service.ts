import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "./stripe.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  /** Create (or reuse) a Stripe Connect account and return an onboarding link. */
  async startSellerOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");

    if (!this.stripe.enabled) {
      // MOCK mode: pretend onboarding succeeded so sellers can list locally.
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeConnectOnboarded: true, stripeConnectAccountId: `acct_mock_${userId}` },
      });
      return { mock: true, url: `${process.env.WEB_URL}/account/sell?onboarded=1` };
    }

    let accountId = user.stripeConnectAccountId;
    if (!accountId) {
      accountId = await this.stripe.createConnectAccount(user.email);
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeConnectAccountId: accountId },
      });
    }
    const link = await this.stripe.createConnectOnboardingLink(accountId);
    return { mock: false, url: link.url };
  }

  async sellerStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");
    if (!this.stripe.enabled) {
      return { onboarded: user.stripeConnectOnboarded, mock: true };
    }
    if (!user.stripeConnectAccountId) return { onboarded: false, mock: false };
    const onboarded = await this.stripe.isAccountOnboarded(user.stripeConnectAccountId);
    if (onboarded !== user.stripeConnectOnboarded) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeConnectOnboarded: onboarded },
      });
    }
    return { onboarded, mock: false };
  }
}
