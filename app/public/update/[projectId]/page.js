import PublicUpdateForm from "@/components/public/PublicUpdateForm";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  const { projectId: token } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("update_public_token", token)
    .single();

  const projectName = project?.name || "Proje";
  const title = `${projectName} | Güncelleme Talep Formu`;
  const description = `${projectName} web sitesi için yeni güncelleme talebi oluşturun.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function PublicUpdatePage({ params }) {
  const { projectId: token } = await params;
  return <PublicUpdateForm token={token} />;
}
