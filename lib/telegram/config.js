export function getTelegramConfig() {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID || "";
  const ownerUserId = process.env.TELEGRAM_OWNER_USER_ID || "";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  return {
    botToken,
    allowedUserId: allowedUserId ? Number(allowedUserId) : null,
    ownerUserId: ownerUserId || null,
    webhookSecret,
    appUrl,
    isConfigured: Boolean(isValidBotToken(botToken) && allowedUserId),
    tokenError: getBotTokenError(botToken),
  };
}

/** Telegram token formatı: 123456789:ABCdef... */
export function isValidBotToken(token) {
  return /^\d+:[A-Za-z0-9_-]+$/.test(String(token || "").trim());
}

export function getBotTokenError(token) {
  const t = String(token || "").trim();
  if (!t) return "TELEGRAM_BOT_TOKEN tanımlı değil";
  if (!t.includes(":")) {
    return "Token eksik — BOT_ID:SECRET formatında olmalı (ör. 8844284016:AAH...). @BotFather'dan tam token'ı kopyala.";
  }
  if (!isValidBotToken(t)) return "Token formatı geçersiz";
  return null;
}

export function maskBotToken(token) {
  const t = String(token || "").trim();
  if (!t.includes(":")) return "(eksik format)";
  const [id, secret] = t.split(":");
  return `${id}:${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export function getWebhookUrl() {
  const { appUrl } = getTelegramConfig();
  if (!appUrl) return null;
  return `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
}
