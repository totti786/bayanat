import Link from "next/link";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants: Record<string, string> = {
    primary: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-300",
    secondary:
      "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 disabled:text-neutral-400",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
    ghost: "text-neutral-600 hover:bg-neutral-100 disabled:text-neutral-400",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  className = "",
  variant = "primary",
  children,
  ...props
}: {
  href: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  children: ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href">) {
  const variants: Record<string, string> = {
    primary: "bg-brand-700 text-white hover:bg-brand-800",
    secondary: "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-neutral-600 hover:bg-neutral-100",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-neutral-700">
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 ${className}`}
      {...props}
    />
  );
}

export function Badge({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {message}
    </div>
  );
}
