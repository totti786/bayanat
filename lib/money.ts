/**
 * All monetary values are stored and computed as integer minor units
 * (e.g. cents), keyed by currency exponent. This removes floating-point
 * money entirely from calculations.
 */

const EXPONENTS: Record<string, number> = {
  // 0-decimal currencies
  JPY: 0, KRW: 0, VND: 0, CLP: 0, COP: 0, ISK: 0,
  // 3-decimal currencies
  BHD: 3, KWD: 3, OMR: 3, TND: 3, IQD: 3, JOD: 3,
};

export function currencyExponent(currency: string): number {
  return EXPONENTS[currency.toUpperCase()] ?? 2;
}

/** Convert a human decimal amount (e.g. 12.5) to minor units, rounding to nearest unit. */
export function toMinor(amount: number, currency: string): number {
  const exp = currencyExponent(currency);
  return Math.round((amount + Number.EPSILON) * 10 ** exp);
}

/** Convert minor units back to a decimal for display (e.g. 1250 -> 12.5). */
export function fromMinor(minor: number, currency: string): number {
  const exp = currencyExponent(currency);
  return minor / 10 ** exp;
}

export function roundCents(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
