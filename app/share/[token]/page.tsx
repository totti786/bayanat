import { notFound } from "next/navigation";
import { verifyShareToken } from "@/lib/share";
import { getInvoiceForRenderPublic } from "@/lib/data";
import { toDocumentData } from "@/lib/render";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import ThemeStyle from "@/components/ThemeStyle";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { token } = await params;
  const { format } = await searchParams;

  const verified = await verifyShareToken(token);
  if (!verified) notFound();

  const data = await getInvoiceForRenderPublic(verified.invoiceId);
  if (!data) notFound();

  const doc = toDocumentData(data.invoice, data.totals);

  return (
    <div>
      <ThemeStyle accent={data.invoice.org.themeAccent} />
      {format !== "pdf" && (
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-4 py-2 backdrop-blur">
          <p className="text-sm font-medium text-neutral-700">
            {data.invoice.number ?? "Invoice"} · {data.invoice.org.name}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`/share/${token}/verify`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Verify signature
            </a>
            <a
              href={`/share/${token}/pdf`}
              className="rounded-md bg-brand-700 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
            >
              Download PDF
            </a>
          </div>
        </div>
      )}
      <div className={format !== "pdf" ? "flex justify-center py-6" : "flex justify-center"}>
        <div className="shrink-0 shadow-xl ring-1 ring-neutral-900/10">
          <InvoiceDocument {...doc} />
        </div>
      </div>
    </div>
  );
}
