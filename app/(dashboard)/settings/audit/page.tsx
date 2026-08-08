import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getUiLang } from "@/lib/ui-lang";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, { en: string; ar: string }> = {
  "invoice.created": { en: "Invoice created", ar: "إنشاء فاتورة" },
  "invoice.updated": { en: "Invoice updated", ar: "تعديل فاتورة" },
  "invoice.sent": { en: "Invoice sent", ar: "إرسال فاتورة" },
  "invoice.signed": { en: "Invoice signed", ar: "توقيع فاتورة" },
  "payment.created": { en: "Payment recorded", ar: "تسجيل دفعة" },
  "client.created": { en: "Client created", ar: "إنشاء عميل" },
  "client.updated": { en: "Client updated", ar: "تعديل عميل" },
  "client.deleted": { en: "Client deleted", ar: "حذف عميل" },
  "settings.updated": { en: "Settings changed", ar: "تغيير الإعدادات" },
};

export default async function AuditPage() {
  const { org, role } = await requireOrg();
  const lang = await getUiLang();

  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-500">
            {lang === "ar" ? "فقط المدراء يمكنهم الاطلاع على سجل التدقيق." : "Only admins can view the audit log."}
          </p>
        </Card>
      </div>
    );
  }

  const entries = await prisma.auditLog.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {lang === "ar" ? "سجل التدقيق" : "Audit log"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {lang === "ar" ? "سجل بآخر التغييرات" : "A record of recent changes"}
        </p>
      </div>

      <Card>
        {entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">
            {lang === "ar" ? "لا توجد سجلات بعد" : "No activity yet"}
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {entries.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800">
                    {lang === "ar"
                      ? ACTION_LABELS[e.action]?.ar ?? e.action
                      : ACTION_LABELS[e.action]?.en ?? e.action}
                  </p>
                  {e.detail && <p className="mt-0.5 truncate text-xs text-neutral-400">{e.detail}</p>}
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-xs text-neutral-500">{e.userEmail ?? "—"}</p>
                  <p className="text-[11px] text-neutral-400">{fmt.format(e.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
