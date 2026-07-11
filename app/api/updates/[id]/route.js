import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!admin) return NextResponse.json({ error: "Sadece adminler güncelleyebilir" }, { status: 403 });

  const { status } = await request.json();
  const allowed = ["pending", "in_progress", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("update_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
