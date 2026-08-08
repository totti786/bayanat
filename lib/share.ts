import "server-only";

import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-me"
);

export async function createShareToken(invoiceId: string): Promise<string> {
  return new SignJWT({ scope: "invoice-share" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(invoiceId)
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret);
}

export async function verifyShareToken(
  token: string
): Promise<{ invoiceId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.scope !== "invoice-share" || !payload.sub) return null;
    return { invoiceId: payload.sub };
  } catch {
    return null;
  }
}
