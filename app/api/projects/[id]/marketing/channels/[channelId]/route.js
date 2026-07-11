import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";

async function getBlueprintId(supabase, projectId) {
  return ensureMarketingBlueprint(supabase, projectId);
}

export async function PATCH(request, { params }) {
  const { id: projectId, channelId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  if (body.enabled !== undefined) updates.enabled = Boolean(body.enabled);
  if (body.priority !== undefined) {
    if (!["low", "medium", "high"].includes(body.priority)) {
      return NextResponse.json({ error: "Geçersiz öncelik" }, { status: 400 });
    }
    updates.priority = body.priority;
  }
  if (body.notes !== undefined) updates.notes = String(body.notes);

  try {
    const blueprintId = await getBlueprintId(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_channels")
      .update(updates)
      .eq("id", channelId)
      .eq("blueprint_id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Kanal bulunamadı" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
