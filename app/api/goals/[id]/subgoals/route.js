import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export async function POST(request, { params }) {
  const { id: goalId } = await params;
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: goal } = await supabase
    .from("user_goals")
    .select("id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (!goal) return NextResponse.json({ error: "Hedef bulunamadı" }, { status: 404 });

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Alt hedef metni gerekli" }, { status: 400 });
  }

  const progress = clampProgress(body.progress ?? 0);

  const { data: last } = await supabase
    .from("user_goal_subgoals")
    .select("sort_order")
    .eq("goal_id", goalId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (last?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("user_goal_subgoals")
    .insert({
      goal_id: goalId,
      title,
      progress,
      sort_order,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
