import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

async function getProjectAccess(supabase, user, admin, projectId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin || project.user_id === user.id) return { project, allowed: true };
  return { project, allowed: false };
}

export async function PUT(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { ordered_ids } = await request.json();
  if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
    return NextResponse.json({ error: "ordered_ids gerekli" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("project_todos")
    .select("id")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .eq("is_later", false)
    .eq("is_deleted", false);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const existingIds = new Set((existing || []).map((t) => t.id));
  if (ordered_ids.length !== existingIds.size || ordered_ids.some((id) => !existingIds.has(id))) {
    return NextResponse.json({ error: "Geçersiz sıralama listesi" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updates = ordered_ids.map((id, index) =>
    supabase
      .from("project_todos")
      .update({ sort_order: index, updated_at: now })
      .eq("id", id)
      .eq("project_id", projectId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  const { data, error } = await supabase
    .from("project_todos")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .eq("is_later", false)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
