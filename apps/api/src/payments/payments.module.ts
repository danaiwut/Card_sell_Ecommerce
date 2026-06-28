import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";

@Module({
  controllers: [PaymentsController],
  providers: [StripeService, PaymentsService],
  exports: [StripeService, PaymentsService],
})
export class PaymentsModule {}
