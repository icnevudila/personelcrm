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
  const date = searchParams.get("date"); // YYYY-MM-DD

  const dayStart = date ? new Date(`${date}T00:00:00.000Z`) : null;
  const dayEnd = date ? new Date(`${date}T00:00:00.000Z`) : null;
  if (dayEnd) dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  // Tarih seçildiyse: seçilen gün içinde status değişen kayıtları baz al.
  if (dayStart && dayEnd) {
    const startIso = dayStart.toISOString();
    const endIso = dayEnd.toISOString();

    const [
      { count: calledToday },
      { count: positiveToday },
      { count: negativeToday },
      { count: callbackToday },
    ] = await Promise.all([
      supabase
        .from("crm_customers")
        .select("*", { count: "exact", head: true })
        .gte("status_changed_at", startIso)
        .lt("status_changed_at", endIso),
      supabase
        .from("crm_customers")
        .select("*", { count: "exact", head: true })
        .eq("status", "positive")
        .gte("status_changed_at", startIso)
        .lt("status_changed_at", endIso),
      supabase
        .from("crm_customers")
        .select("*", { count: "exact", head: true })
        .eq("status", "negative")
        .gte("status_changed_at", startIso)
        .lt("status_changed_at", endIso),
      supabase
        .from("crm_customers")
        .select("*", { count: "exact", head: true })
        .eq("status", "callback")
        .gte("status_changed_at", startIso)
        .lt("status_changed_at", endIso),
    ]);

    return NextResponse.json({
      calledToday: calledToday ?? 0,
      positive: positiveToday ?? 0,
      negative: negativeToday ?? 0,
      callback: callbackToday ?? 0,
      date,
    });
  }

  // Tarih yoksa: mevcut davranış (genel istatistikler)
  const [{ count: positive }, { count: negative }, { count: callback }] = await Promise.all([
    supabase.from("crm_customers").select("*", { count: "exact", head: true }).eq("status", "positive"),
    supabase.from("crm_customers").select("*", { count: "exact", head: true }).eq("status", "negative"),
    supabase.from("crm_customers").select("*", { count: "exact", head: true }).eq("status", "callback"),
  ]);

  return NextResponse.json({
    calledToday: 0,
    positive: positive ?? 0,
    negative: negative ?? 0,
    callback: callback ?? 0,
    date,
  });
}
