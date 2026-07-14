import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";

export const runtime = "nodejs";
export async function GET() {
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try { return NextResponse.json({ workspace: await getOrCreatePersonalWorkspace(user) }); } catch (error) { return NextResponse.json({ error: "Automation migration'ı uygulanmamış veya workspace oluşturulamadı.", detail: error.message }, { status: 503 }); }
}
