import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { executeWorkflow } from "@/lib/automation/engine";
import { createExecution, finishExecution, writeNodeEvent, audit } from "@/lib/automation/persistence";
import { publicError } from "@/lib/automation/errors";

export const runtime = "nodejs"; export const maxDuration = 60;
export async function POST(request, { params }) {
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase); if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const { workflowId } = await params; const workspace = await getOrCreatePersonalWorkspace(user); const { data: workflow, error } = await supabase.from("workflows").select("id,draft_definition,active_version_id").eq("id", workflowId).eq("workspace_id", workspace.id).single(); if (error) return NextResponse.json({ error: "Workflow bulunamadı." }, { status: 404 });
    const body = await request.json().catch(() => ({})); const execution = await createExecution({ workspaceId: workspace.id, workflowId: workflow.id, versionId: workflow.active_version_id, userId: user.id, input: body.input || {} });
    try { const result = await executeWorkflow(workflow.draft_definition, { input: body.input || {}, onNodeEvent: (event) => writeNodeEvent({ workspaceId: workspace.id, executionId: execution.id, event }) }); await finishExecution({ executionId: execution.id, result }); await audit({ workspaceId: workspace.id, actorId: user.id, action: "workflow.tested", entityType: "workflow_execution", entityId: execution.id }); return NextResponse.json({ execution: { ...execution, status: "succeeded" }, result }); }
    catch (error) { const normalized = publicError(error); await finishExecution({ executionId: execution.id, error: normalized }); return NextResponse.json({ execution: { ...execution, status: "failed" }, error: normalized, logs: error.executionLogs || [] }, { status: normalized.httpStatus >= 500 ? 502 : normalized.httpStatus }); }
  } catch (error) { return NextResponse.json({ error: error.message || "Test başlatılamadı." }, { status: 500 }); }
}
