import { createAdminClient } from "@/lib/supabase/admin";

export async function createExecution({ workspaceId, workflowId, versionId, userId, input }) {
  const db = createAdminClient();
  const { data, error } = await db.from("workflow_executions").insert({ workspace_id: workspaceId, workflow_id: workflowId, workflow_version_id: versionId, trigger_type: "manual", status: "running", input_preview: input, started_by: userId, started_at: new Date().toISOString() }).select().single();
  if (error) throw error; return data;
}

export async function writeNodeEvent({ workspaceId, executionId, event }) {
  const db = createAdminClient();
  const row = { workspace_id: workspaceId, execution_id: executionId, node_key: event.nodeId || event.node?.id, node_type: event.node?.type || "unknown", node_name: event.nodeName || event.node?.name || "Node", status: event.status, input_preview: event.input || null, output_preview: event.output || null, error: event.error || null, started_at: event.status === "running" ? new Date().toISOString() : null, finished_at: event.status !== "running" ? new Date().toISOString() : null, duration_ms: event.durationMs || null };
  if (event.status === "running") { const { data, error } = await db.from("node_executions").insert(row).select("id").single(); if (error) throw error; return data?.id; }
  const { error } = await db.from("node_executions").insert(row); if (error) throw error;
}

export async function finishExecution({ executionId, result, error }) {
  const db = createAdminClient(); const finishedAt = new Date().toISOString();
  const { error: updateError } = await db.from("workflow_executions").update({ status: error ? "failed" : "succeeded", output_preview: result?.output || null, error: error || null, finished_at: finishedAt }).eq("id", executionId);
  if (updateError) throw updateError;
}

export async function audit({ workspaceId, actorId, action, entityType, entityId, metadata = {} }) {
  const db = createAdminClient(); await db.from("audit_logs").insert({ workspace_id: workspaceId, actor_id: actorId, action, entity_type: entityType, entity_id: entityId, metadata });
}
