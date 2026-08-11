import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui";
import SettingsForm from "@/components/SettingsForm";
import CompaniesPanel from "@/components/CompaniesPanel";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireOrg();
  const { org, role } = user;
  const lang = await getUiLang();

  const companies = [
    ...(org ? [{ id: org.id, name: org.name, role: user.memberships?.find((m) => m.orgId === org.id)?.role ?? user.role }] : []),
    ...(user.memberships ?? [])
      .filter((m) => m.orgId !== org?.id)
      .map((m) => ({ id: m.orgId, name: m.org.name, role: m.role })),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{u("settings", lang)}</h1>
          <p className="mt-1 text-sm text-neutral-500">{u("settingsSubtitle", lang)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/settings/team"
            className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            {u("teamMembers", lang)}
          </Link>
          <Link
            href="/settings/audit"
            className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            {lang === "ar" ? "سجل التدقيق" : "Audit log"}
          </Link>
        </div>
      </div>

      <CompaniesPanel companies={companies} activeId={org?.id ?? ""} lang={lang} />

      {role !== "admin" ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-500">
            {lang === "ar" ? "فقط المدراء يمكنهم تعديل إعدادات المؤسسة." : "Only admins can edit organization settings."}
          </p>
        </Card>
      ) : (
        <SettingsForm
          lang={lang}
          org={{
            name: org.name,
            nameAr: org.nameAr,
            address: org.address,
            addressAr: org.addressAr,
            vatId: org.vatId,
            bankDetails: org.bankDetails,
            logoUrl: org.logoUrl,
            prefix: org.prefix,
            defaultCurrency: org.defaultCurrency,
            defaultTaxName: org.defaultTaxName,
            defaultTaxRate: org.defaultTaxRate,
            taxInclusive: org.taxInclusive,
            numerals: org.numerals,
            defaultTemplate: org.defaultTemplate,
            hijriDates: org.hijriDates,
            signKey: org.signKey,
            signCert: org.signCert,
            paymentMethods: JSON.parse(org.paymentMethods ?? "[]") as string[],
            lateFeePercent: org.lateFeePercent,
            reportCurrency: org.reportCurrency,
            themeAccent: org.themeAccent,
          }}
        />
      )}
    </div>
  );
}
