import OpenAI from "openai";

/**
 * Returns an OpenAI-compatible client instance.
 * If GEMINI_API_KEY is defined, it targets Google's OpenAI-compatible endpoint.
 * Otherwise, it uses the standard OpenAI client.
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
 * Returns the appropriate model name.
 * If GEMINI_API_KEY is defined, returns a Gemini model name.
 * Otherwise, returns the requested OpenAI model name.
 */
export function getAIModel(openAiModel = "gpt-4o-mini") {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    // Map standard models to Gemini models
    if (openAiModel.startsWith("gpt-4") || openAiModel.startsWith("gpt-3")) {
      return "gemini-1.5-flash"; // Free, fast, and extremely capable for these tasks
    }
  }

  return openAiModel;
}
