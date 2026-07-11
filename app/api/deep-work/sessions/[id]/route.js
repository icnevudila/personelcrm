import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { minutesBetween } from "@/lib/deep-work/dateUtils";

export async function PATCH(request, { params }) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;
  const { id } = await params;

  const { data: session, error: fetchErr } = await supabase
    .from("deep_work_sessions")
    .select("*, deep_work_tasks(id, worked_minutes)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 404 });
  }

  const endedAt = new Date().toISOString();
  const duration = minutesBetween(session.started_at, endedAt);

  const { data, error } = await supabase
    .from("deep_work_sessions")
    .update({ ended_at: endedAt, duration_minutes: duration })
    .eq("id", id)
    .select("*, deep_work_tasks(id, title, worked_minutes, status)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (session.session_type === "focus" && session.deep_work_tasks) {
    const newWorked = (session.deep_work_tasks.worked_minutes || 0) + duration;
    await supabase
      .from("deep_work_tasks")
      .update({ worked_minutes: newWorked, updated_at: endedAt })
      .eq("id", session.task_id);
  }

  return NextResponse.json(data);
}
