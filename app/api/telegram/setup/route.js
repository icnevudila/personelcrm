import { NextResponse } from "next/server";
import { getTelegramConfig, getWebhookUrl, maskBotToken } from "@/lib/telegram/config";
import { setWebhook, deleteWebhook, getWebhookInfo } from "@/lib/telegram/client";

export const runtime = "nodejs";

function checkSetupAuth(request) {
  const secret = process.env.TELEGRAM_SETUP_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  const header = request.headers.get("x-telegram-setup-secret");
  const urlSecret = new URL(request.url).searchParams.get("secret");
  return header === secret || urlSecret === secret;
}


function configDiagnostics(config) {
  return {
    token_preview: maskBotToken(config.botToken),
    token_error: config.tokenError,
    allowed_user_id: config.allowedUserId,
    app_url: config.appUrl || null,
    webhook_url: getWebhookUrl(),
  };
}

export async function GET(request) {
  if (!checkSetupAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const config = getTelegramConfig();

  if (config.tokenError) {
    return NextResponse.json({
      configured: false,
      error: config.tokenError,
      diagnostics: configDiagnostics(config),
    }, { status: 400 });
  }

  if (!config.isConfigured) {
    return NextResponse.json({
      configured: false,
      error: "TELEGRAM_BOT_TOKEN ve TELEGRAM_ALLOWED_USER_ID gerekli",
      diagnostics: configDiagnostics(config),
    }, { status: 400 });
  }

  try {
    const info = await getWebhookInfo();
    return NextResponse.json({
      configured: true,
      diagnostics: configDiagnostics(config),
      telegram: info,
    });
  } catch (err) {
    return NextResponse.json({
      error: err.message,
      diagnostics: configDiagnostics(config),
    }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkSetupAuth(request)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const config = getTelegramConfig();

  if (config.tokenError) {
    return NextResponse.json({
      error: config.tokenError,
      diagnostics: configDiagnostics(config),
    }, { status: 400 });
  }

  if (!config.isConfigured) {
    return NextResponse.json({ error: "Bot yapılandırılmamış" }, { status: 503 });
  }

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL tanımlı değil (ör. https://app.websitealsat.com)" },
      { status: 400 }
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body.action || "set";

  try {
    if (action === "delete") {
      const result = await deleteWebhook();
      return NextResponse.json({ ok: true, action: "delete", result });
    }

    const result = await setWebhook(webhookUrl, config.webhookSecret || undefined);
    return NextResponse.json({ ok: true, action: "set", webhookUrl, result });
  } catch (err) {
    return NextResponse.json({
      error: err.message,
      diagnostics: configDiagnostics(config),
    }, { status: 500 });
  }
}
