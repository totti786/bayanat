// Online-safe SQLite backup with retention. Run on a schedule (e.g. nightly cron):
//   node scripts/backup.mjs [--keep N]
import { mkdirSync, readdirSync, rmSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";

const root = resolve(import.meta.dirname, "..");
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = dbUrl.startsWith("file:") ? resolve(root, dbUrl.slice(5)) : resolve(root, dbUrl);

const keep = Number(process.argv.find((a) => a.startsWith("--keep="))?.split("=")[1] ?? 14);
const backupsDir = join(root, "backups");
const logosDir = join(root, "public", "logos");

mkdirSync(backupsDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const dbBackup = join(backupsDir, `bayanat-${stamp}.db`);
const logosBackup = join(backupsDir, `logos-${stamp}.tar.gz`);

// Online-safe copy via SQLite's backup API (works even while the app is writing).
const source = new Database(dbPath, { readonly: true });
await source.backup(dbBackup);
source.close();

// Include uploaded logos.
if (existsSync(logosDir)) {
  const { execSync } = await import("node:child_process");
  execSync(`tar -czf ${JSON.stringify(logosBackup)} -C ${JSON.stringify(join(root, "public"))} logos`);
}

// Retention: keep only the newest N backups, delete the rest.
const files = readdirSync(backupsDir)
  .filter((f) => f.startsWith("bayanat-") || f.startsWith("logos-"))
  .map((f) => ({ f, mtime: statSync(join(backupsDir, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

for (const { f } of files.slice(keep * 2)) {
  rmSync(join(backupsDir, f));
}

console.log(`Backup written: ${dbBackup} (${Math.round(statSync(dbBackup).size / 1024)} KB)`);
if (existsSync(logosBackup)) console.log(`Logos archived: ${logosBackup}`);
console.log(`Retention: keeping the newest ${keep} backups in ${backupsDir}`);
