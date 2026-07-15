import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeWorkflow } from "@/lib/automation/engine";
import { finishExecution, markExecutionRunning, requeueExecution, writeNodeEvent } from "@/lib/automation/persistence";
import { publicError } from "@/lib/automation/errors";

export const runtime = "nodejs"; export const maxDuration = 60;
export async function POST(request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Yetkisiz worker isteği" }, { status: 401 });
  const db = createAdminClient(); const workerId = `next-worker-${process.env.VERCEL_REGION || "local"}`;
  await db.rpc("recover_stalled_automation_jobs");
  const { data: jobs, error: claimError } = await db.rpc("claim_automation_job", { worker_id: workerId });
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
  const job = jobs?.[0]; if (!job) return NextResponse.json({ status: "idle" });
  try {
    if (!job.payload?.definition) throw new Error("Kuyruktaki workflow snapshot eksik.");
    await markExecutionRunning(job.execution_id);
    const result = await executeWorkflow(job.payload.definition, { workspaceId: job.workspace_id, input: job.payload.input || {}, onNodeEvent: (event) => writeNodeEvent({ workspaceId: job.workspace_id, executionId: job.execution_id, event }) });
    await finishExecution({ executionId: job.execution_id, result }); await db.from("jobs").update({ status: "succeeded", heartbeat_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", job.id); return NextResponse.json({ status: "succeeded", jobId: job.id });
  } catch (error) { const normalized = publicError(error); const willRetry = normalized.retryable && job.attempts < job.max_attempts; if (willRetry) await requeueExecution(job.execution_id); else await finishExecution({ executionId: job.execution_id, error: normalized }); await db.from("jobs").update({ status: willRetry ? "queued" : "dead_letter", run_at: new Date(Date.now() + 1000 * Math.pow(2, job.attempts)).toISOString(), last_error: normalized, updated_at: new Date().toISOString(), locked_at: null, locked_by: null }).eq("id", job.id); return NextResponse.json({ status: willRetry ? "retrying" : "failed", jobId: job.id, error: normalized }, { status: 502 }); }
}
