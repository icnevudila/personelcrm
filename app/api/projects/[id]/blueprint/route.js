import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/productBlueprint/access";
import { ensureProjectBlueprint, fetchBlueprintData } from "@/lib/productBlueprint/seed";
import { ROADMAP_STAGES } from "@/lib/productBlueprint/constants";

const STAGE_IDS = ROADMAP_STAGES.map((s) => s.id);

const BLUEPRINT_FIELDS = [
  "short_description",
  "elevator_pitch",
  "problem",
  "solution",
  "target_audience",
  "industry",
  "country",
  "user_type",
  "company_type",
  "ideal_customer_profile",
  "value_proposition",
  "monetization_model",
  "roadmap_stage",
  "vision",
  "mission",
  "long_term_goal",
];

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  try {
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description, type")
      .eq("id", projectId)
      .single();

    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const data = await fetchBlueprintData(supabase, blueprintId);

    return NextResponse.json({ project, ...data });
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

  if (updates.roadmap_stage && !STAGE_IDS.includes(updates.roadmap_stage)) {
    return NextResponse.json({ error: "Geçersiz roadmap aşaması" }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("project_blueprints")
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
