import { tr, type InvoiceDocumentData } from "@/components/invoice/types";

/** Lists the methods the issuer accepts, shown when money is still owed. */
export default function PaymentMethodsBlock({ data }: { data: InvoiceDocumentData }) {
  const methods = data.paymentMethods ?? [];
  if (methods.length === 0 || data.totals.balance <= 0) return null;
  const { lang } = data;

  return (
    <div className="mt-8">
      <p className="text-[10px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
        {tr("paymentMethods", lang)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {methods.map((m) => (
          <span
            key={m}
            className="inline-block rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-medium text-neutral-700"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
