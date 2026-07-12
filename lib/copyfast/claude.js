/**
 * CopyFast AI Analysis
 * Uses Claude if CLAUDE_API_KEY is set, otherwise falls back to Gemini (GEMINI_API_KEY).
 */

import { prepareImageForClaude } from "@/lib/copyfast/imagePrep";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
const LOG_PREFIX = "[copyfast/claude]";

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

function formatClaudeError(data) {
  const err = data?.error;
  if (!err) return "Claude API hatası";
  if (typeof err === "string") return err;
  if (err.type === "not_found_error" && err.message?.includes("model:")) {
    return `Claude modeli bulunamadı (${CLAUDE_MODEL}).`;
  }
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return "Claude API hatası"; }
}

// ─── Gemini Fallback ────────────────────────────────────────────────────────

async function analyzeWithGemini({ systemPrompt, userPrompt, imageUrls = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Ne CLAUDE_API_KEY ne de GEMINI_API_KEY tanımlı");

  log("Gemini fallback başlıyor", { imageCount: imageUrls.length });

  const parts = [];

  // Add images as inline_data (base64) via fetch
  for (const url of imageUrls) {
    try {
      const imgRes = await fetch(url);
      if (!imgRes.ok) continue;
      const arrayBuf = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      parts.push({ inline_data: { mime_type: contentType, data: base64 } });
    } catch (err) {
      log("Görsel yüklenemedi:", url, err.message);
    }
  }

  parts.push({ text: `${systemPrompt}\n\n${userPrompt}` });

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini API hatası");

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) throw new Error("Gemini boş yanıt döndürdü");

  log("Gemini analiz tamamlandı", { responseLength: text.length });
  return text.trim();
}

async function synthesizeWithGemini({ projectName, pagePrompts }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Ne CLAUDE_API_KEY ne de GEMINI_API_KEY tanımlı");

  const combined = pagePrompts
    .map((p) => `### ${p.name} (${p.item_type})\n${p.generated_prompt}`)
    .join("\n\n");

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Sen bir tasarım sistemi uzmanısın. Birden fazla sayfa/bileşen analizini birleştirerek tek bir tutarlı Next.js geliştirme promptu oluştur.\n\nProje: ${projectName}\n\n${combined}`,
        }],
      }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini API hatası");
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) throw new Error("Gemini boş yanıt döndürdü");
  return text.trim();
}

// ─── Public API (Claude first, Gemini fallback) ──────────────────────────────

export async function analyzeWithClaude({ systemPrompt, userPrompt, imageUrls = [] }) {
  // Try Claude if key exists
  if (process.env.CLAUDE_API_KEY) {
    log("Claude ile analiz başlıyor", { model: CLAUDE_MODEL, imageCount: imageUrls.length });

    const content = [];
    for (const url of imageUrls) {
      try {
        const { base64, mediaType } = await prepareImageForClaude(url);
        content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } });
      } catch (err) {
        log("Görsel hazırlanamadı:", url, err.message);
      }
    }
    content.push({ type: "text", text: userPrompt });

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
    if (res.ok) {
      const text = data?.content?.find((b) => b.type === "text")?.text;
      if (text?.trim()) return text.trim();
    }

    log("Claude başarısız, Gemini'ye geçiliyor", formatClaudeError(data));
  } else {
    log("CLAUDE_API_KEY yok, Gemini kullanılıyor");
  }

  // Fallback to Gemini
  return analyzeWithGemini({ systemPrompt, userPrompt, imageUrls });
}

export async function synthesizeProjectPrompt({ projectName, pagePrompts }) {
  if (process.env.CLAUDE_API_KEY) {
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
        messages: [{
          role: "user",
          content: `Proje: ${projectName}\n\nAşağıdaki sayfa/bileşen analizlerini birleştirerek tek bir kapsamlı tasarım sistemi promptu üret. Ortak renk, font ve spacing değerlerini standardize et.\n\n${combined}`,
        }],
      }),
    });

    const data = await res.json();
    if (res.ok) {
      const text = data?.content?.find((b) => b.type === "text")?.text;
      if (text?.trim()) return text.trim();
    }
    log("Claude sentez başarısız, Gemini'ye geçiliyor");
  }

  return synthesizeWithGemini({ projectName, pagePrompts });
}
