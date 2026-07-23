import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";
import { AuthController } from "./auth.controller";
import { LocalAuthService } from "./local-auth.service";

@Global()
@Module({
  controllers: [AuthController],
  providers: [LocalAuthService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [LocalAuthService],
})
export class AuthModule {}
