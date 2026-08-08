import QRCode from "qrcode";
import { fromMinor } from "@/lib/money";

/** Render a QR code as an inline SVG data URL (synchronous). */
export function qrDataUrl(text: string, scale = 3): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const pad = 4;
  const dim = (size + pad * 2) * scale;
  let path = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.modules.data[r * size + c]) {
        path += `M${(c + pad) * scale},${(r + pad) * scale}h${scale}v${scale}h-${scale}z`;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges"><path d="${path}" fill="#0d1f1e"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function tlv(tag: number, value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  return Buffer.concat([Buffer.from([tag, bytes.length]), bytes]);
}

export interface VatQrData {
  seller: string;
  vatNumber: string;
  timestamp: string; // ISO 8601
  total: string; // inclusive of VAT
  vatAmount: string;
}

/**
 * Build the base64 ZATCA / GCC e-invoicing payload: seller name,
 * VAT number, timestamp, total (with VAT), and VAT amount.
 */
export function buildVatPayload(data: VatQrData): string {
  const content = Buffer.concat([
    tlv(1, data.seller),
    tlv(2, data.vatNumber),
    tlv(3, data.timestamp),
    tlv(4, data.total),
    tlv(5, data.vatAmount),
  ]);
  return content.toString("base64");
}

export function vatQr(
  seller: string,
  vatNumber: string,
  currency: string,
  totalMinor: number,
  vatMinor: number,
  issueDate: Date
): { qr: string; payload: string } {
  const payload = buildVatPayload({
    seller,
    vatNumber,
    timestamp: issueDate.toISOString(),
    total: fromMinor(totalMinor, currency).toFixed(2),
    vatAmount: fromMinor(vatMinor, currency).toFixed(2),
  });
  return { qr: qrDataUrl(payload), payload };
}
