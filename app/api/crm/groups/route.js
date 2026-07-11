import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user || !admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("crm_groups")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user || !admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Grup adı zorunlu" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_groups")
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
