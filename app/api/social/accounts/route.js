import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { providerConfigured } from "@/lib/social/oauth";

export const runtime = "nodejs";

export async function GET() {
  const db = await createClient(); const { user } = await getCurrentUser(db);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const workspace = await getOrCreatePersonalWorkspace(user);
    const { data, error } = await db.from("social_accounts").select("id,provider,external_account_id,display_name,status,expires_at,created_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ accounts: data || [], providers: { x: { configured: providerConfigured("x") }, instagram: { configured: providerConfigured("instagram") } } });
  } catch (error) { return NextResponse.json({ error: error.message || "Hesaplar yüklenemedi." }, { status: 500 }); }
}
