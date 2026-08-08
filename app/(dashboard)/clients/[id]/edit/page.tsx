import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui";
import ClientForm from "@/components/ClientForm";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";


export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireOrg();
  const lang = await getUiLang();

  const client = await prisma.client.findFirst({ where: { id, orgId: org.id } });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{u("edit", lang)} {u("client", lang)}</h1>
        <p className="mt-1 text-sm text-neutral-500">{client.name}</p>
      </div>
      <Card className="p-6">
        <ClientForm client={client} lang={lang} />
      </Card>
    </div>
  );
}
