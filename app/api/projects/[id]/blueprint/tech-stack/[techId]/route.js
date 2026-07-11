import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/productBlueprint/access";
import { ensureProjectBlueprint } from "@/lib/productBlueprint/seed";

const CATEGORIES = ["frontend", "backend", "database", "ai", "payment", "hosting", "analytics", "other"];

export async function PATCH(request, { params }) {
  const { id: projectId, techId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.technology !== undefined) {
    const technology = String(body.technology).trim();
    if (!technology) return NextResponse.json({ error: "Teknoloji adı boş olamaz" }, { status: 400 });
    updates.technology = technology;
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
    }
    updates.category = body.category;
  }

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("blueprint_tech_stack")
      .update(updates)
      .eq("id", techId)
      .eq("blueprint_id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Teknoloji bulunamadı" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id: projectId, techId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { error } = await supabase
      .from("blueprint_tech_stack")
      .delete()
      .eq("id", techId)
      .eq("blueprint_id", blueprintId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
