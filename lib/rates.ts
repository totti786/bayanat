type Rates = Record<string, number>;

let cache: { base: string; rates: Rates; at: number } | null = null;
const TTL = 6 * 60 * 60 * 1000; // 6 hours

/** Load exchange rates relative to `base` (how many of each currency per 1 base). */
export async function loadRates(base: string): Promise<Rates> {
  if (cache && cache.base === base && Date.now() - cache.at < TTL) {
    return cache.rates;
  }
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, {
      cache: "no-store",
    });
    const json = (await res.json()) as { result?: string; rates?: Rates };
    if (json.result === "success" && json.rates) {
      cache = { base, rates: json.rates, at: Date.now() };
      return json.rates;
    }
  } catch {
    // network failure — fall back to the stale cache
  }
  return cache?.base === base ? cache.rates : {};
}

/**
 * Convert a minor-unit amount from `from` to `to` using rates keyed by base=to.
 * Returns null when no rate is available.
 */
export function convertMinor(minor: number, from: string, to: string, rates: Rates): number | null {
  if (!from || !to || from === to) return minor;
  const rFrom = rates[from];
  if (!rFrom || rFrom <= 0) return null;
  return Math.round(minor / rFrom);
}

export async function convertedMinor(
  minor: number,
  from: string,
  to: string
): Promise<number | null> {
  if (!from || !to || from === to) return minor;
  const rates = await loadRates(to);
  return convertMinor(minor, from, to, rates);
}
