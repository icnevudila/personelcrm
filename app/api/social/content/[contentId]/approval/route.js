import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { audit } from "@/lib/automation/persistence";
import { getTelegramConfig } from "@/lib/telegram/config";
import { sendMessage } from "@/lib/telegram/client";
import crypto from "node:crypto";

export const runtime = "nodejs";
export async function POST(_request, { params }) {
  const db = await createClient(); const { user } = await getCurrentUser(db); if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const workspace = await getOrCreatePersonalWorkspace(user); const { contentId } = await params;
  const { data: content, error } = await db.from("content_items").select("id,title,platform,body,status").eq("id", contentId).eq("workspace_id", workspace.id).single();
  if (error) return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });
  if (content.status === "published") return NextResponse.json({ error: "Yayınlanmış içerik tekrar onaya gönderilemez." }, { status: 409 });
  const token = crypto.randomBytes(32).toString("base64url"); const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const config = getTelegramConfig();
  const { data, error: approvalError } = await db.from("approval_requests").insert({ workspace_id: workspace.id, content_item_id: content.id, token_hash: tokenHash, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), telegram_chat_id: config.allowedUserId || null }).select("id,expires_at,status").single();
  if (approvalError) return NextResponse.json({ error: approvalError.message }, { status: 400 });
  try {
    let telegramMessageId = null;
    if (config.isConfigured && config.allowedUserId) {
      const text = [`📣 Onay bekleyen ${content.platform === "x" ? "X" : "Instagram"} içeriği`, content.title || content.body?.text || "İsimsiz içerik", "", "24 saat içinde karar ver."].join("\n");
      const message = await sendMessage(config.allowedUserId, text, { replyMarkup: { inline_keyboard: [[{ text: "Onayla", callback_data: `approval:approved:${token}` }, { text: "Reddet", callback_data: `approval:rejected:${token}` }], [{ text: "Bugün atla", callback_data: `approval:skipped:${token}` }]] } });
      telegramMessageId = message.message_id;
      await db.from("approval_requests").update({ telegram_message_id: telegramMessageId }).eq("id", data.id);
    }
    await db.from("content_items").update({ status: "approval_pending" }).eq("id", content.id);
    await audit({ workspaceId: workspace.id, actorId: user.id, action: "social.approval_requested", entityType: "approval_request", entityId: data.id, metadata: { telegramDelivered: Boolean(telegramMessageId) } });
    return NextResponse.json({ approval: data, delivery: telegramMessageId ? "telegram" : "not_configured" });
  } catch (sendError) {
    await db.from("approval_requests").delete().eq("id", data.id);
    return NextResponse.json({ error: `Telegram onayı gönderilemedi: ${sendError.message}` }, { status: 502 });
  }
}
