import OpenAI from "openai";
import { INTENTS, detectIntent, extractProjectHint } from "./intent";
import { buildContext, listProjects, resolveProject } from "./context";
import { COO_SYSTEM_PROMPT, buildUserPayload } from "./prompts";
import { HELP_MESSAGE, formatProjectsList } from "./help";
import { executeActions, formatActionResults } from "./actions";
import {
  getSession,
  upsertSession,
  saveChatMessage,
  getRecentChatHistory,
  logAiUsage,
} from "./db";

export async function processMessage({ telegramUserId, text }) {
  const start = Date.now();
  const session = await getSession(telegramUserId);
  const projects = await listProjects();

  const { intent, text: messageText } = detectIntent(text);
  const projectHint = extractProjectHint(text, projects);
  const project = await resolveProject(
    session?.current_project_id,
    projectHint,
    projects
  );

  if (intent === INTENTS.HELP) {
    await saveChatMessage(telegramUserId, "user", text, project?.id || null);
    await saveChatMessage(telegramUserId, "assistant", "Yardım menüsü gönderildi", project?.id || null);
    return { reply: HELP_MESSAGE, parseMode: "HTML", intent };
  }

  if (intent === INTENTS.PROJECTS) {
    const list = formatProjectsList(projects);
    const reply = `📁 <b>Projelerin</b>\n\n${list}`;
    await saveChatMessage(telegramUserId, "user", text, null);
    await saveChatMessage(telegramUserId, "assistant", reply, null);
    return { reply, parseMode: "HTML", intent };
  }

  const context = await buildContext(intent, project, projects);
  const history = await getRecentChatHistory(telegramUserId, 6);

  let tokenUsage = 0;
  let aiResult;

  try {
    const { getAIClient, getAIModel } = await import("@/lib/ai");
    const openai = getAIClient();
    const userPayload = buildUserPayload(messageText || text, context, history);

    const completion = await openai.chat.completions.create({
      model: getAIModel("gpt-4o-mini"),
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        { role: "system", content: COO_SYSTEM_PROMPT },
        { role: "user", content: userPayload },
      ],
    });

    tokenUsage = completion.usage?.total_tokens || 0;
    const raw = completion.choices[0]?.message?.content || "{}";
    aiResult = JSON.parse(raw);
  } catch (err) {
    console.error("[telegram] AI hatası:", err);
    return { reply: "Bir hata oluştu, lütfen tekrar dene.", intent };
  }

  const actionResults = await executeActions(aiResult.actions || [], telegramUserId);

  if (project?.id && projectHint) {
    await upsertSession(telegramUserId, { current_project_id: project.id });
  }

  let reply = String(aiResult.reply || "").trim();
  const actionNote = formatActionResults(actionResults);
  if (actionNote) reply += actionNote;

  if (aiResult.suggested_next_step && !reply.includes("Sonraki önerim")) {
    reply += `\n\nSonraki önerim: ${aiResult.suggested_next_step}`;
  }

  const responseTimeMs = Date.now() - start;
  await logAiUsage({
    telegramUserId,
    action: "chat",
    intent,
    tokenUsage,
    responseTimeMs,
  });

  await saveChatMessage(telegramUserId, "user", text, project?.id || null);
  await saveChatMessage(telegramUserId, "assistant", reply, project?.id || null);

  return { reply, intent, tokenUsage, responseTimeMs };
}

export async function generateProactiveSuggestion(telegramUserId) {
  const projects = await listProjects();
  if (!projects.length) return null;

  const context = await buildContext(INTENTS.CHAT, projects[0], projects);
  const start = Date.now();

  if (!process.env.OPENAI_API_KEY) return null;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content:
          "Kısa proaktif COO önerisi üret. Spam olmasın, tek cümle. JSON: { \"message\": \"...\", \"should_send\": true|false }",
      },
      {
        role: "user",
        content: `Bugün: ${new Date().toISOString().slice(0, 10)}\nBağlam: ${JSON.stringify(context)}`,
      },
    ],
  });

  const tokenUsage = completion.usage?.total_tokens || 0;
  const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

  await logAiUsage({
    telegramUserId,
    action: "proactive_suggestion",
    intent: "suggestion",
    tokenUsage,
    responseTimeMs: Date.now() - start,
  });

  if (!parsed.should_send || !parsed.message) return null;
  return parsed.message;
}
