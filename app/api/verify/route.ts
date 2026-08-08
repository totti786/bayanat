import { NextResponse } from "next/server";
import { verifyPdfSignature } from "@/lib/pdfsign";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ valid: false, error: "Upload a PDF file" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ valid: false, error: "Only PDF files can be verified" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ valid: false, error: "File too large (max 20 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await verifyPdfSignature(buffer);
  return NextResponse.json(result);
}
