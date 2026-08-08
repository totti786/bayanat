"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser, setActiveOrg } from "@/lib/auth";
import { audit } from "@/lib/audit";

export type OrgState = { error?: string; success?: boolean } | null;

export async function switchOrg(orgId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const allowed =
    user.orgId === orgId ||
    user.memberships?.some((m) => m.orgId === orgId) ||
    user.memberships?.some((m) => m.org.id === orgId);

  if (!allowed) throw new Error("Not a member of that organization");

  await setActiveOrg(orgId);
  redirect("/");
}

export async function createCompany(
  _prev: OrgState,
  formData: FormData
): Promise<OrgState> {
  const user = await getSessionUser();
  if (!user) return { error: "Not signed in" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Company name is required" };

  const org = await prisma.organization.create({
    data: {
      name,
      prefix: "INV",
      nextNumber: 1,
      defaultCurrency: "USD",
      paymentMethods: JSON.stringify(["Bank transfer", "Card", "Cash"]),
    },
  });

  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    create: { userId: user.id, orgId: org.id, role: "admin" },
    update: {},
  });

  await audit(org.id, user, { action: "company.created", entity: "organization", entityId: org.id, detail: name });
  await setActiveOrg(org.id);
  revalidatePath("/settings");
  redirect("/");
}
