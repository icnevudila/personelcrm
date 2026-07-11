import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/isAdmin";
import DashboardHeader from "@/components/DashboardHeader";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 [--dashboard-header-height:3.75rem] dark:bg-zinc-950">
      <DashboardHeader user={user} admin={admin} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
