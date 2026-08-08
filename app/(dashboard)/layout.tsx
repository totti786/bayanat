import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUiLang } from "@/lib/ui-lang";
import AppNav from "@/components/AppNav";
import { ToastProvider } from "@/components/Toast";
import { ConfirmProvider } from "@/components/Confirm";
import ThemeStyle from "@/components/ThemeStyle";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const lang = await getUiLang();

  return (
    <div className="min-h-screen">
      <ThemeStyle accent={user.org?.themeAccent} />
      <AppNav orgName={user.org?.name ?? "Invoicing"} lang={lang} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </main>
    </div>
  );
}
