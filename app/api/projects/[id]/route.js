import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

async function getProjectAndCheckAccess(supabase, user, admin, id) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) return { project: null, allowed: false };
  if (admin) return { project, allowed: true };
  if (project.user_id !== user.id) return { project, allowed: false };
  return { project, allowed: true };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project, allowed } = await getProjectAndCheckAccess(supabase, user, admin, id);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  return NextResponse.json(project);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project, allowed } = await getProjectAndCheckAccess(supabase, user, admin, id);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const body = await request.json();
  const allowed_fields = ["name", "description", "setup_prompt", "payment_status", "is_archived", "is_favorited", "type"];
  const updates = {};
  for (const f of allowed_fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { allowed } = await getProjectAndCheckAccess(supabase, user, admin, id);
  if (!allowed) return NextResponse.json({ error: "Erişim yok" }, { status: 403 });

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
