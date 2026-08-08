import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-neutral-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: August 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-700">
        <p>
          Bayanat stores the data you enter — clients, invoices, quotes, payments — in order
          to provide the service. We do not sell your data.
        </p>
        <p>
          <strong>What we store.</strong> Account credentials (hashed), organization and
          client details, invoice/quote/payment records, uploaded logos, audit events, and
          signed documents. Passwords are never stored in plain text.
        </p>
        <p>
          <strong>Cookies &amp; sessions.</strong> We use a session cookie to keep you signed
          in, a language-preference cookie, and an active-company cookie. No third-party
          advertising cookies.
        </p>
        <p>
          <strong>Share links &amp; verification.</strong> Invoice share links and signature
          verification are public by design so your clients can view and verify documents
          without an account.
        </p>
        <p>
          <strong>Payments.</strong> Payment tracking is recorded by you; we do not process
          card payments directly.
        </p>
        <p>
          <strong>Your rights.</strong> You can export your data via CSV exports or contact
          your account administrator to delete it.
        </p>
      </div>
    </div>
  );
}
