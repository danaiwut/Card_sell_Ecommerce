import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import type { Role } from "@cardverse/shared";
import type { Request } from "express";
import type { AuthUser } from "./auth.types";

export const IS_PUBLIC_KEY = "isPublic";
/** Mark a route as not requiring authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const OPTIONAL_AUTH_KEY = "optionalAuth";
/** Authenticate if a token is present, but don't reject anonymous users. */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Inject the authenticated user (or a specific field of it). */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req.user;
    return field ? user?.[field] : user;
  },
);
