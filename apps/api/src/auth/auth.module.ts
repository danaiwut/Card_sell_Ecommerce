import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ClerkService } from "./clerk.service";
import { AuthGuard } from "./auth.guard";
import { AuthController } from "./auth.controller";

@Global()
@Module({
  controllers: [AuthController],
  providers: [ClerkService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [ClerkService],
})
export class AuthModule {}
