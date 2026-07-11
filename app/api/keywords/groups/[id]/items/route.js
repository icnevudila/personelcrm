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

export async function POST(request, { params }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const access = await getGroupWithAccess(supabase, user, admin, groupId);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { value } = await request.json();
  if (!value?.trim()) {
    return NextResponse.json({ error: "value gerekli" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("keyword_group_items")
    .insert({ keyword_group_id: groupId, value: value.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request, { params }) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const access = await getGroupWithAccess(supabase, user, admin, groupId);
  if (access.error) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const itemId = new URL(request.url).searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ error: "item_id gerekli" }, { status: 400 });

  const { error } = await supabase
    .from("keyword_group_items")
    .delete()
    .eq("id", itemId)
    .eq("keyword_group_id", groupId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
