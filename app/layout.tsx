import type { Metadata } from "next";
import localFont from "next/font/local";
import { getUiLang } from "@/lib/ui-lang";
import "./globals.css";

const inter = localFont({
  src: "../public/fonts/Inter-var.ttf",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const cairo = localFont({
  src: "../public/fonts/Cairo-var.ttf",
  variable: "--font-cairo",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Bayanat — Bilingual Invoicing",
    template: "%s · Bayanat",
  },
  description:
    "Bilingual invoicing for Arabic and English — clients, invoices, payments, and beautiful PDFs.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getUiLang();
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${inter.variable} ${cairo.variable} h-full antialiased`}
    >
      <body
        className="min-h-full font-sans"
        style={{ fontFamily: lang === "ar" ? "var(--font-cairo)" : "var(--font-inter)" }}
      >
        {children}
      </body>
    </html>
  );
}
