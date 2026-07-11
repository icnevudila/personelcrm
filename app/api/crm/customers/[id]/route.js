import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user || !admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowed = ["status", "note", "callback_date"];
  const updates = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
