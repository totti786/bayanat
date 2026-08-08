import { prisma } from "@/lib/db";

interface AuditData {
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string;
}

/** Record an audit log entry. Never throws — auditing must not break actions. */
export async function audit(
  orgId: string,
  user: { id?: string | null; email?: string | null } | undefined | null,
  data: AuditData
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        orgId,
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? null,
        detail: data.detail ?? null,
      },
    });
  } catch {
    // ignore
  }
}
