import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";

export async function PATCH(request, { params }) {
  const { id: projectId, weeklyTaskId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return NextResponse.json({ error: "Başlık boş olamaz" }, { status: 400 });
    updates.title = title;
  }
  if (body.description !== undefined) updates.description = body.description;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
  if (body.due_date !== undefined) updates.due_date = body.due_date || null;
  if (body.priority !== undefined) {
    if (!["low", "medium", "high"].includes(body.priority)) {
      return NextResponse.json({ error: "Geçersiz öncelik" }, { status: 400 });
    }
    updates.priority = body.priority;
  }
  if (body.status !== undefined) {
    if (!["todo", "doing", "done"].includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_weekly_tasks")
      .update(updates)
      .eq("id", weeklyTaskId)
      .eq("blueprint_id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id: projectId, weeklyTaskId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { error } = await supabase
      .from("marketing_weekly_tasks")
      .delete()
      .eq("id", weeklyTaskId)
      .eq("blueprint_id", blueprintId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
