import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

async function getOwnedGoal(supabase, userId, goalId) {
  const { data, error } = await supabase
    .from("user_goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function PATCH(request, { params }) {
  const { id: goalId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const owned = await getOwnedGoal(supabase, user.id, goalId);
  if (!owned) return NextResponse.json({ error: "Hedef bulunamadı" }, { status: 404 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Hedef metni boş olamaz" }, { status: 400 });
    updates.title = title;
  }

  if (body.progress !== undefined) {
    updates.progress = clampProgress(body.progress);
  }

  if (body.is_archived !== undefined) {
    updates.is_archived = Boolean(body.is_archived);
  }

  const { data, error } = await supabase
    .from("user_goals")
    .update(updates)
    .eq("id", goalId)
    .eq("user_id", user.id)
    .select("*, user_goal_subgoals(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Hedef bulunamadı" }, { status: 404 });

  const subgoals = [...(data.user_goal_subgoals || [])].sort(
    (a, b) => a.sort_order - b.sort_order || new Date(a.created_at) - new Date(b.created_at)
  );
  const { user_goal_subgoals, ...rest } = data;
  return NextResponse.json({ ...rest, subgoals });
}

export async function DELETE(request, { params }) {
  const { id: goalId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const owned = await getOwnedGoal(supabase, user.id, goalId);
  if (!owned) return NextResponse.json({ error: "Hedef bulunamadı" }, { status: 404 });

  const { error } = await supabase
    .from("user_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
