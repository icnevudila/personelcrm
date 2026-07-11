import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import {
  DEFAULT_DAILY_GOAL,
  DEFAULT_POMODORO_BREAK,
  DEFAULT_POMODORO_WORK,
} from "@/lib/deep-work/constants";

export async function GET() {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { data } = await supabase
    .from("deep_work_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(
    data || {
      user_id: user.id,
      daily_goal_minutes: DEFAULT_DAILY_GOAL,
      pomodoro_work_minutes: DEFAULT_POMODORO_WORK,
      pomodoro_break_minutes: DEFAULT_POMODORO_BREAK,
    }
  );
}

export async function PATCH(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json();
  const row = {
    user_id: user.id,
    daily_goal_minutes: Number(body.daily_goal_minutes) || DEFAULT_DAILY_GOAL,
    pomodoro_work_minutes: Number(body.pomodoro_work_minutes) || DEFAULT_POMODORO_WORK,
    pomodoro_break_minutes: Number(body.pomodoro_break_minutes) || DEFAULT_POMODORO_BREAK,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("deep_work_settings")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
