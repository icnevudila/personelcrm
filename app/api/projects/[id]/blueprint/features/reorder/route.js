import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/productBlueprint/access";
import { ensureProjectBlueprint } from "@/lib/productBlueprint/seed";

export async function PUT(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { ordered_ids } = await request.json();
  if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
    return NextResponse.json({ error: "ordered_ids gerekli" }, { status: 400 });
  }

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { data: existing, error: fetchError } = await supabase
      .from("blueprint_features")
      .select("id")
      .eq("blueprint_id", blueprintId);

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    const existingIds = new Set((existing || []).map((f) => f.id));
    if (ordered_ids.length !== existingIds.size || ordered_ids.some((id) => !existingIds.has(id))) {
      return NextResponse.json({ error: "Geçersiz sıralama listesi" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const results = await Promise.all(
      ordered_ids.map((id, index) =>
        supabase
          .from("blueprint_features")
          .update({ sort_order: index, updated_at: now })
          .eq("id", id)
          .eq("blueprint_id", blueprintId)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

    const { data, error } = await supabase
      .from("blueprint_features")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
