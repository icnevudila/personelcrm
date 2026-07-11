import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { redirect } from "next/navigation";
import DashboardBackLink from "@/components/dashboard/DashboardBackLink";
import ProjectList from "@/components/ProjectList";

export const metadata = { title: "Was CRM" };

export default async function ArchivePage() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  let query = supabase
    .from("projects")
    .select("*, installation_forms(public_token)")
    .eq("is_archived", true)
    .order("is_favorited", { ascending: false })
    .order("created_at", { ascending: false });

  if (!admin) {
    query = query.eq("user_id", user.id);
  }

  const { data: projects, error } = await query;

  if (error) {
    return (
      <div>
        <DashboardBackLink />
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardBackLink />
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Arşiv</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {admin ? "Arşivlenmiş tüm projeler" : "Arşivlenmiş projeleriniz"}
        </p>
      </div>

      {!projects?.length ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Arşivlenmiş proje yok.</p>
        </div>
      ) : (
        <ProjectList initialProjects={projects} isAdmin={admin} />
      )}
    </div>
  );
}
