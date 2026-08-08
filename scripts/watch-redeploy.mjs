#!/usr/bin/env node
// invoice-app auto-redeploy watcher
// Polls the repo for file changes; when a change settles (no new mtime for
// SETTLE_MS), runs `docker compose up -d --build` so the live site reflects
// code edits automatically. Safe for editors that save via rename (vim etc).

import { readdir, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = "/home/tarek/Projects/invoice-app";
const COMPOSE = "docker-compose.deploy.yml";
const POLL_MS = 4000;            // scan interval
const SETTLE_MS = 6000;          // wait for edits to settle before rebuild
const IGNORED_DIRS = new Set([
  "node_modules", ".next", "generated", ".git",
  ".agents", ".claude", ".windsurf", ".npm-cache",
]);
const IGNORED_EXT = new Set([".db", ".db-journal", ".tsbuildinfo", ".log"]);
const IGNORED_FILES = new Set(["dev.db", "package-lock.json"]);

let lastMtime = null;
let dirtySince = null;
let building = false;
let pending = false;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// Returns the newest mtime in the tree (files AND dirs — dir mtimes catch
// deletions/renames), skipping ignored paths.
async function scanMaxMtime(dir) {
  let max = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
    const s = await stat(dir);
    if (s.mtimeMs > max) max = s.mtimeMs;
  } catch {
    return max;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORED_DIRS.has(e.name)) continue;
      const sub = await scanMaxMtime(full);
      if (sub > max) max = sub;
    } else {
      if (IGNORED_FILES.has(e.name)) continue;
      if (IGNORED_EXT.has(path.extname(e.name))) continue;
      try {
        const s = await stat(full);
        if (s.mtimeMs > max) max = s.mtimeMs;
      } catch { /* race: file deleted mid-scan */ }
    }
  }
  return max;
}

function runRebuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  const t0 = Date.now();
  log("Change detected — rebuilding image and restarting container...");
  const child = spawn("docker", ["compose", "-f", COMPOSE, "up", "-d", "--build"], {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env },
  });
  child.on("error", (e) => log(`spawn error: ${e.message}`));
  child.on("close", (code) => {
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    if (code === 0) {
      log(`Rebuild finished in ${secs}s — invoice.deshli.site updated.`);
    } else {
      log(`Rebuild FAILED (exit ${code}) after ${secs}s — old container kept serving. Check logs above.`);
    }
    building = false;
    if (pending) {
      pending = false;
      runRebuild();
    }
  });
}

async function tick() {
  const max = await scanMaxMtime(ROOT);
  if (lastMtime === null) {
    lastMtime = max; // baseline on startup — don't rebuild immediately
    return;
  }
  if (max > lastMtime) {
    lastMtime = max;
    dirtySince = dirtySince ?? Date.now();
  }
  if (dirtySince && Date.now() - dirtySince >= SETTLE_MS) {
    dirtySince = null;
    runRebuild();
  }
}

log(`Watching ${ROOT} (poll ${POLL_MS}ms, settle ${SETTLE_MS}ms)`);
setInterval(tick, POLL_MS);
