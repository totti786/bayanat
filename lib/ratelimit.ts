/**
 * In-memory sliding-window rate limiter for auth endpoints.
 *
 * Suitable for the single-instance deployment. If the app ever runs on
 * multiple instances, swap this for a shared store (Redis/DB).
 */

type Bucket = number[]; // timestamps of attempts

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function now(): number {
  return Date.now();
}

/** Prune expired timestamps and keep the map bounded. */
function prune(key: string, windowMs: number): void {
  const arr = buckets.get(key);
  if (!arr) return;
  const cutoff = now() - windowMs;
  const kept = arr.filter((t) => t > cutoff);
  if (kept.length === 0) {
    buckets.delete(key);
  } else {
    buckets.set(key, kept);
  }
  if (buckets.size > MAX_BUCKETS) {
    const keys = [...buckets.keys()];
    for (const k of keys.slice(0, buckets.size - MAX_BUCKETS)) buckets.delete(k);
  }
}

/**
 * Record an attempt for `key` and return whether it's still allowed.
 * Returns the number of seconds until the limit resets when blocked.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterSec?: number } {
  prune(key, windowMs);
  const arr = buckets.get(key) ?? [];
  arr.push(now());
  buckets.set(key, arr);

  if (arr.length <= max) return { allowed: true };

  const oldest = arr[0];
  const resetInMs = oldest + windowMs - now();
  return { allowed: false, retryAfterSec: Math.ceil(Math.max(1, resetInMs / 1000)) };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client IP from the request headers. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
