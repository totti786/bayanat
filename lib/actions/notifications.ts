"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";

export async function markAllNotificationsRead(): Promise<void> {
  const { org } = await requireOrg();
  await prisma.notification.updateMany({
    where: { orgId: org.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/");
}
