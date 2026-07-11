import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { minutesBetween } from "@/lib/deep-work/dateUtils";

export async function GET(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "1";

  let query = supabase
    .from("deep_work_sessions")
    .select("*, deep_work_tasks(id, title, worked_minutes, status)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (activeOnly) query = query.is("ended_at", null);

  const { data, error } = await query.limit(activeOnly ? 1 : 50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(activeOnly ? data?.[0] || null : data || []);
}

export async function POST(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { task_id, session_type = "focus" } = await request.json();
  if (!task_id) return NextResponse.json({ error: "task_id gerekli" }, { status: 400 });

  const { data: task } = await supabase
    .from("deep_work_tasks")
    .select("id")
    .eq("id", task_id)
    .eq("user_id", user.id)
    .single();

  if (!task) return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });

  const { data: activeSessions } = await supabase
    .from("deep_work_sessions")
    .select("*, deep_work_tasks(worked_minutes)")
    .eq("user_id", user.id)
    .is("ended_at", null);

  for (const active of activeSessions || []) {
    const endedAt = new Date().toISOString();
    const duration = minutesBetween(active.started_at, endedAt);
    await supabase
      .from("deep_work_sessions")
      .update({ ended_at: endedAt, duration_minutes: duration })
      .eq("id", active.id);

    if (active.session_type === "focus" && active.deep_work_tasks) {
      await supabase
        .from("deep_work_tasks")
        .update({
          worked_minutes: (active.deep_work_tasks.worked_minutes || 0) + duration,
          updated_at: endedAt,
        })
        .eq("id", active.task_id);
    }
  }

  await supabase
    .from("deep_work_tasks")
    .update({ status: "doing", updated_at: new Date().toISOString() })
    .eq("id", task_id)
    .eq("user_id", user.id)
    .neq("status", "done");

  const { data, error } = await supabase
    .from("deep_work_sessions")
    .insert({ user_id: user.id, task_id, session_type })
    .select("*, deep_work_tasks(id, title, worked_minutes, status)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
