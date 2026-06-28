import { Injectable, Logger } from "@nestjs/common";
import { createClerkClient, verifyToken } from "@clerk/backend";

export interface ClerkIdentity {
  clerkId: string;
  email: string;
  displayName: string;
}

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private readonly secretKey = process.env.CLERK_SECRET_KEY;
  private readonly client = this.secretKey
    ? createClerkClient({ secretKey: this.secretKey })
    : null;

  get enabled() {
    return Boolean(this.secretKey);
  }

  /** Verify a session JWT and resolve the Clerk identity. */
  async verify(token: string): Promise<ClerkIdentity | null> {
    if (!this.secretKey) return null;
    try {
      const payload = await verifyToken(token, { secretKey: this.secretKey });
      const clerkId = payload.sub;
      // Enrich from the Clerk API (email + name) — cached by Clerk SDK.
      const user = await this.client!.users.getUser(clerkId);
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        `${clerkId}@users.cardverse`;
      const displayName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        email.split("@")[0];
      return { clerkId, email, displayName };
    } catch (err) {
      this.logger.debug(`Clerk token verification failed: ${String(err)}`);
      return null;
    }
  }
}
