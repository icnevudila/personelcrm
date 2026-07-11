import { NextResponse } from "next/server";
import { checkAccess, validateWebhookSecret } from "@/lib/telegram/auth";
import { checkRateLimit } from "@/lib/telegram/rateLimit";
import { sendMessage, sendChatAction } from "@/lib/telegram/client";
import { transcribeVoice } from "@/lib/telegram/transcribe";
import { processMessage } from "@/lib/telegram/processor";
import { getTelegramConfig } from "@/lib/telegram/config";
import { logAiUsage } from "@/lib/telegram/db";

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
