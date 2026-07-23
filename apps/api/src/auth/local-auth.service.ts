import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createEntityId } from "@cardverse/db";
import type { LoginInput, RegisterInput, Role } from "@cardverse/shared";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "./auth.types";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthSessionDto {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: Role;
  };
}

@Injectable()
export class LocalAuthService {
  private readonly jwtSecret =
    process.env.AUTH_JWT_SECRET?.trim() || "dev-jwt-secret-change-in-production";
  private readonly jwtExpiresIn = process.env.AUTH_JWT_EXPIRES_IN?.trim() || "7d";

  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterInput): Promise<AuthSessionDto> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("อีเมลนี้ถูกใช้งานแล้ว");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const clerkId = `local_${createEntityId("user", email)}`;

    const user = await this.prisma.user.create({
      data: {
        clerkId,
        email,
        displayName: input.displayName.trim(),
        passwordHash,
        role: "customer",
      },
    });

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthSessionDto> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    return this.issueSession(user);
  }

  async resolveUserFromRequest(req: Request): Promise<AuthUser | null> {
    const token = this.extractBearerToken(req);
    if (!token) return null;

    let payload: AuthTokenPayload;
    try {
      payload = jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    } catch {
      return null;
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      displayName: user.displayName,
      role: user.role as Role,
    };
  }

  private extractBearerToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }
    return undefined;
  }

  private issueSession(user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  }): AuthSessionDto {
    const role = user.role as Role;
    const token = jwt.sign(
      { sub: user.id, email: user.email, role } satisfies AuthTokenPayload,
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as SignOptions["expiresIn"] },
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role,
      },
    };
  }
}
