import { NextResponse } from "next/server";
import { getTelegramConfig } from "@/lib/telegram/config";
import { sendMessage } from "@/lib/telegram/client";
import {
  getLastSuggestionSent,
  markSuggestionSent,
} from "@/lib/telegram/db";
import { generateProactiveSuggestion } from "@/lib/telegram/processor";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_HOURS_BETWEEN = 8;

function checkCronAuth(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  const secret = request.headers.get("x-cron-secret");
  return secret && secret === process.env.CRON_SECRET;
}

export async function GET(request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const config = getTelegramConfig();
  if (!config.isConfigured || !config.allowedUserId) {
    return NextResponse.json({ skipped: true, reason: "Bot yapılandırılmamış" });
  }

  const lastSent = await getLastSuggestionSent(config.allowedUserId);
  if (lastSent) {
    const hoursSince = (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60);
    if (hoursSince < MIN_HOURS_BETWEEN) {
      return NextResponse.json({ skipped: true, reason: "Çok erken", hoursSince });
    }
  }

  const hour = new Date().getHours();
  if (hour < 7 || hour > 21) {
    return NextResponse.json({ skipped: true, reason: "Sessiz saatler" });
  }

  try {
    const message = await generateProactiveSuggestion(config.allowedUserId);
    if (!message) {
      return NextResponse.json({ skipped: true, reason: "Öneri üretilmedi" });
    }

    await sendMessage(config.allowedUserId, `💡 ${message}`);
    await markSuggestionSent(config.allowedUserId);

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error("[telegram/cron] hata:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
