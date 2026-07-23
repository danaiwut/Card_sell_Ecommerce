import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Role } from "@cardverse/shared";
import {
  IS_PUBLIC_KEY,
  OPTIONAL_AUTH_KEY,
  ROLES_KEY,
} from "./decorators";
import type { AuthUser } from "./auth.types";
import { LocalAuthService } from "./local-auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: LocalAuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const optional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    const user = await this.auth.resolveUserFromRequest(req);
    if (user) req.user = user;

    if (isPublic) return true;

    if (!user) {
      if (optional) return true;
      throw new UnauthorizedException("Authentication required");
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient role");
    }

    return true;
  }
}
