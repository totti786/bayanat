import { NextResponse } from "next/server";
import { generateDueInvoices } from "@/lib/recurring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const key = process.env.CRON_KEY;
  const url = new URL(request.url);
  if (key && url.searchParams.get("key") !== key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const generated = await generateDueInvoices();
  return NextResponse.json({ generated });
}
