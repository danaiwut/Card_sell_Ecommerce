import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { JsonClient } from "@cardverse/db";

@Injectable()
export class PrismaService extends JsonClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
