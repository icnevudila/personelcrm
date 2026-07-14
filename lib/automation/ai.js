import OpenAI from "openai";
import { AutomationError } from "./errors.js";

const PROVIDERS = {
  xai: { env: "XAI_API_KEY", baseURL: "https://api.x.ai/v1", model: "grok-3-mini" },
  openai: { env: "OPENAI_API_KEY", model: "gpt-4o-mini" },
  gemini: { env: "GEMINI_API_KEY", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-2.0-flash" },
  groq: { env: "GROQ_API_KEY", baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
};

export function configuredProviders() { return Object.entries(PROVIDERS).filter(([, value]) => process.env[value.env]).map(([key]) => key); }

export async function generateText({ provider = "auto", model, systemPrompt, prompt, temperature = 0.7, maxTokens = 800 }) {
  const selected = provider === "auto" ? configuredProviders()[0] : provider;
  const config = PROVIDERS[selected];
  if (!config || !process.env[config.env]) throw new AutomationError("CREDENTIAL_ERROR", `${provider === "auto" ? "AI provider" : provider} yapılandırılmamış.`, { name: "CredentialError", httpStatus: 422 });
  try {
    const client = new OpenAI({ apiKey: process.env[config.env], baseURL: config.baseURL });
    const completion = await client.chat.completions.create({ model: model || config.model, temperature: Number(temperature), max_tokens: Number(maxTokens), messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: prompt }] });
    return { text: completion.choices?.[0]?.message?.content || "", provider: selected, model: model || config.model, requestId: completion._request_id || null };
  } catch (error) {
    const status = error?.status;
    throw new AutomationError(status === 429 ? "PROVIDER_RATE_LIMIT" : "PROVIDER_ERROR", "AI sağlayıcısı yanıt veremedi.", { name: status === 429 ? "RateLimitError" : "ProviderError", retryable: status === 429 || status >= 500, httpStatus: status || 502, provider: selected });
  }
}
