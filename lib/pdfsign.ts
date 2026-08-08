import forge from "node-forge";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { plainAddPlaceholder } from "@signpdf/placeholder-plain";
import { P12Signer } from "@signpdf/signer-p12";
import signpdf from "@signpdf/signpdf";

function p12FromPem(keyPem: string, certPem: string, password = ""): Buffer {
  const cert = forge.pki.certificateFromPem(certPem);
  const key = forge.pki.privateKeyFromPem(keyPem);
  const p12 = forge.pkcs12.toPkcs12Asn1(key, [cert], password);
  return Buffer.from(forge.asn1.toDer(p12).getBytes(), "binary");
}

export async function signPdf(
  pdfBuffer: Buffer,
  opts: { keyPem: string; certPem: string; reason?: string; signerName?: string; contactInfo?: string }
): Promise<Buffer> {
  const p12 = p12FromPem(opts.keyPem, opts.certPem);
  const signer = new P12Signer(p12, { passphrase: "" });

  const pdfWithPlaceholder = plainAddPlaceholder({
    pdfBuffer,
    reason: opts.reason ?? "Document digitally signed",
    contactInfo: opts.contactInfo ?? "",
    name: opts.signerName ?? "Signer",
    location: "",
  });

  return signpdf.sign(pdfWithPlaceholder, signer as never, new Date());
}

export interface SignatureVerification {
  valid: boolean;
  signerName?: string;
  signingTime?: string;
  algorithm?: string;
  error?: string;
}

/** Parse and cryptographically verify the CMS signature embedded in a PDF. */
export async function verifyPdfSignature(pdfBuffer: Buffer): Promise<SignatureVerification> {
  const txt = pdfBuffer.toString("latin1");
  const brMatch = txt.match(/\/ByteRange\s*\[([^\]]+)\]/);
  const contentsMatch = txt.match(/\/Contents\s*<([^>]+)>/);

  if (!brMatch || !contentsMatch) {
    return { valid: false, error: "No signature found in this PDF" };
  }

  const [a, b, c, d] = brMatch[1].split(/\s+/).map(Number);
  if ([a, b, c, d].some((n) => !Number.isFinite(n))) {
    return { valid: false, error: "Malformed ByteRange" };
  }

  try {
    const range = Buffer.concat([
      pdfBuffer.subarray(a, a + b),
      pdfBuffer.subarray(c, c + d),
    ]);

    let hex = contentsMatch[1].replace(/\s+/g, "");
    hex = hex.replace(/(?:00)+$/, ""); // strip placeholder padding

    const contentInfo = asn1js.fromBER(new Uint8Array(Buffer.from(hex, "hex"))).result as asn1js.Sequence;
    // ContentInfo: SEQUENCE { contentType OID, content [0] EXPLICIT { SignedData } }
    const explicit = contentInfo.valueBlock.value[1] as asn1js.Constructed;
    const signedDataBytes = new Uint8Array((explicit.valueBlock.value[0] as asn1js.Sequence).toBER(false));
    const cms = pkijs.SignedData.fromBER(signedDataBytes);
    if (!cms || !Array.isArray(cms.signerInfos) || cms.signerInfos.length === 0) {
      return { valid: false, error: "No signer in signature" };
    }
    const signer = cms.signerInfos[0];

    const signed = await cms.verify({
      signer: 0,
      data: range.buffer.slice(range.byteOffset, range.byteOffset + range.byteLength),
      checkDate: new Date(),
    });

    const cert = cms.certificates?.[0] as unknown as pkijs.Certificate | undefined;
    let signerName = "";
    if (cert) {
      const cn = cert.subject.typesAndValues.find(
        (t: { type: string }) => t.type === "2.5.4.3"
      );
      if (cn) {
        const vb = (cn.value as unknown as { valueBlock?: { value: unknown } }).valueBlock;
        if (vb) signerName = String(vb.value);
      }
    }

    return {
      valid: Boolean(signed),
      signerName,
      algorithm: signer.signatureAlgorithm?.algorithmId ?? "",
    };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Could not verify signature" };
  }
}

export function certCommonName(certPem: string): string {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const cn = cert.subject.getField("CN");
    return cn ? String(cn.value) : "";
  } catch {
    return "";
  }
}

/** Generate a self-signed RSA keypair + certificate (no external tools needed). */
export function generateSelfSignedCert(opts: { name: string; email?: string; country?: string }): {
  keyPem: string;
  certPem: string;
} {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

  const attrs = [
    { name: "commonName", value: opts.name },
  ];
  if (opts.country) attrs.push({ name: "countryName", value: opts.country });
  if (opts.email) attrs.push({ name: "emailAddress", value: opts.email });

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, nonRepudiation: true },
    { name: "subjectAltName", altNames: opts.email ? [{ type: 1, value: opts.email }] : [] },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    keyPem: forge.pki.privateKeyToPem(keys.privateKey),
    certPem: forge.pki.certificateToPem(cert),
  };
}

export function certConfigured(keyPem?: string | null, certPem?: string | null): boolean {
  return Boolean(keyPem && certPem);
}
