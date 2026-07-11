import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { requireProjectAccess } from "@/lib/projectCopy/context";

const COPY_TYPES = ["slogan", "sales_copy", "tagline", "headline"];

export async function GET(request, { params }) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const allowed = await requireProjectAccess(supabase, user, admin, projectId);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { data, error } = await supabase
    .from("project_slogans")
    .select("*")
    .eq("project_id", projectId)
    .order("is_favorited", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

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
  const content = String(body.content || "").trim();
  if (!content) return NextResponse.json({ error: "Metin gerekli" }, { status: 400 });

  const copy_type = body.copy_type || "slogan";
  if (!COPY_TYPES.includes(copy_type)) {
    return NextResponse.json({ error: "Geçersiz metin tipi" }, { status: 400 });
  }

  const { data: last } = await supabase
    .from("project_slogans")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("project_slogans")
    .insert({
      project_id: projectId,
      content,
      copy_type,
      notes: body.notes || "",
      source: "manual",
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
