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

const ALLOWED_LABELS = ["mvp", "normal", "later"];

export async function PATCH(request, { params }) {
  const { id: projectId, featureId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const trimmed = String(body.title).trim();
    if (!trimmed) return NextResponse.json({ error: "Özellik adı boş olamaz" }, { status: 400 });
    updates.title = trimmed;
  }

  if (body.description !== undefined) {
    updates.description = String(body.description || "").trim();
  }

  if (body.label !== undefined) {
    if (body.label === null || body.label === "") {
      updates.label = null;
    } else if (ALLOWED_LABELS.includes(body.label)) {
      updates.label = body.label;
    } else {
      return NextResponse.json({ error: "Geçersiz etiket" }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("project_mvp_features")
    .update(updates)
    .eq("id", featureId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Özellik bulunamadı" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id: projectId, featureId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { error } = await supabase
    .from("project_mvp_features")
    .delete()
    .eq("id", featureId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
