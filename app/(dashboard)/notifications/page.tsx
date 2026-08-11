import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { getUiLang } from "@/lib/ui-lang";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { Card, Button } from "@/components/ui";
import { Send, Wallet, FileSignature, UserPlus, RefreshCw, Bell, type LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, LucideIcon> = {
  invoice_sent: Send,
  payment_received: Wallet,
  invoice_signed: FileSignature,
  invite: UserPlus,
  recurring_generated: RefreshCw,
};

export default async function NotificationsPage() {
  const { org } = await requireOrg();
  const lang = await getUiLang();

  const notifications = await prisma.notification.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {lang === "ar" ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {unread > 0
              ? lang === "ar"
                ? `${unread} غير مقروء`
                : `${unread} unread`
              : lang === "ar"
                ? "كل شيء مقروء"
                : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary">
              {lang === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
            </Button>
          </form>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">
            {lang === "ar" ? "لا توجد إشعارات بعد" : "No notifications yet"}
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-3.5 ${n.read ? "opacity-60" : ""}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  {(() => {
                    const Icon = TYPE_ICON[n.type] ?? Bell;
                    return <Icon size={16} className="text-neutral-500" aria-hidden />;
                  })()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-800">
                    {lang === "ar" && n.titleAr ? n.titleAr : n.title}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(n.createdAt)}
                  </p>
                </div>
                {n.invoiceId && (
                  <Link
                    href={`/invoices/${n.invoiceId}`}
                    className="shrink-0 text-xs font-medium text-brand-700 hover:underline"
                  >
                    {lang === "ar" ? "فتح" : "Open"}
                  </Link>
                )}
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
