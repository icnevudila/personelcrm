import { createAdminClient } from "@/lib/supabase/admin";

export function getSupabase() {
  return createAdminClient();
}

export async function getSession(telegramUserId) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("telegram_sessions")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();
  return data;
}

export async function upsertSession(telegramUserId, updates = {}) {
  const supabase = getSupabase();
  const row = {
    telegram_user_id: telegramUserId,
    updated_at: new Date().toISOString(),
    ...updates,
  };
  const { data, error } = await supabase
    .from("telegram_sessions")
    .upsert(row, { onConflict: "telegram_user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveChatMessage(telegramUserId, role, message, projectId = null) {
  const supabase = getSupabase();
  await supabase.from("telegram_chat_history").insert({
    telegram_user_id: telegramUserId,
    role,
    message,
    project_id: projectId,
  });
  await upsertSession(telegramUserId, { last_message_at: new Date().toISOString() });
}

export async function getRecentChatHistory(telegramUserId, limit = 6) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("telegram_chat_history")
    .select("role, message")
    .eq("telegram_user_id", telegramUserId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).reverse();
}

export async function logAiUsage({ telegramUserId, action, intent, tokenUsage, responseTimeMs }) {
  const supabase = getSupabase();
  await supabase.from("telegram_ai_logs").insert({
    telegram_user_id: telegramUserId,
    action,
    intent,
    token_usage: tokenUsage || 0,
    response_time_ms: responseTimeMs || 0,
  });
}

export async function getLastSuggestionSent(telegramUserId) {
  const session = await getSession(telegramUserId);
  return session?.last_context?.last_suggestion_at || null;
}

export async function markSuggestionSent(telegramUserId) {
  const session = await getSession(telegramUserId);
  const lastContext = session?.last_context || {};
  await upsertSession(telegramUserId, {
    last_context: { ...lastContext, last_suggestion_at: new Date().toISOString() },
  });
}
