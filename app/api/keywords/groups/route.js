import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const project_id = new URL(request.url).searchParams.get("project_id");
  if (!project_id) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }

  const access = await checkProjectAccess(supabase, user, admin, project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from("keyword_groups")
    .select("*, keyword_group_items(*)")
    .eq("project_id", project_id)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project_id, name, sort_order } = await request.json();
  if (!project_id || !name?.trim()) {
    return NextResponse.json({ error: "project_id ve name gerekli" }, { status: 400 });
  }

  const access = await checkProjectAccess(supabase, user, admin, project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data, error } = await supabase
    .from("keyword_groups")
    .insert({
      project_id,
      name: name.trim(),
      sort_order: sort_order ?? 0,
    })
    .select("*, keyword_group_items(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
