import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { createExecution, queueExecution, audit } from "@/lib/automation/persistence";

export const runtime = "nodejs"; export const maxDuration = 60;
export async function POST(request, { params }) {
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase); if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const { workflowId } = await params; const workspace = await getOrCreatePersonalWorkspace(user); const { data: workflow, error } = await supabase.from("workflows").select("id,draft_definition,active_version_id").eq("id", workflowId).eq("workspace_id", workspace.id).single(); if (error) return NextResponse.json({ error: "Workflow bulunamadı." }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const execution = await createExecution({ workspaceId: workspace.id, workflowId: workflow.id, versionId: null, userId: user.id, input: body.input || {} });
    await queueExecution({ execution, definition: workflow.draft_definition, input: body.input || {} });
    await audit({ workspaceId: workspace.id, actorId: user.id, action: "workflow.test_queued", entityType: "workflow_execution", entityId: execution.id });
    return NextResponse.json({ execution: { ...execution, status: "queued" } }, { status: 202 });
  } catch (error) { return NextResponse.json({ error: error.message || "Test başlatılamadı." }, { status: 500 }); }
}
