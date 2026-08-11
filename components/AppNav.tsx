"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { LogoMark } from "@/components/Logo";
import LangToggle from "@/components/LangToggle";
import { u, type UiLang } from "@/lib/ui";

export default function AppNav({ orgName, lang, unread = 0 }: { orgName: string; lang: UiLang; unread?: number }) {
  const pathname = usePathname();

  const links = [
    { href: "/", key: "dashboard" },
    { href: "/invoices", key: "invoices" },
    { href: "/recurring", key: "recurring" },
    { href: "/catalog", key: "catalog" },
    { href: "/reports", key: "reports" },
    { href: "/clients", key: "clients" },
    { href: "/settings", key: "settings" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-sm font-bold tracking-tight text-neutral-900">
              Bayanat
            </span>
            <span className="hidden text-[10px] font-medium text-neutral-400 md:block">
              · {orgName}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-brand-800 text-white"
                    : "text-neutral-600 hover:bg-white hover:text-neutral-900"
                }`}
              >
                {u(link.key, lang)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/notifications" className="relative rounded-md px-2.5 py-1.5 text-sm font-medium text-neutral-600 hover:bg-white hover:text-neutral-900" aria-label="Notifications">
            <Bell size={18} strokeWidth={2} aria-hidden />
            {unread > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
          <LangToggle lang={lang} />
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-white hover:text-neutral-900"
            >
              {u("signOut", lang)}
            </button>
          </form>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-neutral-100 px-4 py-1.5 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            prefetch={false}
            className={`whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ${
              isActive(link.href)
                ? "bg-brand-800 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {u(link.key, lang)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
