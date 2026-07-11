import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function requireDeepWorkUser() {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) {
    return { error: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }) };
  }
  return { supabase, user, admin };
}

export function taskSelectQuery(supabase, userId) {
  return supabase
    .from("deep_work_tasks")
    .select("*, projects(id, name)")
    .eq("user_id", userId);
}
