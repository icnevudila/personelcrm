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
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });

  try {
    const blueprintId = await ensureProjectBlueprint(supabase, projectId);
    const { data: last } = await supabase
      .from("blueprint_success_metrics")
      .select("sort_order")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("blueprint_success_metrics")
      .insert({
        blueprint_id: blueprintId,
        title,
        target_value: body.target_value || "",
        current_value: body.current_value || "",
        completed: Boolean(body.completed),
        sort_order: (last?.sort_order ?? -1) + 1,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
