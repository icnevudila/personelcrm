import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { emptyCanvasData } from "@/lib/roadmap/constants";
import { normalizeCanvasData } from "@/lib/roadmap/utils";

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

export async function GET(_request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("project_roadmaps")
    .select("canvas_data, updated_at")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({
      canvas_data: emptyCanvasData(),
      updated_at: null,
    });
  }

  return NextResponse.json({
    canvas_data: normalizeCanvasData(data.canvas_data),
    updated_at: data.updated_at,
  });
}

export async function PUT(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const canvas_data = normalizeCanvasData(body.canvas_data || emptyCanvasData());

  const { data, error } = await supabase
    .from("project_roadmaps")
    .upsert(
      {
        project_id: projectId,
        canvas_data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" }
    )
    .select("canvas_data, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
