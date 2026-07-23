import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const from = process.env.EMAIL_FROM?.trim() || "noreply@cardverse.local";
    const subject = "รีเซ็ตรหัสผ่าน CardVerse";
    const text = [
      "คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี CardVerse",
      "",
      `เปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ภายใน 1 ชั่วโมง):`,
      resetUrl,
      "",
      "หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถละเว้นอีเมลนี้ได้",
    ].join("\n");

    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, text }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Resend failed (${res.status}): ${body}`);
        throw new Error("Failed to send reset email");
      }
      return;
    }

    // Dev / no provider — log link so local testing works without SMTP.
    this.logger.warn(`[dev email] To: ${to}`);
    this.logger.warn(`[dev email] Subject: ${subject}`);
    this.logger.warn(`[dev email] Reset URL: ${resetUrl}`);
  }
}
