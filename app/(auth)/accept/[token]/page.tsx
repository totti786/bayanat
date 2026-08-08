import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { LogoMark, Wordmark } from "@/components/Logo";
import AcceptInviteForm from "@/components/AcceptInviteForm";

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { org: true },
  });

  if (!invite || invite.accepted || invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-lg font-bold text-neutral-900">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-neutral-500">
            This invitation is invalid, expired, or already used.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={44} />
          <div className="mt-3">
            <Wordmark dark />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-900">
            Join {invite.org.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Invited as {invite.email}</p>
        </div>
        <Card className="p-6">
          <AcceptInviteForm token={token} />
        </Card>
      </div>
    </div>
  );
}
