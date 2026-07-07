import { prisma } from "@cardverse/db";

export async function persistNotification(jobData: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  const { userId, type, title, body, link } = jobData;
  await prisma.notification.create({
    data: { userId, type: type as any, title, body, link },
  });
  return { ok: true };
}
