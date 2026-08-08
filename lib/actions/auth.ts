"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/auth";
import { loginSchema, signupSchema } from "@/lib/validators";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/ratelimit";

export type AuthState = { error?: string } | null;

const LOGIN_MAX = 8;
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes

async function ip(): Promise<string> {
  const h = await headers();
  return clientIp(h);
}

function blockedMessage(retryAfterSec: number): string {
  const mins = Math.ceil(retryAfterSec / 60);
  return `Too many attempts. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.`;
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const limiter = rateLimit(`signup:${await ip()}`, LOGIN_MAX, LOGIN_WINDOW);
  if (!limiter.allowed) {
    return { error: blockedMessage(limiter.retryAfterSec!) };
  }

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    orgName: formData.get("orgName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, orgName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists" };

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      prefix: "INV",
      nextNumber: 1,
      defaultCurrency: "USD",
      paymentMethods: JSON.stringify(["Bank transfer", "Card", "Cash"]),
    },
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "admin",
      orgId: org.id,
    },
  });

  await createSession(user.id, user.sessionVersion);
  redirect("/");
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password } = parsed.data;
  const ipAddr = await ip();

  // Two buckets: per (ip+email) for targeted attacks, and per-IP as a hard cap.
  const combo = rateLimit(`login:${ipAddr}:${email}`, LOGIN_MAX, LOGIN_WINDOW);
  if (!combo.allowed) return { error: blockedMessage(combo.retryAfterSec!) };
  const byIp = rateLimit(`login:${ipAddr}`, LOGIN_MAX * 4, LOGIN_WINDOW);
  if (!byIp.allowed) return { error: blockedMessage(byIp.retryAfterSec!) };

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password" };
  }

  resetRateLimit(`login:${ipAddr}:${email}`);
  resetRateLimit(`login:${ipAddr}`);
  await createSession(user.id, user.sessionVersion);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
