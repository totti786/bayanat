import { prisma } from "@/lib/db";

interface NotifyData {
  type: string;
  title: string;
  titleAr?: string;
  invoiceId?: string;
}

/** Create an in-app notification for an organization. */
export async function notify(orgId: string, data: NotifyData): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        orgId,
        type: data.type,
        title: data.title,
        titleAr: data.titleAr,
        invoiceId: data.invoiceId,
      },
    });
  } catch {
    // notifications must never break the primary action
  }
}
