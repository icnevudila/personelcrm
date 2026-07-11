import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardBackLink from "@/components/dashboard/DashboardBackLink";

export const metadata = { title: "Bekleyen kurulum formları — Site CRM" };

export default async function PendingInstallationsPage() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  let query = supabase
    .from("installation_forms")
    .select(
      `
      id,
      business_name,
      created_at,
      project_id,
      projects (
        id,
        name
      )
    `
    )
    .eq("is_completed", false)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!admin) {
    const { data: proj } = await supabase.from("projects").select("id").eq("user_id", user.id);
    const ids = (proj || []).map((p) => p.id);
    if (ids.length === 0) {
      return (
        <div>
          <DashboardBackLink />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Bekleyen kurulum formları</h1>
          <p className="mt-8 text-center text-sm text-zinc-500">Kayıt yok.</p>
        </div>
      );
    }
    query = query.in("project_id", ids);
  }

  const { data: rows, error } = await query;

  if (error) {
    return (
      <div>
        <DashboardBackLink />
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Bekleyen kurulum formları</h1>
      <p className="mt-1 text-sm text-zinc-500">Henüz tamamlanmamış kurulum formları</p>

      {!rows?.length ? (
        <p className="mt-8 text-center text-sm text-zinc-500">Bekleyen form yok.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((row) => {
            const project = row.projects;
            const displayName = row.business_name?.trim() || "İşletme adı yok";
            const projectName = project?.name || "Proje";
            return (
              <li
                key={row.id}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{displayName}</p>
                <p className="text-xs text-zinc-500">
                  {project?.id ? (
                    <Link href={`/projects/${project.id}?tab=installation`} className="hover:underline">
                      {projectName}
                    </Link>
                  ) : (
                    projectName
                  )}
                  {" · "}
                  {row.created_at ? new Date(row.created_at).toLocaleString("tr-TR") : "—"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
