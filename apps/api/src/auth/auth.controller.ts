import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { Webhook } from "svix";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "./decorators";

/**
 * Clerk webhooks: keep the local User table in sync with Clerk.
 * Role lives in Clerk publicMetadata.role and is mirrored here.
 */
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post("clerk/webhook")
  @HttpCode(200)
  async clerkWebhook(
    @Body() body: any,
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    let evt = body;
    if (secret) {
      try {
        const wh = new Webhook(secret);
        evt = wh.verify(JSON.stringify(body), {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
      } catch {
        throw new BadRequestException("Invalid webhook signature");
      }
    }

    const type = evt.type as string;
    const data = evt.data;

    if (type === "user.created" || type === "user.updated") {
      const clerkId = data.id as string;
      const email =
        data.email_addresses?.[0]?.email_address ?? `${clerkId}@users.cardverse`;
      const displayName =
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        data.username ||
        email.split("@")[0];
      const role = data.public_metadata?.role ?? "customer";

      await this.prisma.user.upsert({
        where: { clerkId },
        update: { email, displayName, role },
        create: { clerkId, email, displayName, role },
      });
    }

    if (type === "user.deleted") {
      const clerkId = data.id as string;
      await this.prisma.user
        .delete({ where: { clerkId } })
        .catch(() => undefined);
    }

    return { received: true };
  }
}
