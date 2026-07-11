import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user || !admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { id } = await params;

  const { data: group, error: groupError } = await supabase
    .from("crm_groups")
    .select("id, name, created_at")
    .eq("id", id)
    .single();

  if (groupError) return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });

  const statusKeys = ["pending", "callback", "positive", "negative"];

  const counts = await Promise.all(
    statusKeys.map((s) =>
      supabase
        .from("crm_customers")
        .select("*", { count: "exact", head: true })
        .eq("group_id", id)
        .eq("status", s)
        .then(({ count }) => ({ status: s, count: count ?? 0 }))
    )
  );

  const stats = { total: 0 };
  for (const { status: s, count } of counts) {
    stats[s] = count;
    stats.total += count;
  }

  return NextResponse.json({ ...group, stats });
}
