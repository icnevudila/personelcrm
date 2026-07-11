import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";

export async function PATCH(request, { params }) {
  const { id: projectId, contentId } = await params;
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
  if (body.category !== undefined) updates.category = body.category;
  if (body.platform !== undefined) updates.platform = body.platform;
  if (body.planned_date !== undefined) updates.planned_date = body.planned_date || null;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.status !== undefined) {
    if (!["planned", "preparing", "ready", "published"].includes(body.status)) {
      return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
    }
    updates.status = body.status;
  }

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_contents")
      .update(updates)
      .eq("id", contentId)
      .eq("blueprint_id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "İçerik bulunamadı" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id: projectId, contentId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { error } = await supabase
      .from("marketing_contents")
      .delete()
      .eq("id", contentId)
      .eq("blueprint_id", blueprintId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
