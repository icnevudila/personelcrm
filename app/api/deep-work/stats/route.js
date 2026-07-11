import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";
import { startOfMonth, startOfWeek, todayDateStr, toDateStr } from "@/lib/deep-work/dateUtils";

export async function GET() {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const weekStart = startOfWeek().toISOString();
  const monthStart = startOfMonth().toISOString();
  const today = todayDateStr();

  const { data: sessions } = await supabase
    .from("deep_work_sessions")
    .select("duration_minutes, started_at, session_type, task_id, deep_work_tasks(project_id, projects(name))")
    .eq("user_id", user.id)
    .eq("session_type", "focus")
    .not("ended_at", "is", null);

  const { data: completedTasks } = await supabase
    .from("deep_work_tasks")
    .select("id, completed_at")
    .eq("user_id", user.id)
    .eq("status", "done");

  const weekMinutes = (sessions || [])
    .filter((s) => new Date(s.started_at) >= new Date(weekStart))
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const monthMinutes = (sessions || [])
    .filter((s) => new Date(s.started_at) >= new Date(monthStart))
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const totalMinutes = (sessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const completedCount = (completedTasks || []).length;

  const projectMap = {};
  for (const s of sessions || []) {
    const name = s.deep_work_tasks?.projects?.name || "Proje yok";
    projectMap[name] = (projectMap[name] || 0) + (s.duration_minutes || 0);
  }
  const topProjects = Object.entries(projectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, minutes]) => ({ name, minutes }));

  const workDays = new Set(
    (sessions || []).map((s) => toDateStr(s.started_at)).filter(Boolean)
  );

  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = toDateStr(cursor);
    if (workDays.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0 && key === today) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const todayMinutes = (sessions || [])
    .filter((s) => toDateStr(s.started_at) === today)
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return NextResponse.json({
    weekMinutes,
    monthMinutes,
    totalMinutes,
    todayMinutes,
    completedCount,
    streak,
    topProjects,
  });
}
