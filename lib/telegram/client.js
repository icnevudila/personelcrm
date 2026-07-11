import { getTelegramConfig } from "./config";

const TELEGRAM_API = "https://api.telegram.org";

function apiUrl(method) {
  const { botToken } = getTelegramConfig();
  return `${TELEGRAM_API}/bot${botToken}/${method}`;
}

async function telegramRequest(method, body) {
  const res = await fetch(apiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    const desc = data.description || `Telegram API hatası: ${method}`;
    if (desc === "Not Found") {
      throw new Error(
        "Telegram 'Not Found' — TELEGRAM_BOT_TOKEN geçersiz veya eksik. Tam format: BOT_ID:SECRET (ör. 8844284016:AAH...)"
      );
    }
    throw new Error(desc);
  }
  return data.result;
}

export async function sendMessage(chatId, text, options = {}) {
  const payload = {
    chat_id: chatId,
    text: text.slice(0, 4096),
    disable_web_page_preview: true,
    ...options.extra,
  };
  if (options.parseMode) payload.parse_mode = options.parseMode;
  if (options.replyMarkup) payload.reply_markup = options.replyMarkup;
  return telegramRequest("sendMessage", payload);
}

export async function sendChatAction(chatId, action = "typing") {
  return telegramRequest("sendChatAction", { chat_id: chatId, action });
}

export async function getFile(fileId) {
  return telegramRequest("getFile", { file_id: fileId });
}

export async function downloadFile(filePath) {
  const { botToken } = getTelegramConfig();
  const url = `${TELEGRAM_API}/file/bot${botToken}/${filePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Telegram dosyası indirilemedi");
  return Buffer.from(await res.arrayBuffer());
}

export async function setWebhook(url, secretToken) {
  const body = { url, allowed_updates: ["message"] };
  if (secretToken) body.secret_token = secretToken;
  return telegramRequest("setWebhook", body);
}

export async function deleteWebhook() {
  return telegramRequest("deleteWebhook", { drop_pending_updates: false });
}

export async function getWebhookInfo() {
  return telegramRequest("getWebhookInfo", {});
}
