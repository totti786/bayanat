import { chromium } from "playwright";

const url = process.env.URL;
const token = process.env.TOKEN;
const out = process.env.OUT;

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext();
await context.addCookies([
  { name: "session", value: token, domain: new URL(url).host, path: "/", httpOnly: true },
]);
const page = await context.newPage();
await page.setViewportSize({ width: 900, height: 1300 });
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluateHandle("document.fonts.ready");
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("saved", out);
