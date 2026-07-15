import { createAdminClient } from "@/lib/supabase/admin";

export async function createExecution({ workspaceId, workflowId, versionId, userId, input }) {
  const db = createAdminClient();
  const { data, error } = await db.from("workflow_executions").insert({ workspace_id: workspaceId, workflow_id: workflowId, workflow_version_id: versionId || null, trigger_type: "manual", status: "queued", input_preview: redact(input), started_by: userId }).select().single();
  if (error) throw error; return data;
}

export async function writeNodeEvent({ workspaceId, executionId, event }) {
  const db = createAdminClient();
  const row = { workspace_id: workspaceId, execution_id: executionId, node_key: event.nodeId || event.node?.id, node_type: event.node?.type || "unknown", node_name: event.nodeName || event.node?.name || "Node", status: event.status, input_preview: redact(event.input) || null, output_preview: redact(event.output) || null, error: redact(event.error) || null, started_at: event.status === "running" ? new Date().toISOString() : null, finished_at: event.status !== "running" ? new Date().toISOString() : null, duration_ms: event.durationMs || null, retry_count: event.retryCount || 0 };
  if (event.status === "running") { const { data, error } = await db.from("node_executions").insert(row).select("id").single(); if (error) throw error; return data?.id; }
  const { started_at, ...completionRow } = row;
  const { error } = event.nodeExecutionId
    ? await db.from("node_executions").update(completionRow).eq("id", event.nodeExecutionId).eq("execution_id", executionId)
    : await db.from("node_executions").insert(row);
  if (error) throw error;
  await db.from("execution_logs").insert({ workspace_id: workspaceId, execution_id: executionId, node_execution_id: event.nodeExecutionId || null, level: event.status === "failed" ? "error" : "info", message: `${row.node_name}: ${event.status}`, details: redact({ input: event.input, output: event.output, error: event.error, retryCount: event.retryCount || 0 }) });
}

export async function finishExecution({ executionId, result, error }) {
  const db = createAdminClient(); const finishedAt = new Date().toISOString();
  const { data: current } = await db.from("workflow_executions").select("started_at,created_at").eq("id", executionId).single();
  const startedAt = current?.started_at || current?.created_at;
  const durationMs = startedAt ? Math.max(0, Date.now() - new Date(startedAt).getTime()) : null;
  const { error: updateError } = await db.from("workflow_executions").update({ status: error ? "failed" : "succeeded", output_preview: redact(result?.output) || null, error: redact(error) || null, finished_at: finishedAt, duration_ms: durationMs }).eq("id", executionId);
  if (updateError) throw updateError;
}

export async function queueExecution({ execution, definition, input = {} }) {
  const db = createAdminClient();
  const { error } = await db.from("jobs").insert({
    workspace_id: execution.workspace_id,
    execution_id: execution.id,
    type: "workflow.execute",
    // Jobs are worker-only. Preserve the runtime input here; execution and node previews are redacted separately.
    payload: { workflow_id: execution.workflow_id, workflow_version_id: execution.workflow_version_id, definition, input },
    idempotency_key: `execution:${execution.id}`,
  });
  if (error) throw error;
  return execution;
}

export async function markExecutionRunning(executionId) {
  const db = createAdminClient();
  const { error } = await db.from("workflow_executions").update({ status: "running", started_at: new Date().toISOString() }).eq("id", executionId).eq("status", "queued");
  if (error) throw error;
}

export async function requeueExecution(executionId) {
  const db = createAdminClient();
  const { error } = await db.from("workflow_executions").update({ status: "queued", retry_count: 1 }).eq("id", executionId);
  if (error) throw error;
}

export async function audit({ workspaceId, actorId, action, entityType, entityId, metadata = {} }) {
  const db = createAdminClient(); await db.from("audit_logs").insert({ workspace_id: workspaceId, actor_id: actorId, action, entity_type: entityType, entity_id: entityId, metadata });
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /authorization|api[_-]?key|token|secret|password/i.test(key) ? "[REDACTED]" : redact(item)]));
}
