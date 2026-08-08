import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-neutral-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: August 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-700">
        <p>
          Bayanat provides invoicing, quoting, payment tracking, and related services
          for your business. By using the service you agree to these terms.
        </p>
        <p>
          <strong>Your data.</strong> You retain ownership of the data you enter. You are
          responsible for the accuracy of invoices and compliance with tax regulations in
          your jurisdiction.
        </p>
        <p>
          <strong>Acceptable use.</strong> You may not use the service to send unlawful,
          fraudulent, or misleading documents, or to abuse the rate-limited and PDF
          generation systems.
        </p>
        <p>
          <strong>Availability.</strong> We aim for high availability but do not guarantee
          uninterrupted service. Regular backups are maintained; you should also keep your
          own records of issued invoices.
        </p>
        <p>
          <strong>Termination.</strong> You may stop using the service at any time and export
          your data via the built-in CSV exports.
        </p>
        <p>
          Questions about these terms? Contact your account administrator.
        </p>
      </div>
    </div>
  );
}
