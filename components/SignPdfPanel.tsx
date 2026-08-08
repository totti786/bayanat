"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInvoicePdf } from "@/lib/actions/sign";
import { Card, Button, ButtonLink, ErrorBanner } from "@/components/ui";
import { u, type UiLang } from "@/lib/ui";

export default function SignPdfPanel({
  invoiceId,
  configured,
  signed,
  signer,
  signedAt,
  verifyUrl,
  lang,
}: {
  invoiceId: string;
  configured: boolean;
  signed: boolean;
  signer: string | null;
  signedAt: string | null;
  verifyUrl: string;
  lang: UiLang;
}) {
  const [state, formAction, pending] = useActionState(signInvoicePdf.bind(null, invoiceId), null);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-neutral-900">{u("signed", lang)}</h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            The PDF is cryptographically signed and verifiable
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            signed
              ? "bg-emerald-50 text-emerald-700"
              : configured
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          {signed ? u("signed", lang) : configured ? u("ready", lang) : u("notConfigured", lang)}
        </span>
      </div>

      <ErrorBanner message={state?.error} />

      {configured ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {signed ? (
            <>
              <ButtonLink href={`/api/invoices/${invoiceId}/pdf`} variant="secondary">
                Download signed PDF
              </ButtonLink>
              <Link
                href={verifyUrl}
                target="_blank"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Verify signature
              </Link>
            </>
          ) : (
            <form action={formAction}>
              <Button type="submit" disabled={pending}>
                {pending ? u("signing", lang) : u("signPdf", lang)}
              </Button>
            </form>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">
          OK
        </p>
      )}

      {signed && (
        <div className="mt-4 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
          {signer && (
            <p>
              Signed by <span className="font-medium text-neutral-900">{signer}</span>
            </p>
          )}
          {signedAt && <p className="mt-0.5">on {new Date(signedAt).toLocaleString()}</p>}
        </div>
      )}
    </Card>
  );
}
