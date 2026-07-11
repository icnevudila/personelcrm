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

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("project_mvp_features")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { title, description, label } = await request.json();
  const trimmedTitle = String(title || "").trim();
  if (!trimmedTitle) {
    return NextResponse.json({ error: "Özellik adı gerekli" }, { status: 400 });
  }

  let featureLabel = null;
  if (label && ALLOWED_LABELS.includes(label)) {
    featureLabel = label;
  }

  const { data: lastFeature } = await supabase
    .from("project_mvp_features")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (lastFeature?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("project_mvp_features")
    .insert({
      project_id: projectId,
      title: trimmedTitle,
      description: String(description || "").trim(),
      label: featureLabel,
      sort_order,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
