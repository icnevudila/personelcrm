import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

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

function mapGoals(data) {
  return (data || []).map((goal) => {
    const subgoals = [...(goal.project_goal_subgoals || [])].sort(
      (a, b) => a.sort_order - b.sort_order || new Date(a.created_at) - new Date(b.created_at)
    );
    const { project_goal_subgoals, ...rest } = goal;
    return { ...rest, subgoals };
  });
}

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("project_goals")
    .select("*, project_goal_subgoals(*)")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapGoals(data));
}

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Hedef metni gerekli" }, { status: 400 });
  }

  const progress = clampProgress(body.progress ?? 0);

  const { data: last } = await supabase
    .from("project_goals")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (last?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("project_goals")
    .insert({
      project_id: projectId,
      title,
      progress,
      sort_order,
    })
    .select("*, project_goal_subgoals(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { project_goal_subgoals, ...rest } = data;
  return NextResponse.json({ ...rest, subgoals: project_goal_subgoals || [] }, { status: 201 });
}
