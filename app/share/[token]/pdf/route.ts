import { NextResponse } from "next/server";
import { verifyShareToken } from "@/lib/share";
import { getInvoiceForRenderPublic } from "@/lib/data";
import { renderPdf, appUrl } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/share/[token]/pdf">
) {
  const { token } = await ctx.params;
  const verified = await verifyShareToken(token);
  if (!verified) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await getInvoiceForRenderPublic(verified.invoiceId);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Serve the signed PDF when available so its signature stays valid.
  if (data.invoice.signedPdf) {
    const signed = data.invoice.signedPdf as unknown as Uint8Array;
    const filename = `${(data.invoice.number ?? "invoice").replace(/[^a-zA-Z0-9-]+/g, "_")}.pdf`;
    return new NextResponse(new Uint8Array(signed), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const pdf = await renderPdf({
    url: appUrl(`/share/${token}?format=pdf`),
  });

  const filename = `${(data.invoice.number ?? "invoice").replace(/[^a-zA-Z0-9-]+/g, "_")}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
