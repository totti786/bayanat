"use client";

export default function PdfToolbar({ id, label }: { id: string; label: string }) {
  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-4 py-2 backdrop-blur">
      <p className="text-sm font-medium text-neutral-700">{label} — preview</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.print()}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Print
        </button>
        <a
          href={`/api/invoices/${id}/pdf`}
          className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
