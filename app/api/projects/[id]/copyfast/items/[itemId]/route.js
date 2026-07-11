import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/projectCopy/context";

const ITEM_TYPES = ["page", "component"];

export async function PATCH(request, { params }) {
  const { id: projectId, itemId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Ad boş olamaz" }, { status: 400 });
    updates.name = name;
  }
  if (body.description !== undefined) updates.description = body.description || "";
  if (body.is_responsive !== undefined) updates.is_responsive = Boolean(body.is_responsive);
  if (body.use_ai !== undefined) updates.use_ai = Boolean(body.use_ai);
  if (body.item_type !== undefined) {
    if (!ITEM_TYPES.includes(body.item_type)) {
      return NextResponse.json({ error: "Geçersiz tür" }, { status: 400 });
    }
    updates.item_type = body.item_type;
  }
  if (body.parent_id !== undefined) updates.parent_id = body.parent_id || null;
  if (body.web_image_url !== undefined) updates.web_image_url = body.web_image_url || null;
  if (body.mobile_image_url !== undefined) updates.mobile_image_url = body.mobile_image_url || null;
  if (body.generated_prompt !== undefined) updates.generated_prompt = body.generated_prompt || "";
  if (body.status !== undefined) updates.status = body.status;
  if (body.error_message !== undefined) updates.error_message = body.error_message || null;

  const { data, error } = await supabase
    .from("copyfast_items")
    .update(updates)
    .eq("id", itemId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id: projectId, itemId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { error } = await supabase
    .from("copyfast_items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
