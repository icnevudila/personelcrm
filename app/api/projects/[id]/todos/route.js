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

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("project_todos")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_deleted", false)
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

  const { title, color } = await request.json();
  const trimmed = String(title || "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Todo metni gerekli" }, { status: 400 });
  }

  const allowedColors = ["blue", "amber", "rose"];
  let todoColor = null;
  if (color && allowedColors.includes(color)) {
    todoColor = color;
  }

  const { data: lastTodo } = await supabase
    .from("project_todos")
    .select("sort_order")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .eq("is_later", false)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (lastTodo?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("project_todos")
    .insert({ project_id: projectId, title: trimmed, sort_order, color: todoColor })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
