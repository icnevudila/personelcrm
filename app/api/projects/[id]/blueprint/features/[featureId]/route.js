import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/productBlueprint/access";
import { ensureProjectBlueprint } from "@/lib/productBlueprint/seed";

export async function PATCH(request, { params }) {
  const { id: projectId, featureId } = await params;
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
  if (body.is_mvp !== undefined) updates.is_mvp = Boolean(body.is_mvp);
  if (body.priority !== undefined) {
    if (!["low", "medium", "high"].includes(body.priority)) {
      return NextResponse.json({ error: "Geçersiz öncelik" }, { status: 400 });
    }
    updates.priority = body.priority;
  }

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("blueprint_features")
      .update(updates)
      .eq("id", featureId)
      .eq("blueprint_id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Özellik bulunamadı" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id: projectId, featureId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { error } = await supabase
      .from("blueprint_features")
      .delete()
      .eq("id", featureId)
      .eq("blueprint_id", blueprintId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
