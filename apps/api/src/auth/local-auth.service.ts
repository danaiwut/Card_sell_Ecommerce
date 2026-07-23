import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createEntityId } from "@cardverse/db";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  Role,
} from "@cardverse/shared";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
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

const PASSWORD_RESET_MESSAGE =
  "หากมีบัญชีที่ใช้อีเมลนี้ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้ภายในไม่กี่นาที";

@Injectable()
export class LocalAuthService {
  private readonly jwtSecret =
    process.env.AUTH_JWT_SECRET?.trim() || "dev-jwt-secret-change-in-production";
  private readonly jwtExpiresIn = process.env.AUTH_JWT_EXPIRES_IN?.trim() || "7d";
  private readonly resetExpiresMs = parseResetExpiry(
    process.env.PASSWORD_RESET_EXPIRES_IN?.trim() || "1h",
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

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

  async requestPasswordReset(input: ForgotPasswordInput): Promise<{ message: string }> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user?.passwordHash) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + this.resetExpiresMs);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const webUrl = (process.env.WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const resetUrl = `${webUrl}/reset-password?token=${token}`;
      await this.email.sendPasswordResetEmail(email, resetUrl);
    }

    return { message: PASSWORD_RESET_MESSAGE };
  }

  async resetPassword(input: ResetPasswordInput): Promise<AuthSessionDto> {
    const tokenHash = hashResetToken(input.token.trim());
    const user = await this.findUserByResetTokenHash(tokenHash);
    if (!user) {
      throw new BadRequestException("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว");
    }

    const expiresAt = user.passwordResetExpiresAt;
    if (!expiresAt || expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return this.issueSession(updated);
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

  private async findUserByResetTokenHash(tokenHash: string) {
    return this.prisma.user.findFirst({
      where: { passwordResetTokenHash: tokenHash },
    });
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

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseResetExpiry(value: string): number {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) return 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * (multipliers[unit] ?? 60 * 60 * 1000);
}
