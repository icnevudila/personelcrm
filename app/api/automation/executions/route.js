import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";

export const runtime = "nodejs";
export async function GET() { const supabase = await createClient(); const { user } = await getCurrentUser(supabase); if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 }); try { const workspace = await getOrCreatePersonalWorkspace(user); const { data, error } = await supabase.from("workflow_executions").select("id,workflow_id,status,trigger_type,started_at,finished_at,duration_ms,error,created_at").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(50); if (error) throw error; return NextResponse.json({ executions: data || [] }); } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); } }
