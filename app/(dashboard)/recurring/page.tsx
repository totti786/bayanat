import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { formatMoney, formatDate, type Lang, type Numerals } from "@/lib/format";
import { Card, Badge } from "@/components/ui";
import RecurringList from "@/components/RecurringList";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const { org } = await requireOrg();
  const uiLang = await getUiLang();
  const numerals: Numerals = org.numerals === "eastern" ? "eastern" : "western";
  const langOf = (l: string): Lang => (l === "ar" ? "ar" : "en");

  const rules = await prisma.recurringRule.findMany({
    where: { orgId: org.id },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const freqLabel: Record<string, string> = {
    weekly: u("weekly", uiLang),
    monthly: u("monthly", uiLang),
    quarterly: u("quarterly", uiLang),
    yearly: u("yearly", uiLang),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{u("recurring", uiLang)} {u("invoices", uiLang)}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {u("recurringSubtitle", uiLang)}
        </p>
      </div>

      <Card>
        {rules.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-500">{uiLang === "ar" ? "لا توجد جداول متكررة بعد" : "No recurring schedules yet"}</p>
            <p className="mt-1 text-xs text-neutral-400">
              {uiLang === "ar" ? "افتح فاتورة مرسلة واضغط «تكرار…»" : "Open a sent invoice and press “Repeat…” to set one up"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {rules.map((rule) => {
              const amount = rule.itemsJson
                ? JSON.parse(rule.itemsJson).reduce(
                    (s: number, it: { unitPrice: number; quantity: number }) =>
                      s + it.unitPrice * it.quantity,
                    0
                  )
                : 0;
              return (
                <div key={rule.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {rule.client.name}
                      <span className="ml-2 text-sm font-normal text-neutral-400">
                        {freqLabel[rule.frequency]} · every {rule.interval}
                      </span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      {uiLang === "ar" ? "التالي:" : "Next:"} {formatDate(rule.nextRun, langOf(rule.lang), numerals)} ·{" "}
                      {formatMoney(amount, rule.currency, langOf(rule.lang), numerals)} 
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={rule.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                      {rule.active ? u("active", uiLang) : u("paused", uiLang)}
                    </Badge>
                    <RecurringList ruleId={rule.id} active={rule.active} lang={uiLang} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
