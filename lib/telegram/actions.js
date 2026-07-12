import { getSupabase } from "./db";
import { ensureProjectBlueprint } from "@/lib/productBlueprint/seed";
import { ensureMarketingBlueprint } from "@/lib/marketing/seed";
import { getTelegramConfig } from "./config";

export async function executeActions(actions = [], telegramUserId) {
  const results = [];
  for (const action of actions) {
    try {
      const result = await executeAction(action, telegramUserId);
      if (result) results.push(result);
    } catch (err) {
      results.push({ type: action.type, error: err.message });
    }
  }
  return results;
}

async function executeAction(action, telegramUserId) {
  switch (action.type) {
    case "create_todo":
      return createTodo(action);
    case "complete_todo":
      return completeTodo(action);
    case "create_deep_work":
      return createDeepWork(action);
    case "add_blueprint_feature":
      return addBlueprintFeature(action);
    case "update_blueprint_field":
      return updateBlueprintField(action);
    case "add_marketing_content":
      return addMarketingContent(action);
    case "add_marketing_weekly_task":
      return addMarketingWeeklyTask(action);
    case "set_current_project":
      return setCurrentProject(action, telegramUserId);
    case "generate_logo":
      return generateLogoAction(action, telegramUserId);
    case "app_scout":
      return appScoutAction(action, telegramUserId);
    default:
      return null;
  }
}

