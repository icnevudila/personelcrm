import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/projectCopy/context";

const ITEM_TYPES = ["page", "component"];

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("copyfast_items")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Ad gerekli" }, { status: 400 });

  const item_type = body.item_type || "page";
  if (!ITEM_TYPES.includes(item_type)) {
    return NextResponse.json({ error: "Geçersiz tür" }, { status: 400 });
  }

  const parent_id = body.parent_id || null;
  if (item_type === "component" && !parent_id) {
    return NextResponse.json({ error: "Bileşen için üst sayfa gerekli" }, { status: 400 });
  }

  if (parent_id) {
    const { data: parent } = await supabase
      .from("copyfast_items")
      .select("id, item_type")
      .eq("id", parent_id)
      .eq("project_id", projectId)
      .maybeSingle();
    if (!parent || parent.item_type !== "page") {
      return NextResponse.json({ error: "Geçersiz üst sayfa" }, { status: 400 });
    }
  }

  const scopeQuery = supabase
    .from("copyfast_items")
    .select("sort_order")
    .eq("project_id", projectId);

  if (parent_id) scopeQuery.eq("parent_id", parent_id);
  else scopeQuery.is("parent_id", null);

  const { data: last } = await scopeQuery
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("copyfast_items")
    .insert({
      project_id: projectId,
      parent_id,
      item_type,
      name,
      description: body.description || "",
      is_responsive: Boolean(body.is_responsive),
      use_ai: Boolean(body.use_ai),
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
