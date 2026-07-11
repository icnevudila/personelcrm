import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("project_id");
  if (!project_id) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }

  const access = await checkProjectAccess(supabase, user, admin, project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let query = supabase
    .from("keyword_candidates")
    .select("*")
    .eq("project_id", project_id)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  const source = searchParams.get("source");
  if (source) query = query.eq("source", source);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function PATCH(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project_id, ids, selected, all } = await request.json();
  if (!project_id) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }

  const access = await checkProjectAccess(supabase, user, admin, project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (selected === undefined) {
    return NextResponse.json({ error: "selected gerekli" }, { status: 400 });
  }

  let query = supabase
    .from("keyword_candidates")
    .update({ selected })
    .eq("project_id", project_id);

  if (!all && ids?.length) {
    query = query.in("id", ids);
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
