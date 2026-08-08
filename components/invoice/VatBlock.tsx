import { tr, type InvoiceDocumentData } from "@/components/invoice/types";

export default function VatBlock({ data }: { data: InvoiceDocumentData }) {
  if (!data.qr || !data.qrPayload) return null;
  const { lang } = data;

  return (
    <div className="mt-10 flex items-start gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.qr} alt="VAT QR" className="h-24 w-24" />
      <div className="pt-1">
        <p className="text-[9px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
          {tr("vatQr", lang)}
        </p>
        <p className="mt-1 max-w-[150mm] break-all text-[8px] leading-relaxed text-neutral-400">
          {data.qrPayload}
        </p>
      </div>
    </div>
  );
}
