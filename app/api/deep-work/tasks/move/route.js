import { NextResponse } from "next/server";
import { requireDeepWorkUser } from "@/lib/deep-work/auth";

export async function PUT(request) {
  const auth = await requireDeepWorkUser();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { task_id, status, sort_order, ordered_ids } = await request.json();

  if (ordered_ids?.length) {
    const updates = ordered_ids.map((id, index) =>
      supabase
        .from("deep_work_tasks")
        .update({ sort_order: index, status: status || undefined, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
    );
    await Promise.all(updates);
    return NextResponse.json({ success: true });
  }

  if (!task_id) return NextResponse.json({ error: "task_id gerekli" }, { status: 400 });

  const updates = { updated_at: new Date().toISOString() };
  if (status) {
    updates.status = status;
    if (status === "done") updates.completed_at = new Date().toISOString();
    if (status === "archive") updates.archived_at = new Date().toISOString();
    if (status !== "done") updates.completed_at = null;
    if (status !== "archive") updates.archived_at = null;
  }
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("deep_work_tasks")
    .update(updates)
    .eq("id", task_id)
    .eq("user_id", user.id)
    .select("*, projects(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
