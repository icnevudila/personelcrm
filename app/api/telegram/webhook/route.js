import { NextResponse } from "next/server";
import { checkAccess, validateWebhookSecret } from "@/lib/telegram/auth";
import { checkRateLimit } from "@/lib/telegram/rateLimit";
import { sendMessage, sendChatAction } from "@/lib/telegram/client";
import { transcribeVoice } from "@/lib/telegram/transcribe";
import { processMessage } from "@/lib/telegram/processor";
import { getTelegramConfig } from "@/lib/telegram/config";
import { logAiUsage } from "@/lib/telegram/db";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  if (!getTelegramConfig().isConfigured) {
    return NextResponse.json({ ok: false, error: "Bot yapılandırılmamış" }, { status: 503 });
  }

  if (!validateWebhookSecret(request)) {
    console.error("[telegram/webhook] Geçersiz secret header");
    return NextResponse.json({ ok: false, error: "Geçersiz webhook secret" }, { status: 403 });
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const callback = update.callback_query;
  if (callback?.data?.startsWith("approval:")) {
    const [, action, token] = callback.data.split(":");
    const access = checkAccess(callback.from?.id);
    if (!access.allowed || !["approved", "rejected", "skipped"].includes(action) || !token) return NextResponse.json({ ok: true });
    const db = createAdminClient(); const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data: approval } = await db.from("approval_requests").select("*").eq("token_hash", tokenHash).eq("status", "pending").gt("expires_at", new Date().toISOString()).maybeSingle();
    if (!approval) { await sendMessage(callback.message?.chat?.id, "Bu onay isteği artık geçerli değil."); return NextResponse.json({ ok: true }); }
    await db.from("approval_requests").update({ status: action, resolved_at: new Date().toISOString() }).eq("id", approval.id).eq("status", "pending");
    await db.from("content_items").update({ status: action === "approved" ? "approved" : action }).eq("id", approval.content_item_id);
    if (approval.execution_id) await db.from("workflow_executions").update({ status: action === "approved" ? "queued" : "cancelled" }).eq("id", approval.execution_id);
    await db.from("audit_logs").insert({ workspace_id: approval.workspace_id, action: `telegram.approval_${action}`, entity_type: "approval_request", entity_id: approval.id, metadata: { telegram_user_id: callback.from?.id } });
    await sendMessage(callback.message?.chat?.id, action === "approved" ? "İçerik onaylandı ve yayın kuyruğuna alındı." : "İçerik onayı güncellendi.");
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const telegramUserId = message.from?.id;

  const access = checkAccess(telegramUserId);
  if (!access.allowed) {
    await sendMessage(chatId, access.message);
    return NextResponse.json({ ok: true });
  }

  const rate = checkRateLimit(telegramUserId);
  if (!rate.allowed) {
    await sendMessage(chatId, `Çok fazla istek. ${rate.retryAfterSec} saniye sonra tekrar dene.`);
    return NextResponse.json({ ok: true });
  }

  let text = message.text || message.caption || "";

  if (!text && message.voice) {
    try {
      await sendChatAction(chatId, "typing");
      text = await transcribeVoice(message.voice.file_id);
      if (!text) {
        await sendMessage(chatId, "Ses mesajı anlaşılamadı.");
        return NextResponse.json({ ok: true });
      }
    } catch (err) {
      console.error("[telegram] STT hatası:", err);
      await sendMessage(chatId, "Ses mesajı işlenemedi.");
      return NextResponse.json({ ok: true });
    }
  }

  if (!text) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendChatAction(chatId, "typing");
    const result = await processMessage({ telegramUserId, text });
    await sendMessage(chatId, result.reply, {
      parseMode: result.parseMode || undefined,
    });
  } catch (err) {
    console.error("[telegram] İşleme hatası:", err);
    try {
      await logAiUsage({
        telegramUserId,
        action: "webhook_error",
        intent: "error",
        tokenUsage: 0,
        responseTimeMs: 0,
      });
    } catch {
      // log hatası sessiz geç
    }
    await sendMessage(chatId, "Bir hata oluştu. Lütfen tekrar dene.");
  }

  return NextResponse.json({ ok: true });
}
