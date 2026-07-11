import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";
import { KPI_FIELDS } from "@/lib/marketing/constants";

const KPI_KEYS = KPI_FIELDS.map((f) => f.key);

export async function PATCH(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = { updated_at: new Date().toISOString() };

  for (const key of KPI_KEYS) {
    if (body[key] !== undefined) {
      const val = Number(body[key]);
      if (Number.isNaN(val) || val < 0) {
        return NextResponse.json({ error: `${key} geçersiz` }, { status: 400 });
      }
      updates[key] = val;
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_kpis")
      .update(updates)
      .eq("blueprint_id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
