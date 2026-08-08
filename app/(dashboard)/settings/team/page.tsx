import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TeamPanel from "@/components/TeamPanel";
import { getUiLang } from "@/lib/ui-lang";
import { u } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireOrg();
  const lang = await getUiLang();

  const [members, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { orgId: user.org.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.invite.findMany({
      where: { orgId: user.org.id, accepted: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{u("team", lang)}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {u("teamSubtitle", lang)}
        </p>
      </div>
      <TeamPanel
        members={members}
        pendingInvites={pendingInvites.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt,
        }))}
        currentUserId={user.id}
        isAdmin={user.role === "admin"}
        lang={lang}
      />
    </div>
  );
}
