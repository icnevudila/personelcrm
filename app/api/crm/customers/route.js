import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user || !admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("group_id");
  const status = searchParams.get("status") || "pending";
  const page = parseInt(searchParams.get("page") || "0");
  const limit = 10;
  const from = page * limit;
  const to = from + limit - 1;

  if (!groupId) {
    return NextResponse.json({ error: "group_id zorunlu" }, { status: 400 });
  }

  const { data, error, count } = await supabase
    .from("crm_customers")
    .select("*", { count: "exact" })
    .eq("group_id", groupId)
    .eq("status", status)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [], total: count ?? 0, page, limit });
}
