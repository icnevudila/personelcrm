import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const access = await checkProjectAccess(supabase, user, admin, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from("seo_settings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    data || {
      project_id: projectId,
      weekly_content_goal: 5,
      auto_generate_keywords: true,
      auto_cluster_keywords: true,
      auto_detect_intent: true,
    }
  );
}

export async function PUT(request, { params }) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const access = await checkProjectAccess(supabase, user, admin, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json();
  const payload = {
    project_id: projectId,
    weekly_content_goal: body.weekly_content_goal ?? 5,
    auto_generate_keywords: body.auto_generate_keywords ?? true,
    auto_cluster_keywords: body.auto_cluster_keywords ?? true,
    auto_detect_intent: body.auto_detect_intent ?? true,
  };

  const { data, error } = await supabase
    .from("seo_settings")
    .upsert(payload, { onConflict: "project_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
