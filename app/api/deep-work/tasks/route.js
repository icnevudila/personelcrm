import { NextResponse } from "next/server";
import { requireDeepWorkUser, taskSelectQuery } from "@/lib/deep-work/auth";

export async function GET(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const plannedDate = searchParams.get("planned_date");
  const todayPlan = searchParams.get("is_today_plan");
  const includeArchive = searchParams.get("include_archive") === "1";

  let query = taskSelectQuery(supabase, user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (plannedDate) query = query.eq("planned_date", plannedDate);
  if (todayPlan === "1") query = query.eq("is_today_plan", true);
  if (!includeArchive && !status) query = query.neq("status", "archive");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });

  const { data: last } = await supabase
    .from("deep_work_tasks")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("status", body.status || "todo")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const insert = {
    user_id: user.id,
    title,
    description: String(body.description || "").trim(),
    status: body.status || "todo",
    priority: body.priority || "normal",
    estimated_minutes: Number(body.estimated_minutes) || 0,
    project_id: body.project_id || null,
    planned_date: body.planned_date || null,
    is_today_plan: Boolean(body.is_today_plan),
    sort_order: (last?.sort_order ?? -1) + 1,
  };

  const { data, error } = await supabase.from("deep_work_tasks").insert(insert).select("*, projects(id, name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
