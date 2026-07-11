export async function checkProjectAccess(supabase, user, admin, projectId) {
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project) return { ok: false, status: 404, error: "Proje bulunamadı" };
  if (!admin && project.user_id !== user.id) {
    return { ok: false, status: 403, error: "Erişim yok" };
  }
  return { ok: true, project };
}
