import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";
import { PRODUCT_STAGES } from "@/lib/marketing/constants";

const STAGE_IDS = PRODUCT_STAGES.map((s) => s.id);

export async function PATCH(request, { params }) {
  const { id: projectId, taskId } = await params;
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
  if (body.platform !== undefined) updates.platform = body.platform;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
  if (body.due_date !== undefined) updates.due_date = body.due_date || null;
  if (body.stage !== undefined) {
    if (!STAGE_IDS.includes(body.stage)) {
      return NextResponse.json({ error: "Geçersiz aşama" }, { status: 400 });
    }
    updates.stage = body.stage;
  }
  if (body.priority !== undefined) {
    if (!["low", "medium", "high"].includes(body.priority)) {
      return NextResponse.json({ error: "Geçersiz öncelik" }, { status: 400 });
    }
    updates.priority = body.priority;
  }
  if (body.status !== undefined) {
    if (!["todo", "in_progress", "done"].includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }
    updates.status = body.status;
    updates.completed_at = body.status === "done" ? new Date().toISOString() : null;
  }

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_tasks")
      .update(updates)
      .eq("id", taskId)
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
  const { id: projectId, taskId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { error } = await supabase
      .from("marketing_tasks")
      .delete()
      .eq("id", taskId)
      .eq("blueprint_id", blueprintId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
