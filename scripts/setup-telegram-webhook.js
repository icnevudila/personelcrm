/**
 * Telegram webhook kurulumu (manuel veya deploy hook ile çalıştır).
 * Build aşamasında ÇALIŞTIRILMAMALI — Vercel derlemesini kırmaması için
 * package.json postbuild'ten çıkarıldı.
 *
 * Kullanım: npm run telegram:setup
 * veya deploy sonrası: POST /api/telegram/setup
 */
async function main() {
  if (process.env.TELEGRAM_AUTO_SETUP === "false") {
    console.log("[telegram-setup] TELEGRAM_AUTO_SETUP=false, atlanıyor.");
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!token || !allowedUserId || !appUrl) {
    console.warn("[telegram-setup] Eksik env (TELEGRAM_BOT_TOKEN, TELEGRAM_ALLOWED_USER_ID, NEXT_PUBLIC_APP_URL).");
    return;
  }

  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  const body = { url: webhookUrl, allowed_updates: ["message"] };
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    body.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.ok) {
    console.log("[telegram-setup] Webhook kuruldu:", webhookUrl);
    return;
  }

  console.error("[telegram-setup] Telegram hatası:", data.description);
  if (data.description === "Not Found") {
    console.error("[telegram-setup] 'Not Found' genelde geçersiz TELEGRAM_BOT_TOKEN demektir. @BotFather token'ını kontrol et.");
  }
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("[telegram-setup]", err.message || err);
  process.exitCode = 1;
});
