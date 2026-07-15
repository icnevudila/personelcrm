import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const { executionId } = await params;
    const workspace = await getOrCreatePersonalWorkspace(user);
    const { data: execution, error } = await supabase
      .from("workflow_executions")
      .select("id,workflow_id,workflow_version_id,trigger_type,status,input_preview,output_preview,error,started_at,finished_at,duration_ms,retry_count,created_at")
      .eq("id", executionId)
      .eq("workspace_id", workspace.id)
      .single();
    if (error || !execution) return NextResponse.json({ error: "Execution bulunamadı." }, { status: 404 });

    const [{ data: nodes }, { data: logs }] = await Promise.all([
      supabase.from("node_executions").select("id,node_key,node_type,node_name,status,input_preview,output_preview,error,started_at,finished_at,duration_ms,retry_count,created_at").eq("execution_id", execution.id).order("created_at", { ascending: true }),
      supabase.from("execution_logs").select("id,level,message,details,created_at").eq("execution_id", execution.id).order("created_at", { ascending: true }),
    ]);
    return NextResponse.json({ execution, nodes: nodes || [], logs: logs || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Execution yüklenemedi." }, { status: 500 });
  }
}
