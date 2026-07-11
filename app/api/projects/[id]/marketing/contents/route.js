import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });

  const status = body.status || "planned";
  if (!["planned", "preparing", "ready", "published"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_contents")
      .insert({
        blueprint_id: blueprintId,
        title,
        category: body.category || "",
        platform: body.platform || "",
        planned_date: body.planned_date || null,
        status,
        notes: body.notes || "",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
