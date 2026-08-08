"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireOrg, getSessionUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, invalidateSessions, setActiveOrg } from "@/lib/auth";
import { appUrl } from "@/lib/pdf";
import { notify } from "@/lib/notify";
import { emailConfigured, sendMail } from "@/lib/mail";

export type TeamState = { error?: string; success?: boolean; inviteUrl?: string } | null;

export async function inviteMember(
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const user = await requireOrg();
  if (user.role !== "admin") return { error: "Only admins can invite members" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = (formData.get("role") as string) === "admin" ? "admin" : "accountant";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Invalid email" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Existing account: add them straight to the org as a member.
    await prisma.membership.upsert({
      where: { userId_orgId: { userId: existing.id, orgId: user.org.id } },
      create: { userId: existing.id, orgId: user.org.id, role },
      update: { role },
    });
    await notify(user.org.id, {
      type: "invite",
      title: `${email} joined the team`,
      titleAr: `انضم ${email} إلى الفريق`,
    });
    revalidatePath("/settings/team");
    return { success: true };
  }

  const token = randomBytes(24).toString("hex");
  await prisma.invite.create({
    data: {
      orgId: user.org.id,
      email,
      role,
      token,
      invitedBy: user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });

  const inviteUrl = `${appUrl("")}/accept/${token}`;
  await notify(user.org.id, {
    type: "invite",
    title: `${email} invited to the team`,
    titleAr: `تمت دعوة ${email} للفريق`,
  });

  if (emailConfigured()) {
    try {
      await sendMail({
        to: email,
        subject: `Join ${user.org.name} on Bayanat`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
            <p style="color:#444;line-height:1.6">
              You've been invited to join <strong>${user.org.name}</strong> on Bayanat.
            </p>
            <p><a href="${inviteUrl}" style="color:#1d3836">Accept the invitation</a></p>
            <p style="color:#888;font-size:13px">This link expires in 7 days.</p>
          </div>`,
      });
    } catch {
      /* fall through — we still return the link */
    }
  }

  revalidatePath("/settings/team");
  return { success: true, inviteUrl };
}

export async function updateMemberRole(
  userId: string,
  role: "admin" | "accountant" | "viewer"
): Promise<void> {
  const user = await requireOrg();
  if (user.role !== "admin") throw new Error("Only admins can change roles");
  if (userId === user.id) throw new Error("You cannot change your own role");

  await prisma.user.updateMany({
    where: { id: userId, orgId: user.org.id },
    data: { role },
  });
  revalidatePath("/settings/team");
}

export async function removeMember(userId: string): Promise<void> {
  const user = await requireOrg();
  if (user.role !== "admin") throw new Error("Only admins can remove members");
  if (userId === user.id) throw new Error("You cannot remove yourself");

  await prisma.user.updateMany({
    where: { id: userId, orgId: user.org.id },
    data: { orgId: null },
  });
  revalidatePath("/settings/team");
}

export async function changePassword(
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in" };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");

  if (!verifyPassword(current, user.passwordHash)) return { error: "Current password is incorrect" };
  if (next.length < 8) return { error: "New password must be at least 8 characters" };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });
  await invalidateSessions(user.id);
  return { success: true };
}

export async function acceptInvite(
  token: string,
  _prev: TeamState,
  formData: FormData
): Promise<TeamState> {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.accepted) return { error: "Invitation not found or already used" };
  if (invite.expiresAt < new Date()) return { error: "Invitation has expired" };

  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Name is required" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const email = invite.email;

  const existing = await prisma.user.findUnique({ where: { email } });

  let user;
  if (existing) {
    // Existing account: add them to the org and sign them into it.
    await prisma.membership.upsert({
      where: { userId_orgId: { userId: existing.id, orgId: invite.orgId } },
      create: { userId: existing.id, orgId: invite.orgId, role: invite.role },
      update: { role: invite.role },
    });
    user = existing;
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        role: invite.role,
        orgId: invite.orgId,
        memberships: {
          create: { orgId: invite.orgId, role: invite.role },
        },
      },
    });
  }

  await prisma.invite.update({ where: { id: invite.id }, data: { accepted: true } });
  await createSession(user.id, user.sessionVersion);
  await setActiveOrg(invite.orgId);
  redirect("/");
}
