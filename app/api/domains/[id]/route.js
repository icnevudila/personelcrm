import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();

  const { data: domain } = await supabase
    .from("domains")
    .select("project_id")
    .eq("id", id)
    .single();

  if (!domain) return NextResponse.json({ error: "Domain bulunamadı" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", domain.project_id)
    .single();

  if (!admin && project.user_id !== user.id) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  if (body.is_primary === true) {
    await supabase
      .from("domains")
      .update({ is_primary: false })
      .eq("project_id", domain.project_id);
  }

  const { data, error } = await supabase
    .from("domains")
    .update({ is_primary: body.is_primary, vercel_status: body.vercel_status })
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

  const { data: domain } = await supabase
    .from("domains")
    .select("project_id, is_primary")
    .eq("id", id)
    .single();

  if (!domain) return NextResponse.json({ error: "Domain bulunamadı" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", domain.project_id)
    .single();

  if (!admin && project.user_id !== user.id) {
    return NextResponse.json({ error: "Erişim yok" }, { status: 403 });
  }

  await supabase.from("domains").delete().eq("id", id);

  if (domain.is_primary) {
    const { data: remaining } = await supabase
      .from("domains")
      .select("id")
      .eq("project_id", domain.project_id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (remaining?.length) {
      await supabase.from("domains").update({ is_primary: true }).eq("id", remaining[0].id);
    }
  }

  return NextResponse.json({ success: true });
}
