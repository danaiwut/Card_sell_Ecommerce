import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Role } from "@cardverse/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ClerkService } from "./clerk.service";
import {
  IS_PUBLIC_KEY,
  OPTIONAL_AUTH_KEY,
  ROLES_KEY,
} from "./decorators";
import type { AuthUser } from "./auth.types";

/**
 * Global guard:
 *  - resolves the authenticated user (Clerk, with a dev-header fallback),
 *  - syncs them into the local User table,
 *  - enforces @Public / @OptionalAuth / @Roles.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly clerk: ClerkService,
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

    const user = await this.resolveUser(req);
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

  private async resolveUser(req: Request): Promise<AuthUser | null> {
    const identity = await this.resolveIdentity(req);
    if (!identity) return null;

    const dbUser = await this.prisma.user.upsert({
      where: { clerkId: identity.clerkId },
      update: { email: identity.email },
      create: {
        clerkId: identity.clerkId,
        email: identity.email,
        displayName: identity.displayName,
        role: identity.role ?? "customer",
      },
    });

    return {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      displayName: dbUser.displayName,
      role: dbUser.role,
    };
  }

  private async resolveIdentity(req: Request) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (token && this.clerk.enabled) {
      const identity = await this.clerk.verify(token);
      if (identity) return { ...identity, role: undefined as Role | undefined };
    }

    // Dev fallback: impersonate via headers when Clerk is not configured.
    if (process.env.NODE_ENV !== "production") {
      const devId = req.headers["x-dev-user-id"] as string | undefined;
      if (devId) {
        const role = (req.headers["x-dev-role"] as Role) ?? "customer";
        return {
          clerkId: `dev_${devId}`,
          email: `${devId}@dev.cardverse`,
          displayName: devId,
          role,
        };
      }
    }

    return null;
  }
}
