"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { emailConfigured, sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/pdf";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { headers } from "next/headers";

export type ResetState = { error?: string; success?: boolean; resetUrl?: string } | null;

export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const h = await headers();
  const limiter = rateLimit(`reset:${clientIp(h)}`, 5, 60 * 60 * 1000);
  if (!limiter.allowed) {
    return { error: "Too many requests. Try again in an hour." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email" };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always succeed when the account exists; otherwise be quiet to avoid
  // leaking which emails are registered.
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${appUrl("")}/reset-password?token=${token}`;

    if (emailConfigured()) {
      try {
        await sendMail({
          to: email,
          subject: "Reset your Bayanat password",
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
              <p style="color:#444;line-height:1.6">We received a request to reset your password.</p>
              <p><a href="${resetUrl}" style="color:#1d3836">Reset your password</a></p>
              <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
            </div>`,
        });
        return { success: true };
      } catch {
        return { success: true, resetUrl };
      }
    }

    return { success: true, resetUrl };
  }

  return { success: true };
}

export async function resetPassword(
  token: string,
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.used || reset.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  await prisma.$transaction([
    prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash: hashPassword(password) },
    }),
  ]);

  redirect("/login?reset=1");
}