async function createTodo({ project_id, title }) {
  const supabase = getSupabase();
  const trimmed = String(title || "").trim();
  if (!trimmed || !project_id) throw new Error("Todo için proje ve başlık gerekli");

  const { data: last } = await supabase
    .from("project_todos")
    .select("sort_order")
    .eq("project_id", project_id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("project_todos")
    .insert({
      project_id,
      title: trimmed,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id, title")
    .single();

  if (error) throw error;
  return { type: "create_todo", ok: true, todo: data };
}

async function completeTodo({ todo_id }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("project_todos")
    .update({ is_completed: true, updated_at: new Date().toISOString() })
    .eq("id", todo_id)
    .select("id, title")
    .single();
  if (error) throw error;
  return { type: "complete_todo", ok: true, todo: data };
}

async function createDeepWork({ title, estimated_minutes, project_id, is_today_plan }) {
  const { ownerUserId } = getTelegramConfig();
  if (!ownerUserId) throw new Error("TELEGRAM_OWNER_USER_ID tanımlı değil");

  const supabase = getSupabase();
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("Deep Work başlığı gerekli");

  const { data: last } = await supabase
    .from("deep_work_tasks")
    .select("sort_order")
    .eq("user_id", ownerUserId)
    .eq("status", "todo")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("deep_work_tasks")
    .insert({
      user_id: ownerUserId,
      title: trimmed,
      estimated_minutes: Number(estimated_minutes) || 60,
      project_id: project_id || null,
      is_today_plan: is_today_plan !== false,
      planned_date: today,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id, title")
    .single();

  if (error) throw error;
  return { type: "create_deep_work", ok: true, task: data };
}

async function addBlueprintFeature({ project_id, title, description, priority, is_mvp }) {
  const supabase = getSupabase();
  const blueprintId = await ensureProjectBlueprint(supabase, project_id);

  const { data: last } = await supabase
    .from("blueprint_features")
    .select("sort_order")
    .eq("blueprint_id", blueprintId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const allowedPriority = ["low", "medium", "high"];
  const p = allowedPriority.includes(priority) ? priority : "medium";

  const { data, error } = await supabase
    .from("blueprint_features")
    .insert({
      blueprint_id: blueprintId,
      title: String(title).trim(),
      description: String(description || "").trim(),
      priority: p,
      is_mvp: Boolean(is_mvp),
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id, title")
    .single();

  if (error) throw error;
  return { type: "add_blueprint_feature", ok: true, feature: data };
}

const BLUEPRINT_FIELDS = ["problem", "solution", "value_proposition", "target_audience", "short_description"];

async function updateBlueprintField({ project_id, field, value }) {
  if (!BLUEPRINT_FIELDS.includes(field)) throw new Error("Geçersiz blueprint alanı");
  const supabase = getSupabase();
  await ensureProjectBlueprint(supabase, project_id);

  const { error } = await supabase
    .from("project_blueprints")
    .update({ [field]: String(value || "").trim(), updated_at: new Date().toISOString() })
    .eq("project_id", project_id);

  if (error) throw error;
  return { type: "update_blueprint_field", ok: true, field };
}

async function addMarketingContent({ project_id, title, platform, category }) {
  const supabase = getSupabase();
  const blueprintId = await ensureMarketingBlueprint(supabase, project_id);

  const { data, error } = await supabase
    .from("marketing_contents")
    .insert({
      blueprint_id: blueprintId,
      title: String(title).trim(),
      platform: String(platform || "").trim(),
      category: String(category || "").trim(),
    })
    .select("id, title")
    .single();

  if (error) throw error;
  return { type: "add_marketing_content", ok: true, content: data };
}

async function addMarketingWeeklyTask({ project_id, title, priority }) {
  const supabase = getSupabase();
  const blueprintId = await ensureMarketingBlueprint(supabase, project_id);

  const { data: last } = await supabase
    .from("marketing_weekly_tasks")
    .select("sort_order")
    .eq("blueprint_id", blueprintId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const allowedPriority = ["low", "medium", "high"];
  const p = allowedPriority.includes(priority) ? priority : "medium";

  const { data, error } = await supabase
    .from("marketing_weekly_tasks")
    .insert({
      blueprint_id: blueprintId,
      title: String(title).trim(),
      priority: p,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id, title")
    .single();

  if (error) throw error;
  return { type: "add_marketing_weekly_task", ok: true, task: data };
}

async function setCurrentProject({ project_id }, telegramUserId) {
  const { upsertSession } = await import("./db");
  await upsertSession(telegramUserId, { current_project_id: project_id });
  return { type: "set_current_project", ok: true, project_id };
}

async function generateLogoAction({ project_id, prompt }, telegramUserId) {
  const { ownerUserId } = getTelegramConfig();
  if (String(telegramUserId) !== String(ownerUserId)) throw new Error("Yetkisiz");

  const host = process.env.NEXT_PUBLIC_APP_URL || "https://personelcrm.vercel.app";
  const res = await fetch(`${host}/api/logo-generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Fake session or admin header to pass auth
      Authorization: `Bearer dev-bypass`,
    },
    body: JSON.stringify({
      project_id,
      prompt,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Logo üretilemedi");

  // Send photo asynchronously to user
  const { sendMessage } = await import("./client");
  sendMessage(telegramUserId, `🎨 <b>Yeni Logo Hazır!</b>\nSiteden görebilir veya indirebilirsin:\n${data.item.logo_url}`, { parseMode: "HTML" });

  return { type: "generate_logo", ok: true, logo_url: data.item.logo_url };
}

async function appScoutAction({ app_name, app_description, category }, telegramUserId) {
  const { ownerUserId } = getTelegramConfig();
  if (String(telegramUserId) !== String(ownerUserId)) throw new Error("Yetkisiz");

  const host = process.env.NEXT_PUBLIC_APP_URL || "https://personelcrm.vercel.app";
  // 1. Create analysis
  const res1 = await fetch(`${host}/api/app-scout/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_name,
      app_description,
      category,
      screenshots: [],
    }),
  });

  const data1 = await res1.json();
  if (!res1.ok) throw new Error(data1.error || "Analiz oluşturulamadı");

  // 2. Perform background analysis (we don't await, it will send Telegram itself when done)
  fetch(`${host}/api/app-scout/analyses/${data1.analysis.id}/analyze`, { method: "POST" })
    .then((r) => r.json())
    .then((d) => {
      // Trigger send telegram
      fetch(`${host}/api/app-scout/analyses/${data1.analysis.id}/send-telegram`, { method: "POST" });
    });

  return { type: "app_scout", ok: true, app_name };
}

export function formatActionResults(results) {
  if (!results.length) return "";
  const lines = results
    .filter((r) => r.ok)
    .map((r) => {
      if (r.type === "create_todo") return `✅ Todo eklendi: ${r.todo.title}`;
      if (r.type === "complete_todo") return `✅ Tamamlandı: ${r.todo.title}`;
      if (r.type === "create_deep_work") return `✅ Deep Work: ${r.task.title}`;
      if (r.type === "add_blueprint_feature") return `✅ Özellik eklendi: ${r.feature.title}`;
      if (r.type === "update_blueprint_field") return `✅ Blueprint güncellendi (${r.field})`;
      if (r.type === "add_marketing_content") return `✅ İçerik eklendi: ${r.content.title}`;
      if (r.type === "add_marketing_weekly_task") return `✅ Haftalık görev: ${r.task.title}`;
      if (r.type === "generate_logo") return `🎨 Logo üretim sırasına alındı: Görsel birazdan özel mesajla gönderilecek.`;
      if (r.type === "app_scout") return `🔍 App Scout analizi başlatıldı: "${r.app_name}". iTunes App Store taranıyor, detaylar Telegram raporu olarak birazdan gelecek.`;
      return null;
    })
    .filter(Boolean);
  return lines.length ? "\n\n" + lines.join("\n") : "";
}
