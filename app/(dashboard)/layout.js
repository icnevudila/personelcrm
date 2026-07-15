import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/isAdmin";
import DashboardHeader from "@/components/DashboardHeader";
import { headers } from "next/headers";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user) {
    redirect("/login");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isFullScreen = pathname.startsWith("/dashboard/automations") || pathname.startsWith("/dashboard/social");

  return (
    <div className="min-h-screen bg-zinc-50 [--dashboard-header-height:3.75rem] dark:bg-zinc-950 flex flex-col">
      <DashboardHeader user={user} admin={admin} />
      {isFullScreen ? (
        <main className="w-full flex-1 min-h-0 flex flex-col">{children}</main>
      ) : (
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 w-full flex-1">{children}</main>
      )}
    </div>
  );
}
