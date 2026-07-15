import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export async function POST(request, { params }) {
  const { token } = await params; const hash = crypto.createHash("sha256").update(token).digest("hex"); const body = await request.json().catch(() => ({}));
  if (!['approved','rejected','skipped'].includes(body.action)) return NextResponse.json({ error: "Geçersiz approval aksiyonu." }, { status: 400 });
  const db = createAdminClient(); const { data: approval, error } = await db.from("approval_requests").select("*").eq("token_hash", hash).eq("status", "pending").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !approval) return NextResponse.json({ error: "Approval token geçersiz, süresi dolmuş veya kullanılmış." }, { status: 410 });
  const { error: updateError } = await db.from("approval_requests").update({ status: body.action, resolved_at: new Date().toISOString() }).eq("id", approval.id).eq("status", "pending");
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await db.from("content_items").update({ status: body.action === 'approved' ? 'approved' : body.action }).eq("id", approval.content_item_id);
  if (approval.execution_id) await db.from("workflow_executions").update({ status: body.action === 'approved' ? 'queued' : 'cancelled' }).eq("id", approval.execution_id);
  await db.from("audit_logs").insert({ workspace_id: approval.workspace_id, action: `social.approval_${body.action}`, entity_type: "approval_request", entity_id: approval.id, metadata: { via: body.via || 'api' } });
  return NextResponse.json({ ok: true, status: body.action });
}
