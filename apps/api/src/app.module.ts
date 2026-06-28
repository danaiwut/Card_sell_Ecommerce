import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { QueueModule } from "./queue/queue.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ProductsModule } from "./products/products.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { ShippingModule } from "./shipping/shipping.module";
import { InternalModule } from "./internal/internal.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { NewsModule } from "./news/news.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { CollectionModule } from "./collection/collection.module";
import { UsersModule } from "./users/users.module";
import { AdminModule } from "./admin/admin.module";
import { StorageModule } from "./storage/storage.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    RealtimeModule,
    QueueModule,
    AuthModule,
    CatalogModule,
    ProductsModule,
    CartModule,
    PaymentsModule,
    OrdersModule,
    MarketplaceModule,
    ShippingModule,
    InternalModule,
    WebhooksModule,
    NewsModule,
    NotificationsModule,
    CollectionModule,
    UsersModule,
    StorageModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
