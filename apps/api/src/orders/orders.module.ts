import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { PaymentsModule } from "../payments/payments.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [PaymentsModule, WalletModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
