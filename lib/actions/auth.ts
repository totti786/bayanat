"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/auth";
import { loginSchema, signupSchema } from "@/lib/validators";

export type AuthState = { error?: string } | null;

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
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

  await createSession(user.id);
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
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password" };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
