import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getInvoiceForRender } from "@/lib/data";
import { toDocumentData } from "@/lib/render";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import PdfToolbar from "@/components/PdfToolbar";
import ThemeStyle from "@/components/ThemeStyle";

export const dynamic = "force-dynamic";

export default async function InvoicePdfPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const user = await getSessionUser();
  if (!user?.org) redirect("/login");
  const { id } = await params;
  const { format } = await searchParams;

  const data = await getInvoiceForRender(id, user.org.id);
  if (!data) notFound();

  const doc = toDocumentData(data.invoice, data.totals);

  return (
    <div>
      <ThemeStyle accent={data.invoice.org.themeAccent} />
      {format !== "pdf" && <PdfToolbar id={id} label={data.invoice.number ?? "Draft"} />}
      <div className={format !== "pdf" ? "flex justify-center py-6" : "flex justify-center"}>
        <div className="shrink-0 shadow-xl ring-1 ring-neutral-900/10">
          <InvoiceDocument {...doc} />
        </div>
      </div>
    </div>
  );
}
