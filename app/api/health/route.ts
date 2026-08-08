import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let db = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const status = db === "ok" ? "ok" : "degraded";
  return NextResponse.json(
    {
      status,
      db,
      uptimeSec: Math.round(process.uptime()),
      version: process.env.npm_package_version ?? "dev",
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
