import { chromium } from "playwright";
import Database from "better-sqlite3";

const db = new Database("/home/tarek/Projects/bayanat/dev.db");
const b = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await b.newContext();
const p = await ctx.newPage();
let failures = 0;
const check = (n, c, x = "") => { console.log(`${c ? "PASS" : "FAIL"} ${n}${x ? " — " + x : ""}`); if (!c) failures++; };

// create a user
await p.goto("http://localhost:3000/signup");
await p.fill('input[name="orgName"]', "Reset Co");
await p.fill('input[name="name"]', "R");
await p.fill('input[name="email"]', "reset" + Date.now() + "@x.com");
await p.fill('input[name="password"]', "oldpass123");
await p.getByRole("button", { name: "Create account" }).click();
await p.waitForURL("http://localhost:3000/", { timeout: 20000 });

const email = db.prepare("select email from User order by createdAt desc limit 1").get().email;

// sign out
await p.getByRole("button", { name: "Sign out" }).click();
await p.waitForURL(/\/login/, { timeout: 15000 });

// forgot password
await p.goto("http://localhost:3000/forgot-password");
await p.fill('input[name="email"]', email);
await p.getByRole("button", { name: "Send reset link" }).click();
await p.waitForTimeout(2000);
const body = await p.evaluate(() => document.body.innerText);
check("request reports success", body.includes("reset link is on its way"));

const resetUrl = body.match(/https?:\/\/[^\s]+/)?.[0];
check("reset link surfaced", Boolean(resetUrl), resetUrl ?? "");

if (resetUrl) {
  await p.goto(resetUrl);
  await p.fill('input[name="password"]', "newpass456");
  await p.getByRole("button", { name: "Update password" }).click();
  await p.waitForURL(/\/login/, { timeout: 15000 });
  check("redirected to login after reset", true);

  // login with the NEW password
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="password"]', "newpass456");
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForURL("http://localhost:3000/", { timeout: 15000 });
  check("login with new password succeeds", true);

  // old password must now fail
  await p.getByRole("button", { name: "Sign out" }).click();
  await p.waitForURL(/\/login/, { timeout: 15000 });
  await p.fill('input[name="email"]', email);
  await p.fill('input[name="password"]', "oldpass123");
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForTimeout(1500);
  const afterOld = await p.evaluate(() => document.body.innerText);
  check("old password rejected", afterOld.includes("Invalid email or password"));
}

// rate limit: hammer login with wrong password 8+ times -> blocked
for (let i = 0; i < 9; i++) {
  await p.fill('input[name="email"]', "admin@demo.com");
  await p.fill('input[name="password"]', "wrong" + i);
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForTimeout(400);
}
await p.waitForTimeout(500);
const rl = await p.evaluate(() => document.body.innerText);
check("login rate-limited after attempts", rl.includes("Too many attempts"), rl.match(/Too many attempts[^\n]*/)?.[0] ?? "");

console.log(failures === 0 ? "ALL RESET/RATELIMIT TESTS PASSED" : `${failures} FAILED`);
await b.close();
process.exit(failures === 0 ? 0 : 1);
