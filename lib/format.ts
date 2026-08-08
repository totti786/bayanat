import { currencyExponent } from "@/lib/money";

export type Lang = "en" | "ar";
export type Numerals = "western" | "eastern";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SAR: "ر.س",
  AED: "د.إ",
  EGP: "ج.م",
  KWD: "د.ك",
  QAR: "ر.ق",
  OMR: "ر.ع",
  BHD: "د.ب",
  JOD: "د.أ",
};

function moneyLocale(locale: Lang, numerals: Numerals): string {
  if (locale === "ar") {
    return numerals === "eastern" ? "ar-EG" : "ar-EG-u-nu-latn";
  }
  return "en-US";
}

/** Format an amount given in minor units (cents). */
export function formatMoney(
  minor: number,
  currency: string,
  locale: Lang,
  numerals: Numerals
): string {
  const amount = minor / 10 ** currencyExponent(currency);
  try {
    return new Intl.NumberFormat(moneyLocale(locale, numerals), {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${CURRENCY_SYMBOLS[currency] ?? currency}`;
  }
}

export function formatMoneyShort(
  amount: number,
  locale: Lang,
  numerals: Numerals
): string {
  try {
    return new Intl.NumberFormat(moneyLocale(locale, numerals), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

export function formatDate(
  date: Date | string,
  locale: Lang,
  numerals: Numerals = "western",
  opts: Intl.DateTimeFormatOptions = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  let lc = "en-US";
  if (locale === "ar") lc = numerals === "eastern" ? "ar-EG" : "ar-EG-u-nu-latn";
  try {
    return new Intl.DateTimeFormat(lc, {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...opts,
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatHijriDate(
  date: Date | string,
  locale: Lang,
  numerals: Numerals = "eastern"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const lc = locale === "ar" ? "ar-SA-u-ca-islamic" : "en-US-u-ca-islamic";
  try {
    return new Intl.DateTimeFormat(lc, {
      year: "numeric",
      month: "short",
      day: "numeric",
      numberingSystem: numerals === "eastern" ? "arab" : "latn",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatPercent(
  rate: number,
  locale: Lang,
  numerals: Numerals = "western"
): string {
  if (locale === "ar" && numerals === "eastern") {
    return `${rate.toLocaleString("ar-EG")}%`;
  }
  return `${rate}%`;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
