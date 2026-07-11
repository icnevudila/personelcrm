import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { NextResponse } from "next/server";

async function getGroupWithAccess(supabase, user, admin, groupId) {
  const { data: group } = await supabase
    .from("keyword_groups")
    .select("id, project_id")
    .eq("id", groupId)
    .single();

  if (!group) return { error: "Grup bulunamadı", status: 404 };
  const access = await checkProjectAccess(supabase, user, admin, group.project_id);
  if (!access.ok) return { error: access.error, status: access.status };
  return { group };
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const access = await getGroupWithAccess(supabase, user, admin, id);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { name, sort_order } = await request.json();
  const patch = {};
  if (name !== undefined) patch.name = name.trim();
  if (sort_order !== undefined) patch.sort_order = sort_order;

  const { data, error } = await supabase
    .from("keyword_groups")
    .update(patch)
    .eq("id", id)
    .select("*, keyword_group_items(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const access = await getGroupWithAccess(supabase, user, admin, id);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { error } = await supabase.from("keyword_groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
