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

export async function renderPdf({ url, sessionCookie }: PdfOptions): Promise<Buffer> {
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
}

export function appUrl(path: string): string {
  const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
  return `${origin}${path}`;
}
