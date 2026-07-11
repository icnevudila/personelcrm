import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

async function getOwnedSubgoal(supabase, userId, goalId, subId) {
  const { data: goal } = await supabase
    .from("user_goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (!goal) return null;

  const { data: subgoal } = await supabase
    .from("user_goal_subgoals")
    .select("id")
    .eq("id", subId)
    .eq("goal_id", goalId)
    .single();

  return subgoal || null;
}

export async function PATCH(request, { params }) {
  const { id: goalId, subId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const owned = await getOwnedSubgoal(supabase, user.id, goalId, subId);
  if (!owned) return NextResponse.json({ error: "Alt hedef bulunamadı" }, { status: 404 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Alt hedef metni boş olamaz" }, { status: 400 });
    updates.title = title;
  }

  if (body.progress !== undefined) {
    updates.progress = clampProgress(body.progress);
  }

  const { data, error } = await supabase
    .from("user_goal_subgoals")
    .update(updates)
    .eq("id", subId)
    .eq("goal_id", goalId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Alt hedef bulunamadı" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id: goalId, subId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const owned = await getOwnedSubgoal(supabase, user.id, goalId, subId);
  if (!owned) return NextResponse.json({ error: "Alt hedef bulunamadı" }, { status: 404 });

  const { error } = await supabase
    .from("user_goal_subgoals")
    .delete()
    .eq("id", subId)
    .eq("goal_id", goalId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
