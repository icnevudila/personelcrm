import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/marketing/access";
import { ensureMarketingBlueprint, fetchMarketingData } from "@/lib/marketing/seed";
import { PRODUCT_STAGES } from "@/lib/marketing/constants";

const STAGE_IDS = PRODUCT_STAGES.map((s) => s.id);

const BLUEPRINT_FIELDS = [
  "stage",
  "marketing_score",
  "score_summary",
  "score_gaps",
  "target_audience",
  "problem",
  "solution",
  "competitors",
  "value_proposition",
  "organic_percentage",
  "paid_percentage",
  "funnel_data",
  "reverse_engineering",
  "notes",
];

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const data = await fetchMarketingData(supabase, blueprintId);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const updates = {};

  for (const field of BLUEPRINT_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (updates.stage && !STAGE_IDS.includes(updates.stage)) {
    return NextResponse.json({ error: "Geçersiz aşama" }, { status: 400 });
  }

  if (updates.marketing_score !== undefined) {
    const score = Number(updates.marketing_score);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: "Skor 0-100 arasında olmalı" }, { status: 400 });
    }
    updates.marketing_score = score;
  }

  if (updates.organic_percentage !== undefined || updates.paid_percentage !== undefined) {
    const organic = Number(updates.organic_percentage ?? body.organic_percentage ?? 50);
    const paid = Number(updates.paid_percentage ?? body.paid_percentage ?? 50);
    if (organic + paid !== 100) {
      return NextResponse.json({ error: "Organic ve Paid toplamı 100 olmalı" }, { status: 400 });
    }
    updates.organic_percentage = organic;
    updates.paid_percentage = paid;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  try {
    const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("marketing_blueprints")
      .update(updates)
      .eq("id", blueprintId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
