import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const suffix = Date.now();
const EMAIL = `sign${suffix}@nile.studio`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
let failures = 0;

function check(name, cond, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

async function waitText(re, timeoutMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const text = await page.evaluate(() => document.body.innerText);
    if (re.test(text)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

try {
  await page.goto(`${BASE}/signup`);
  await page.fill('input[name="orgName"]', "Signed Co");
  await page.fill('input[name="name"]', "Signer");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', "supersecret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });

  // Generate a self-signed certificate in Settings
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Generate a self-signed certificate" }).click();
  check("self-signed cert generated", await waitText(/BEGIN PRIVATE KEY|PRIVATE KEY/));

  // Client + invoice
  await page.goto(`${BASE}/clients/new`);
  await page.fill('input[name="name"]', "Verify Co");
  await page.getByRole("button", { name: "Create client" }).click();
  await page.waitForURL(/\/clients\/[^/]+$/, { timeout: 15000 });
  await page.getByRole("link", { name: "New invoice" }).click();
  await page.fill('input[name="itemDescription"]', "Services");
  await page.fill('input[name="itemQuantity"]', "1");
  await page.fill('input[name="itemUnitPrice"]', "1000");
  await page.getByRole("button", { name: "Create invoice" }).click();
  await page.waitForURL(/\/invoices\/(?!new)[^/]+$/, { timeout: 15000 });
  await page.getByRole("button", { name: "Send invoice" }).click();
  await waitText(/INV-0001/);

  // Sign the PDF
  await page.getByRole("button", { name: "Sign PDF" }).click();
  check("PDF signed", await waitText(/Signed/));
  check("signed by name shown", await waitText(/Signed by Signed Co/));

  // Download the signed PDF and confirm it contains a signature
  const cookies = await ctx.cookies();
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const invoiceUrl = page.url();
  const invoiceId = invoiceUrl.split("/").pop();
  const pdfResp = await fetch(`${BASE}/api/invoices/${invoiceId}/pdf`, { headers: { cookie: cookieStr } });
  const pdfBuf = Buffer.from(await pdfResp.arrayBuffer());
  check("signed PDF downloads", pdfBuf.subarray(0, 5).toString() === "%PDF-", pdfBuf.length + "B");
  check("PDF contains signature", pdfBuf.toString("latin1").includes("/ByteRange"));

  // Verify page shows valid (opens in a new tab)
  const [verifyPage] = await Promise.all([
    page.waitForEvent("popup", { timeout: 15000 }),
    page.getByRole("link", { name: "Verify signature" }).click(),
  ]);
  await verifyPage.waitForLoadState("networkidle");
  const vText = await verifyPage.innerText("body");
  check("verify page shows valid", vText.includes("Signature is valid"));
  check("verify page shows signer", vText.includes("Signed Co"));
  await verifyPage.close();
} catch (e) {
  failures++;
  console.log("EXCEPTION:", e.message);
  await page.screenshot({ path: "/tmp/opencode/fail-sign.png" }).catch(() => {});
}

console.log(failures === 0 ? "\nALL SIGN TESTS PASSED" : `\n${failures} SIGN TEST(S) FAILED`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
