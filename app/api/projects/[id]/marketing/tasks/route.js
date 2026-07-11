import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";
import { PRODUCT_STAGES } from "@/lib/marketing/constants";

const STAGE_IDS = PRODUCT_STAGES.map((s) => s.id);

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

  const stage = body.stage || "idea";
  if (!STAGE_IDS.includes(stage)) {
    return NextResponse.json({ error: "Geçersiz aşama" }, { status: 400 });
  }

  const priority = body.priority || "medium";
  if (!["low", "medium", "high"].includes(priority)) {
    return NextResponse.json({ error: "Geçersiz öncelik" }, { status: 400 });
  }

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_tasks")
      .insert({
        blueprint_id: blueprintId,
        title,
        description: body.description || "",
        platform: body.platform || "",
        stage,
        priority,
        assigned_to: body.assigned_to || "",
        due_date: body.due_date || null,
        status: body.status || "todo",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
