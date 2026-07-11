import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import ProjectDetail from "@/components/project/ProjectDetail";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("name").eq("id", id).single();
  return { title: `${data?.name || "Proje"} — Site CRM` };
}

export default async function ProjectPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user) redirect("/login");

  const { data: project, error } = await supabase
    .from("projects")
    .select("*, installation_forms(public_token), site_pages(*), domains(*), update_public_token")
    .eq("id", id)
    .single();

  if (error || !project) notFound();

  if (!admin && project.user_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <Suspense fallback={null}>
      <ProjectDetail
        project={project}
        isAdmin={admin}
        currentUserId={user.id}
      />
    </Suspense>
  );
}
