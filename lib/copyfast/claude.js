import { prepareImageForClaude } from "@/lib/copyfast/imagePrep";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const LOG_PREFIX = "[copyfast/claude]";

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function formatClaudeError(data) {
  const err = data?.error;
  if (!err) return "Claude API hatası";
  if (typeof err === "string") return err;
  if (err.type === "not_found_error" && err.message?.includes("model:")) {
    return `Claude modeli bulunamadı (${CLAUDE_MODEL}). .env.local içine geçerli bir CLAUDE_MODEL ekleyin (ör. claude-sonnet-4-6).`;
  }
  if (err.message) return err.message;
  if (Array.isArray(err.details)) {
    return err.details.map((d) => d.msg || d.message || JSON.stringify(d)).join("; ");
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Claude API hatası";
  }
}

export async function analyzeWithClaude({ systemPrompt, userPrompt, imageUrls = [] }) {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY tanımlı değil");
  }

  log("analiz başlıyor", { model: CLAUDE_MODEL, imageCount: imageUrls.length, urls: imageUrls });

  const content = [];
  const imageDebug = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    log(`görsel ${i + 1}/${imageUrls.length} hazırlanıyor`, { url });
    const { base64, mediaType, debug } = await prepareImageForClaude(url);
    imageDebug.push({ index: i, url, ...debug });
    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    });
  }

  // Claude needs the analysis brief alongside the screenshots. Previously the
  // request contained images only, so it had no instruction for the output.
  content.push({ type: "text", text: userPrompt });

  log("Claude API çağrısı", { imageDebug, promptLength: userPrompt.length });

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = formatClaudeError(data);
    log("Claude API hata", { status: res.status, error: data?.error, message: msg, imageDebug });
    throw new Error(msg);
  }

  const text = data?.content?.find((b) => b.type === "text")?.text;
  if (!text?.trim()) throw new Error("Claude boş yanıt döndürdü");

  log("analiz tamamlandı", { responseLength: text.length, usage: data?.usage });
  return text.trim();
}

export async function synthesizeProjectPrompt({ projectName, pagePrompts }) {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY tanımlı değil");
  }

  const combined = pagePrompts
    .map((p) => `### ${p.name} (${p.item_type})\n${p.generated_prompt}`)
    .join("\n\n");

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: `Sen bir tasarım sistemi uzmanısın. Birden fazla sayfa/bileşen analizini birleştirerek tek bir tutarlı Next.js geliştirme promptu oluştur.`,
      messages: [
        {
          role: "user",
          content: `Proje: ${projectName}\n\nAşağıdaki sayfa/bileşen analizlerini birleştirerek tek bir kapsamlı tasarım sistemi promptu üret. Ortak renk, font ve spacing değerlerini standardize et.\n\n${combined}`,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = formatClaudeError(data);
    log("proje sentez hata", { status: res.status, error: data?.error, message: msg });
    throw new Error(msg);
  }

  const text = data?.content?.find((b) => b.type === "text")?.text;
  if (!text?.trim()) throw new Error("Claude boş yanıt döndürdü");
  return text.trim();
}
