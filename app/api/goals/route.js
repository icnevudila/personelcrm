import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";

function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_goals")
    .select("*, user_goal_subgoals(*)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const goals = (data || []).map((goal) => {
    const subgoals = [...(goal.user_goal_subgoals || [])].sort(
      (a, b) => a.sort_order - b.sort_order || new Date(a.created_at) - new Date(b.created_at)
    );
    const { user_goal_subgoals, ...rest } = goal;
    return { ...rest, subgoals };
  });

  return NextResponse.json(goals);
}

export async function POST(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Hedef metni gerekli" }, { status: 400 });
  }

  const progress = clampProgress(body.progress ?? 0);

  const { data: last } = await supabase
    .from("user_goals")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (last?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("user_goals")
    .insert({
      user_id: user.id,
      title,
      progress,
      sort_order,
    })
    .select("*, user_goal_subgoals(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { user_goal_subgoals, ...rest } = data;
  return NextResponse.json({ ...rest, subgoals: user_goal_subgoals || [] }, { status: 201 });
}
