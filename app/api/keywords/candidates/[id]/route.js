import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: row } = await supabase
    .from("keyword_candidates")
    .select("project_id")
    .eq("id", id)
    .single();

  if (!row) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  const access = await checkProjectAccess(supabase, user, admin, row.project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { error } = await supabase.from("keyword_candidates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
