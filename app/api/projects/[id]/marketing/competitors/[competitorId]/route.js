import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";

export async function PATCH(request, { params }) {
  const { id: projectId, competitorId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.competitor_name !== undefined) {
    const name = String(body.competitor_name).trim();
    if (!name) return NextResponse.json({ error: "Rakip adı boş olamaz" }, { status: 400 });
    updates.competitor_name = name;
  }
  if (body.website !== undefined) updates.website = body.website;
  if (body.strengths !== undefined) updates.strengths = body.strengths;
  if (body.weaknesses !== undefined) updates.weaknesses = body.weaknesses;
  if (body.strategy !== undefined) updates.strategy = body.strategy;
  if (body.notes !== undefined) updates.notes = body.notes;

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_competitors")
      .update(updates)
      .eq("id", competitorId)
      .eq("blueprint_id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Rakip bulunamadı" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id: projectId, competitorId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { error } = await supabase
      .from("marketing_competitors")
      .delete()
      .eq("id", competitorId)
      .eq("blueprint_id", blueprintId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
