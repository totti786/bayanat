import { notFound } from "next/navigation";
import { verifyShareToken } from "@/lib/share";
import { prisma } from "@/lib/db";
import { verifyPdfSignature } from "@/lib/pdfsign";
import VerifyUpload from "@/components/VerifyUpload";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verified = await verifyShareToken(token);
  if (!verified) notFound();

  const invoice = await prisma.invoice.findUnique({
    where: { id: verified.invoiceId },
    include: { org: true },
  });
  if (!invoice) notFound();

  const filename = `${(invoice.number ?? "invoice").replace(/[^a-zA-Z0-9-]+/g, "_")}.pdf`;
  const result = invoice.signedPdf
    ? await verifyPdfSignature(Buffer.from(invoice.signedPdf))
    : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-bold text-neutral-900">Signature verification</h1>
        <p className="mt-1 text-center text-sm text-neutral-500">
          {invoice.number ?? "Document"} · {invoice.org.name}
        </p>

        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          {result === null ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              This document has not been digitally signed.
            </p>
          ) : (
            <div className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold text-white ${
                  result.valid ? "bg-emerald-600" : "bg-red-600"
                }`}
              >
                {result.valid ? "✓" : "✕"}
              </div>
              <h2 className="mt-4 text-lg font-bold text-neutral-900">
                {result.valid ? "Signature is valid" : "Signature is invalid"}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {result.valid
                  ? "The document is authentic and has not been altered since it was signed."
                  : result.error ?? "The document has been altered or the signature is invalid."}
              </p>
              {result.signerName && (
                <p className="mt-3 text-xs text-neutral-500">
                  Signed by <span className="font-medium text-neutral-900">{result.signerName}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <a
            href={`/share/${token}/pdf`}
            className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Download PDF
          </a>
        </div>
        <p className="mt-2 text-center text-xs text-neutral-400">{filename}</p>

        <VerifyUpload />
      </div>
    </div>
  );
}
