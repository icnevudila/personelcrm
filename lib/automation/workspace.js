import { createAdminClient } from "@/lib/supabase/admin";

function slugFor(user) {
  return `personal-${user.id.replace(/-/g, "").slice(0, 12)}`;
}

export async function getOrCreatePersonalWorkspace(user) {
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin.from("workspace_members").select("workspace_id, workspaces(id,name,slug)").eq("user_id", user.id).limit(1).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.workspaces) return existing.workspaces;
  const slug = slugFor(user);
  const { data: workspace, error } = await admin.from("workspaces").upsert({ slug, name: `${user.email?.split("@")[0] || "Kişisel"} workspace`, created_by: user.id }, { onConflict: "slug" }).select("id,name,slug").single();
  if (error) throw error;
  const { error: membershipError } = await admin.from("workspace_members").upsert({ workspace_id: workspace.id, user_id: user.id, role: "owner" }, { onConflict: "workspace_id,user_id" });
  if (membershipError) throw membershipError;
  return workspace;
}
