import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeWorkflow } from "@/lib/automation/engine";
import { finishExecution, writeNodeEvent } from "@/lib/automation/persistence";
import { publicError } from "@/lib/automation/errors";

export const runtime = "nodejs"; export const maxDuration = 60;
export async function POST(request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Yetkisiz worker isteği" }, { status: 401 });
  const db = createAdminClient(); const workerId = `next-worker-${process.env.VERCEL_REGION || "local"}`;
  const { data: jobs, error: claimError } = await db.rpc("claim_automation_job", { worker_id: workerId });
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
  const job = jobs?.[0]; if (!job) return NextResponse.json({ status: "idle" });
  try {
    const { data: workflow, error } = await db.from("workflows").select("draft_definition").eq("id", job.payload.workflow_id).single(); if (error) throw error;
    const result = await executeWorkflow(workflow.draft_definition, { input: job.payload.input || {}, onNodeEvent: (event) => writeNodeEvent({ workspaceId: job.workspace_id, executionId: job.execution_id, event }) });
    await finishExecution({ executionId: job.execution_id, result }); await db.from("jobs").update({ status: "succeeded", heartbeat_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", job.id); return NextResponse.json({ status: "succeeded", jobId: job.id });
  } catch (error) { const normalized = publicError(error); await finishExecution({ executionId: job.execution_id, error: normalized }); await db.from("jobs").update({ status: job.attempts >= job.max_attempts ? "dead_letter" : "queued", run_at: new Date(Date.now() + 1000 * Math.pow(2, job.attempts)).toISOString(), last_error: normalized, updated_at: new Date().toISOString() }).eq("id", job.id); return NextResponse.json({ status: "failed", jobId: job.id, error: normalized }, { status: 502 }); }
}
