import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  readonly client: Stripe | null;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    this.client = key ? new Stripe(key) : null;
    if (!this.client) {
      this.logger.warn(
        "STRIPE_SECRET_KEY not set — payments run in MOCK mode (no real charges).",
      );
    }
  }

  get enabled() {
    return Boolean(this.client);
  }

  private require(): Stripe {
    if (!this.client) throw new BadRequestException("Stripe is not configured");
    return this.client;
  }

  // --- Shop checkout (first-party) ---
  async createCheckoutSession(params: {
    orderId: string;
    orderNumber: string;
    lineItems: { name: string; amount: number; quantity: number }[];
    customerEmail: string;
  }) {
    const stripe = this.require();
    return stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: params.customerEmail,
      line_items: params.lineItems.map((li) => ({
        quantity: li.quantity,
        price_data: {
          currency: "thb",
          unit_amount: li.amount,
          product_data: { name: li.name },
        },
      })),
      metadata: { orderId: params.orderId, kind: "shop" },
      success_url: `${process.env.WEB_URL}/account/orders?status=success&order=${params.orderNumber}`,
      cancel_url: `${process.env.WEB_URL}/cart?status=cancelled`,
    });
  }

  // --- Connect onboarding (sellers) ---
  async createConnectAccount(email: string) {
    const stripe = this.require();
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
    return account.id;
  }

  async createConnectOnboardingLink(accountId: string) {
    const stripe = this.require();
    return stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${process.env.WEB_URL}/account/sell?refresh=1`,
      return_url: `${process.env.WEB_URL}/account/sell?onboarded=1`,
    });
  }

  async isAccountOnboarded(accountId: string) {
    const stripe = this.require();
    const acct = await stripe.accounts.retrieve(accountId);
    return Boolean(acct.charges_enabled && acct.payouts_enabled);
  }

  // --- Marketplace escrow: charge buyer, hold on platform ---
  async createEscrowPaymentIntent(params: {
    amount: number; // satang
    orderId: string;
    customerEmail: string;
  }) {
    const stripe = this.require();
    // No transfer_data here: funds are held by the platform and only
    // transferred to the seller once delivery is confirmed (escrow).
    return stripe.paymentIntents.create({
      amount: params.amount,
      currency: "thb",
      receipt_email: params.customerEmail,
      metadata: { orderId: params.orderId, kind: "marketplace" },
    });
  }

  // --- Release escrow to the seller (minus platform fee) ---
  async transferToSeller(params: {
    amount: number; // satang (seller payout)
    destinationAccountId: string;
    orderId: string;
    sourceChargeId?: string;
  }) {
    const stripe = this.require();
    return stripe.transfers.create({
      amount: params.amount,
      currency: "thb",
      destination: params.destinationAccountId,
      source_transaction: params.sourceChargeId,
      metadata: { orderId: params.orderId },
    });
  }

  async refund(paymentIntentId: string) {
    const stripe = this.require();
    return stripe.refunds.create({ payment_intent: paymentIntentId });
  }

  constructEvent(payload: Buffer, signature: string) {
    const stripe = this.require();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException("Missing STRIPE_WEBHOOK_SECRET");
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
