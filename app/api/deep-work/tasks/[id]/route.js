import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";

export async function PATCH(request, { params }) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;
  const { id } = await params;

  const { data: existing, error: fetchErr } = await supabase
    .from("deep_work_tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
  }

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === "done") {
      updates.completed_at = new Date().toISOString();
    } else if (body.status === "archive") {
      updates.archived_at = new Date().toISOString();
    } else if (body.status !== "done") {
      updates.completed_at = null;
    }
    if (body.status !== "archive") updates.archived_at = null;
  }
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.estimated_minutes !== undefined) updates.estimated_minutes = Number(body.estimated_minutes) || 0;
  if (body.worked_minutes !== undefined) updates.worked_minutes = Number(body.worked_minutes) || 0;
  if (body.project_id !== undefined) updates.project_id = body.project_id || null;
  if (body.planned_date !== undefined) updates.planned_date = body.planned_date || null;
  if (body.is_today_plan !== undefined) updates.is_today_plan = Boolean(body.is_today_plan);
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

  const { data, error } = await supabase
    .from("deep_work_tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*, projects(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;
  const { id } = await params;

  const { error } = await supabase.from("deep_work_tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
