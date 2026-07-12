import OpenAI from "openai";

/**
 * Returns an OpenAI-compatible client.
 * Gemini exposes an OpenAI-compatible endpoint, so all chat routes work as-is.
 */
export function getAIClient() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    return new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  return new OpenAI({
    apiKey: openAiKey || "dummy-key-to-prevent-openai-init-error",
  });
}

/**
 * Maps OpenAI model names → Gemini model names when using Gemini key.
 * gemini-2.0-flash is fast, free-tier friendly, and handles all text tasks.
 */
export function getAIModel(openAiModel = "gpt-4o-mini") {
  if (!process.env.GEMINI_API_KEY) return openAiModel;

  // Image generation models are handled separately (Imagen API)
  if (openAiModel.includes("image") || openAiModel.includes("dall-e")) {
    return openAiModel; // caller must use Imagen API directly
  }

  // All chat/completion models → gemini-2.0-flash
  return "gemini-2.0-flash";
}
