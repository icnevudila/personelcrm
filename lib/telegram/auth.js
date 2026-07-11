import { getTelegramConfig } from "./config";

const DENIED_MESSAGE = "Bu bot özel kullanım içindir.";

export function isAllowedUser(telegramUserId) {
  const { allowedUserId } = getTelegramConfig();
  if (!allowedUserId) return false;
  return Number(telegramUserId) === allowedUserId;
}

export function checkAccess(telegramUserId) {
  if (!getTelegramConfig().isConfigured) {
    return { allowed: false, message: "Bot yapılandırması eksik." };
  }
  if (!isAllowedUser(telegramUserId)) {
    return { allowed: false, message: DENIED_MESSAGE };
  }
  return { allowed: true };
}

export function validateWebhookSecret(request) {
  const { webhookSecret } = getTelegramConfig();
  if (!webhookSecret) return true;
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  return header === webhookSecret;
}
