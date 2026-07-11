import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/productBlueprint/access";
import { ensureProjectBlueprint } from "@/lib/productBlueprint/seed";

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const competitor_name = String(body.competitor_name || "").trim();
  if (!competitor_name) return NextResponse.json({ error: "Rakip adı gerekli" }, { status: 400 });

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { data, error } = await supabase
      .from("blueprint_competitors")
      .insert({
        blueprint_id: blueprintId,
        competitor_name,
        website: body.website || "",
        strengths: body.strengths || "",
        weaknesses: body.weaknesses || "",
        differentiation: body.differentiation || "",
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
