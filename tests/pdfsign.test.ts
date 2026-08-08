import { describe, it, expect } from "vitest";
import {
  signPdf,
  verifyPdfSignature,
  generateSelfSignedCert,
  certConfigured,
  certCommonName,
} from "@/lib/pdfsign";

// A minimal, valid single-page PDF.
const MINIMAL_PDF = `%PDF-1.4
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Kids[3 0 R]/Count 1>>
endobj
3 0 obj
<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer
<</Size 4/Root 1 0 R>>
startxref
170
%%EOF
`;

const certs = generateSelfSignedCert({ name: "Acme Solutions", country: "SA" });

describe("pdfsign", () => {
  it("generates a self-signed keypair", () => {
    expect(certs.keyPem).toContain("PRIVATE KEY");
    expect(certs.certPem).toContain("BEGIN CERTIFICATE");
    expect(certConfigured(certs.keyPem, certs.certPem)).toBe(true);
    expect(certConfigured(null, certs.certPem)).toBe(false);
    expect(certCommonName(certs.certPem)).toBe("Acme Solutions");
  });

  it("signs and verifies a PDF roundtrip", async () => {
    const signed = await signPdf(Buffer.from(MINIMAL_PDF), {
      keyPem: certs.keyPem,
      certPem: certs.certPem,
      reason: "Authorized document",
      signerName: "Acme Solutions",
    });

    expect(signed.toString("latin1")).toContain("/ByteRange");
    const result = await verifyPdfSignature(signed);
    expect(result.valid).toBe(true);
    expect(result.signerName).toBe("Acme Solutions");
  });

  it("detects tampering", async () => {
    const signed = await signPdf(Buffer.from(MINIMAL_PDF), {
      keyPem: certs.keyPem,
      certPem: certs.certPem,
    });

    const tampered = Buffer.from(signed);
    tampered[60] = tampered[60] ^ 0xff; // corrupt a byte in the original page content
    const result = await verifyPdfSignature(tampered);
    expect(result.valid).toBe(false);
  });

  it("reports unsigned PDFs", async () => {
    const result = await verifyPdfSignature(Buffer.from(MINIMAL_PDF));
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
