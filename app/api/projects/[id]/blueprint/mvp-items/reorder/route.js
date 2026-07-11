import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/productBlueprint/access";
import { ensureProjectBlueprint } from "@/lib/productBlueprint/seed";

const STAGES = ["mvp", "next_version", "future"];

export async function PUT(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { stage, ordered_ids } = await request.json();
  if (!stage || !STAGES.includes(stage)) {
    return NextResponse.json({ error: "Geçerli stage gerekli" }, { status: 400 });
  }
  if (!Array.isArray(ordered_ids)) {
    return NextResponse.json({ error: "ordered_ids gerekli" }, { status: 400 });
  }

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { data: existing, error: fetchError } = await supabase
      .from("blueprint_mvp_items")
      .select("id")
      .eq("blueprint_id", blueprintId)
      .eq("stage", stage);

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    const existingIds = new Set((existing || []).map((i) => i.id));
    if (ordered_ids.length !== existingIds.size || ordered_ids.some((id) => !existingIds.has(id))) {
      return NextResponse.json({ error: "Geçersiz sıralama listesi" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const results = await Promise.all(
      ordered_ids.map((id, index) =>
        supabase
          .from("blueprint_mvp_items")
          .update({ sort_order: index, updated_at: now })
          .eq("id", id)
          .eq("blueprint_id", blueprintId)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

    const { data, error } = await supabase
      .from("blueprint_mvp_items")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
