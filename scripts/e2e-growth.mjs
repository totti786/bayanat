import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const suffix = Date.now();
const EMAIL = `growth${suffix}@nile.studio`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
let failures = 0;

function check(name, cond, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

async function waitText(re, timeoutMs = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const text = await page.evaluate(() => document.body.innerText);
    if (re.test(text)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

try {
  // Signup
  await page.goto(`${BASE}/signup`);
  await page.fill('input[name="orgName"]', "Growth Studio");
  await page.fill('input[name="name"]', "Growth");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', "supersecret123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  check("signup works", true);

  // Client
  await page.goto(`${BASE}/clients/new`);
  await page.fill('input[name="name"]', "Bilingual Corp");
  await page.fill('input[name="nameAr"]', "شركة ثنائية اللغة");
  await page.fill('input[name="email"]', "client@bilingual.com");
  await page.getByRole("button", { name: "Create client" }).click();
  await page.waitForURL(/\/clients\/(?!new)[^/]+$/, { timeout: 15000 });
  await page.waitForLoadState("load");
  check("client created", true);

  // Create a QUOTE with bilingual template
  await page.getByRole("link", { name: "New invoice" }).click();
  await page.waitForURL(/\/invoices\/new/);
  await page.getByText("Quote", { exact: true }).click();
  await page.getByText("Bilingual", { exact: true }).click();
  await page.fill('input[name="itemDescription"]', "Consulting");
  await page.fill('input[name="itemDescriptionAr"]', "استشارات");
  await page.fill('input[name="itemQuantity"]', "1");
  await page.fill('input[name="itemUnitPrice"]', "2000");
  await page.getByRole("button", { name: "Create invoice" }).click();
  await page.waitForURL(/\/invoices\/[^/]+$/, { timeout: 15000 });
  await page.waitForLoadState("load");
  check("quote created (draft)", await waitText(/Draft/));

  // Send the quote
  await page.getByRole("button", { name: "Send invoice" }).click();
  check("quote sent + numbered", await waitText(/INV-0001/));
  check("convert-to-invoice button present", await page.getByRole("button", { name: "Convert to invoice" }).isVisible());

  // Fetch its bilingual PDF via API and verify Arabic text present
  const invoiceUrl = page.url();
  const invoiceId = invoiceUrl.split("/").pop();
  const cookies = await ctx.cookies();
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const pdfResp = await fetch(`${BASE}/api/invoices/${invoiceId}/pdf`, { headers: { cookie: cookieStr } });
  const pdfBuf = Buffer.from(await pdfResp.arrayBuffer());
  check("bilingual PDF returns valid", pdfBuf.subarray(0, 5).toString() === "%PDF-", pdfBuf.length + "B");
  const pdfText = pdfBuf.toString("utf8");
  check("bilingual PDF contains Arabic", /[\u0600-\u06FF]/.test(pdfText));

  // Convert quote -> invoice
  await page.getByRole("button", { name: "Convert to invoice" }).click();
  check("convert succeeds", await waitText(/Record payment/));

  // Record a payment
  await page.fill('input[name="amount"]', "1000");
  await page.getByRole("button", { name: "Record payment" }).click();
  check("payment recorded", await waitText(/1,000/));

  // Share link + public view
  await page.getByRole("button", { name: "Share & email" }).click();
  await page.waitForSelector("text=Invoice link", { timeout: 15000 });
  const linkText = await page.locator("div.rounded-lg.border").first().innerText();
  const sharePath = linkText.match(/\/share\/[a-zA-Z0-9._-]+/)?.[0];
  check("share link generated", Boolean(sharePath), sharePath ?? "");
  if (sharePath) {
    await page.goto(`${BASE}${sharePath}`);
    await page.waitForLoadState("load");
    check("public share page renders invoice", await page.getByText("Bilingual Corp").first().isVisible());
    const sharePdf = await fetch(`${BASE}${sharePath}/pdf`);
    const sharePdfBuf = Buffer.from(await sharePdf.arrayBuffer());
    check("public share PDF downloads", sharePdfBuf.subarray(0, 5).toString() === "%PDF-");
  }

  // Recurring setup + cron
  await page.goto(`${BASE}/invoices/${invoiceId}`);
  await page.waitForLoadState("load");
  await page.getByRole("button", { name: "Repeat…" }).click();
  await page.getByRole("button", { name: "Create schedule" }).click();
  check("recurring schedule created", await waitText(/Recurring schedule created/));

  const cronKey = "dev-cron-key";
  const cron = await fetch(`${BASE}/api/cron/recurring?key=${cronKey}`);
  const cronJson = await cron.json();
  check("cron generated invoice", cronJson.generated >= 1, JSON.stringify(cronJson));

  await page.goto(`${BASE}/recurring`);
  await page.waitForLoadState("load");
  check("recurring list shows schedule", await page.getByText("Monthly").first().isVisible());

  await page.goto(`${BASE}/invoices`);
  await page.waitForLoadState("load");
  check("generated invoice appears (INV-0002)", await waitText(/INV-0002/));

  // Team invite + accept flow
  await page.goto(`${BASE}/settings/team`);
  await page.waitForLoadState("load");
  await page.fill('input[name="email"]', `teammate${suffix}@nile.studio`);
  await page.getByRole("button", { name: "Send invite" }).click();
  const inviteUrl = await waitText(/Invite link/) ? await page.locator("p.break-all").first().innerText() : null;
  check("invite link generated", Boolean(inviteUrl));
  if (inviteUrl) {
    const acceptPath = inviteUrl.split(BASE)[1] ?? inviteUrl;
    await page.goto(`${BASE}${acceptPath}`);
    await page.fill('input[name="name"]', "Teammate");
    await page.fill('input[name="password"]', "teammate123");
    await page.getByRole("button", { name: "Accept invitation" }).click();
    await page.waitForURL(`${BASE}/`, { timeout: 15000 });
    check("invite accepted, signed in", true);
  }
} catch (e) {
  failures++;
  console.log("EXCEPTION:", e.message);
  await page.screenshot({ path: "/tmp/opencode/fail-growth.png" }).catch(() => {});
}

console.log(failures === 0 ? "\nALL GROWTH TESTS PASSED" : `\n${failures} GROWTH TEST(S) FAILED`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
