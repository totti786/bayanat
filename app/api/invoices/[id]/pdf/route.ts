import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { getInvoiceForRender } from "@/lib/data";
import { renderPdf, appUrl, PdfBusyError } from "@/lib/pdf";
import { reportError } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/invoices/[id]/pdf">
) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  if (!user?.org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getInvoiceForRender(id, user.org.id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Prefer the signed PDF — it stays byte-identical so the signature stays valid.
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

  const store = await cookies();
  const sessionCookie = store.get("session")?.value;

  let pdf: Buffer;
  try {
    pdf = await renderPdf({
      url: appUrl(`/invoices/${id}/pdf?format=pdf`),
      sessionCookie,
    });
  } catch (e) {
    if (e instanceof PdfBusyError) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }
    reportError("pdf:authed", e, { invoiceId: id });
    return NextResponse.json({ error: "Could not generate the PDF" }, { status: 500 });
  }

  const filename = `${(data.invoice.number ?? "draft").replace(/[^a-zA-Z0-9-]+/g, "_")}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
