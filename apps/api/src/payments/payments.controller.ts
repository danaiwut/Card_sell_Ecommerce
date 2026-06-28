import { Controller, Get, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CurrentUser } from "../auth/decorators";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("connect/onboard")
  onboard(@CurrentUser("id") userId: string) {
    return this.payments.startSellerOnboarding(userId);
  }

  @Get("connect/status")
  status(@CurrentUser("id") userId: string) {
    return this.payments.sellerStatus(userId);
  }
}
