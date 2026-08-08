import "server-only";

import { chromium, type Browser } from "playwright";

/**
 * A small browser pool. Chromium launch is the slow part (~500ms); reusing
 * browsers across requests keeps steady-state PDF generation fast.
 */
const MAX_BROWSERS = 2;

let active = 0;
const idle: Browser[] = [];
const waiters: ((b: Browser) => void)[] = [];

async function acquire(): Promise<Browser> {
  const available = idle.pop();
  if (available) return available;
  if (active < MAX_BROWSERS) {
    active += 1;
    return chromium.launch({ headless: true, args: ["--no-sandbox"] });
  }
  return new Promise((resolve) => waiters.push(resolve));
}

function release(browser: Browser): void {
  const next = waiters.shift();
  if (next) {
    next(browser);
    return;
  }
  if (idle.length < MAX_BROWSERS) {
    idle.push(browser);
    return;
  }
  active -= 1;
  browser.close().catch(() => {});
}

export interface PdfOptions {
  url: string;
  sessionCookie?: string;
}

/** Thrown when the PDF worker is saturated — callers should return 429. */
export class PdfBusyError extends Error {
  constructor() {
    super("PDF generation is busy right now. Please try again shortly.");
    this.name = "PdfBusyError";
  }
}

const MAX_CONCURRENT = 3;
const MAX_QUEUE = 10;
let activeRenders = 0;
const renderQueue: (() => void)[] = [];

async function withConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  if (activeRenders >= MAX_CONCURRENT) {
    if (renderQueue.length >= MAX_QUEUE) throw new PdfBusyError();
    await new Promise<void>((resolve) => renderQueue.push(resolve));
  }
  activeRenders += 1;
  try {
    return await fn();
  } finally {
    activeRenders -= 1;
    const next = renderQueue.shift();
    if (next) next();
  }
}

export async function renderPdf({ url, sessionCookie }: PdfOptions): Promise<Buffer> {
  return withConcurrency(async () => {
    const browser = await acquire();
    try {
      const context = await browser.newContext();

      if (sessionCookie) {
        const host = new URL(url).host;
        await context.addCookies([
          {
            name: "session",
            value: sessionCookie,
            domain: host,
            path: "/",
            httpOnly: true,
            secure: false,
          },
        ]);
      }

      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluateHandle("document.fonts.ready");

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        preferCSSPageSize: true,
      });

      await context.close();
      return Buffer.from(pdf);
    } finally {
      release(browser);
    }
  });
}

export function appUrl(path: string): string {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  return `${origin}${path}`;
}
