import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import type { User, Organization, UserRole } from "@/generated/prisma/client";

const SESSION_COOKIE = "session";
const ACTIVE_ORG_COOKIE = "activeOrg";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-me"
);

export async function createSession(userId: string, version = 0): Promise<void> {
  const token = await new SignJWT({ v: version })
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

export type SessionUser = User & {
  org: Organization | null;
  memberships?: {
    id: string;
    orgId: string;
    role: UserRole;
    org: Organization;
  }[];
};

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
      include: { org: true, memberships: { include: { org: true } } },
    });
    if (!user) return null;

    // Reject tokens issued before the last password change.
    if (payload.v !== undefined && payload.v !== user.sessionVersion) return null;

    const activeCookie = store.get(ACTIVE_ORG_COOKIE)?.value;
    const membership = user.memberships.find((m) => m.orgId === activeCookie) ?? null;

    const activeOrg = membership?.org ?? user.org;
    const activeRole = membership?.role ?? user.role;

    return {
      ...user,
      role: activeRole,
      org: activeOrg,
    } as SessionUser;
  } catch {
    return null;
  }
}

/** Set (or clear) which organization the user is currently working in. */
export async function setActiveOrg(orgId: string | null): Promise<void> {
  const store = await cookies();
  if (orgId) {
    store.set(ACTIVE_ORG_COOKIE, orgId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  } else {
    store.delete(ACTIVE_ORG_COOKIE);
  }
}

/** Bump the session version so every previously-issued session token is rejected. */
export async function invalidateSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
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
