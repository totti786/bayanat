import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import type { User, Organization } from "@/generated/prisma/client";

const SESSION_COOKIE = "session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-me"
);

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type SessionUser = User & { org: Organization | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { org: true },
    });
    if (!user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireOrg(): Promise<SessionUser & { org: Organization }> {
  const user = await requireUser();
  if (!user.org) throw new Error("No organization");
  return user as SessionUser & { org: Organization };
}
