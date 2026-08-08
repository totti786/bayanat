import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const suffix = Date.now();
const EMAIL = `tarek${suffix}@nile.studio`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
let failures = 0;

function check(name, cond, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

async function waitText(page, re, timeoutMs = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const text = await page.evaluate(() => document.body.innerText);
    if (re.test(text)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

try {
  // 1. Signup a fresh account
  await page.goto(`${BASE}/signup`);
  await page.fill('input[name="orgName"]', "Nile Studio");
  await page.fill('input[name="name"]', "Tarek");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', "supersecret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  check("signup creates org and redirects to dashboard", page.url() === `${BASE}/`);
  await page.getByText("New invoice").first().waitFor({ timeout: 15000 }).then(() => check("empty dashboard visible", true)).catch(() => check("empty dashboard visible", false));

  // 2. Create a client with Arabic name
  await page.goto(`${BASE}/clients/new`);
  await page.fill('input[name="name"]', "Al Noor Trading");
  await page.fill('input[name="nameAr"]', "ال نور للتجارة");
  await page.fill('input[name="email"]', "billing@alnoor.sa");
  await page.getByRole("button", { name: "Create client" }).click();
  await page.waitForURL(/\/clients\/(?!new)[^/]+$/, { timeout: 15000 });
  await page.waitForLoadState("load");
  const clientUrl = page.url();
  await page.getByText("Al Noor Trading").first().waitFor({ timeout: 10000 }).then(() => check("client created", true)).catch(() => check("client created", false));
  check("client Arabic name shown", await page.getByText("ال نور للتجارة").first().isVisible());

  // 3. Create an invoice (Arabic, tax inclusive) from client page
  await page.goto(`${clientUrl}`);
  await page.getByRole("link", { name: "New invoice" }).waitFor({ timeout: 20000 });
  await page.getByRole("link", { name: "New invoice" }).click();
  await page.waitForURL(/\/invoices\/new/);
  await page.selectOption('select[name="lang"]', "ar");
  await page.fill('input[name="issueDate"]', "2026-08-07");
  await page.fill('input[name="dueDate"]', "2026-09-07");
  await page.fill('input[name="taxName"]', "VAT");
  await page.fill('input[name="taxRate"]', "5");
  await page.click('label:has-text("Tax included in prices")');
  await page.fill('input[name="itemDescription"]', "Website design");
  await page.fill('input[name="itemDescriptionAr"]', "تصميم موقع");
  await page.fill('input[name="itemQuantity"]', "2");
  await page.fill('input[name="itemUnitPrice"]', "1000");
  await page.fill('input[name="itemTaxRate"]', "");
  await page.fill('textarea[name="notesAr"]', "شكراً لتعاملكم معنا");
  await page.getByRole("button", { name: "Create invoice" }).click();
  await page.waitForURL(/\/invoices\/(?!new)[^/]+$/, { timeout: 15000 });
  await page.waitForLoadState("load");
  const invoiceUrl = page.url();
  await page.getByText("Draft invoice").first().waitFor({ timeout: 10000 }).then(() => check("draft invoice created", true)).catch(() => check("draft invoice created", false));
  check("draft badge (AR مسودة)", await waitText(page, /مسودة|Draft/));

  // Verify totals shown in summary (inclusive: 2*1000/1.05 net etc.)
  const summaryText = await page.locator(".lg\\:col-span-3, main").innerText();
  check("total = 2,000.00 shown", summaryText.includes("2,000.00"));

  // 4. Send invoice -> gets number INV-0001 for this org
  await page.getByRole("button", { name: "Send invoice" }).click();
  check("invoice number assigned", await waitText(page, /INV-0001/));
  check("status no longer draft", await waitText(page, /غير مدفوعة|UNPAID|مرسل|Sent|مدفوع/));

  // 5. Record a payment of 1500
  await page.fill('input[name="amount"]', "1500");
  await page.fill('input[name="date"]', "2026-08-07");
  await page.getByRole("button", { name: "Record payment" }).click();
  check("partially paid state", await waitText(page, /مدفوعة جزئياً|Partially paid|مدفوع/));
  check("balance 500 shown", await waitText(page, /500/));

  // 6. Download PDF via the API link
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }),
    page.getByRole("link", { name: "Download PDF" }).click(),
  ]);
  const dlPath = await download.path();
  check("PDF downloads", download.suggestedFilename().endsWith(".pdf"), download.suggestedFilename());
  const fs = await import("node:fs");
  const buf = fs.readFileSync(dlPath);
  check("PDF is non-empty %PDF", buf.subarray(0, 5).toString() === "%PDF-", buf.length + " bytes");

  // 7. Preview page renders toolbar + doc
  await page.goto(`${invoiceUrl}/pdf`);
  await page.waitForLoadState("load");
  const pv = await page.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(0, 120) }));
  console.log("PREVIEW DBG:", JSON.stringify(pv));
  await page.getByRole("link", { name: "Download PDF" }).waitFor({ timeout: 30000 }).then(() => check("preview toolbar download link present", true)).catch(() => check("preview toolbar download link present", false));
  await page.getByText("فاتورة").first().waitFor({ timeout: 30000 }).then(() => check("preview shows Arabic invoice title", true)).catch(() => check("preview shows Arabic invoice title", false));

  // 8. Invoices list shows the new invoice
  await page.goto(`${BASE}/invoices`);
  await page.waitForLoadState("load");
  check("invoice in list", await page.getByText("INV-0001").first().isVisible());
} catch (e) {
  failures++;
  console.log("EXCEPTION:", e.message);
  await page.screenshot({ path: "/tmp/opencode/fail.png" }).catch(() => {});
}

console.log(failures === 0 ? "\nALL TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
