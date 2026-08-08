/**
 * Minimal structured logging + optional Sentry reporting.
 * Errors are JSON-logged to stderr; if SENTRY_DSN is set, they're also sent
 * to Sentry over its HTTP envelope API (no SDK dependency).
 */

export function logError(source: string, error: unknown, meta: Record<string, unknown> = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      source,
      message,
      stack,
      meta,
      ts: new Date().toISOString(),
    })
  );
}

export function logInfo(source: string, message: string, meta: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ level: "info", source, message, meta, ts: new Date().toISOString() }));
}

function parseDsn(dsn: string): { key: string; host: string; projectId: string } | null {
  try {
    const url = new URL(dsn);
    const key = url.username;
    const host = url.host;
    const projectId = url.pathname.replace(/^\//, "");
    if (!key || !projectId) return null;
    return { key, host, projectId };
  } catch {
    return null;
  }
}

/** Report an event to Sentry. Silent no-op if SENTRY_DSN is unset or fails. */
export async function reportToSentry(
  error: unknown,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const eventId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  const event = {
    event_id: eventId,
    timestamp: new Date().toISOString().slice(0, 19),
    platform: "node",
    sdk: { name: "bayanat", version: "1.0.0" },
    message,
    exception: error instanceof Error ? { values: [{ type: error.name, value: error.message, stacktrace: stack ? { frames: [] } : undefined }] } : undefined,
    extra,
  };

  const header = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
  const itemHeader = JSON.stringify({ type: "event", content_type: "application/json", length: JSON.stringify(event).length });
  const body = `${header}\n${itemHeader}\n${JSON.stringify(event)}`;

  try {
    await fetch(`https://${parsed.host}/api/${parsed.projectId}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.key}, sentry_client=bayanat/1.0`,
      },
      body,
    });
  } catch {
    // never let telemetry break the app
  }
}

export async function reportError(
  source: string,
  error: unknown,
  meta: Record<string, unknown> = {}
): Promise<void> {
  logError(source, error, meta);
  await reportToSentry(error, { source, ...meta });
}
