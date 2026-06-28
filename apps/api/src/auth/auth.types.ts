import type { Role } from "@cardverse/shared";

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  displayName: string;
  role: Role;
}

declare module "express" {
  interface Request {
    user?: AuthUser;
  }
}
