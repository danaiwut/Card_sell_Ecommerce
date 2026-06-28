import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

/** Guards internal endpoints called by the worker (shared secret). */
@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const secret = process.env.INTERNAL_API_SECRET ?? "dev-internal-secret";
    if (req.headers["x-internal-secret"] !== secret) {
      throw new UnauthorizedException("Invalid internal secret");
    }
    return true;
  }
}
