import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/projectCopy/context";

const COPY_TYPES = ["slogan", "sales_copy", "tagline", "headline"];

export async function PATCH(request, { params }) {
  const { id: projectId, sloganId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.content !== undefined) {
    const content = String(body.content).trim();
    if (!content) return NextResponse.json({ error: "Metin boş olamaz" }, { status: 400 });
    updates.content = content;
  }
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.copy_type !== undefined) {
    if (!COPY_TYPES.includes(body.copy_type)) {
      return NextResponse.json({ error: "Geçersiz metin tipi" }, { status: 400 });
    }
    updates.copy_type = body.copy_type;
  }
  if (body.is_favorited !== undefined) updates.is_favorited = Boolean(body.is_favorited);

  const { data, error } = await supabase
    .from("project_slogans")
    .update(updates)
    .eq("id", sloganId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id: projectId, sloganId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { error } = await supabase
    .from("project_slogans")
    .delete()
    .eq("id", sloganId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
