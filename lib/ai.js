import OpenAI from "openai";

/**
 * Returns an OpenAI-compatible client.
 * Prioritizes Groq API if GROQ_API_KEY is defined.
 * Falls back to Gemini, then standard OpenAI.
 */
export function getAIClient() {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (groqKey) {
    return new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

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
 * Maps standard model requests to the best available model on the chosen provider.
 * Groq uses llama-3.3-70b-versatile.
 */
export function getAIModel(openAiModel = "gpt-4o-mini") {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey) {
    // Return flagship Llama model for Groq
    return "llama-3.3-70b-versatile";
  }

  if (geminiKey) {
    if (openAiModel.includes("image") || openAiModel.includes("dall-e")) {
      return openAiModel;
    }
    return "gemini-2.0-flash";
  }

  return openAiModel;
}
