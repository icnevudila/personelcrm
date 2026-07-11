import { getSupabase } from "./db";
import { ensureProjectBlueprint, fetchBlueprintData } from "@/lib/productBlueprint/seed";
import { ensureMarketingBlueprint, fetchMarketingData } from "@/lib/marketing/seed";
import { INTENTS } from "./intent";
import { getTelegramConfig } from "./config";

export async function listProjects() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("projects")
    .select("id, name, status, type, description")
    .eq("is_archived", false)
    .order("is_favorited", { ascending: false })
    .order("updated_at", { ascending: false });
  return data || [];
}

export async function resolveProject(projectId, projectHint, projects) {
  if (projectId) {
    const found = projects.find((p) => p.id === projectId);
    if (found) return found;
  }
  if (projectHint) return projectHint;
  return projects[0] || null;
}

async function loadTodos(projectId) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("project_todos")
    .select("id, title, is_completed, color, created_at")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .eq("is_deleted", false)
    .order("sort_order", { ascending: true })
    .limit(30);
  return data || [];
}

async function loadBlueprint(projectId) {
  const supabase = getSupabase();
  const blueprintId = await ensureProjectBlueprint(supabase, projectId);
  const data = await fetchBlueprintData(supabase, blueprintId);
  return compactBlueprint(data);
}

async function loadMarketing(projectId) {
  const supabase = getSupabase();
  const blueprintId = await ensureMarketingBlueprint(supabase, projectId);
  const data = await fetchMarketingData(supabase, blueprintId);
  return compactMarketing(data);
}

async function loadDeepWork() {
  const { ownerUserId } = getTelegramConfig();
  if (!ownerUserId) return { tasks: [], settings: null };

  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const [tasksRes, settingsRes] = await Promise.all([
    supabase
      .from("deep_work_tasks")
      .select("id, title, status, priority, estimated_minutes, is_today_plan, project_id, projects(name)")
      .eq("user_id", ownerUserId)
      .neq("status", "archive")
      .or(`is_today_plan.eq.true,planned_date.eq.${today}`)
      .order("sort_order", { ascending: true })
      .limit(20),
    supabase
      .from("deep_work_settings")
      .select("daily_goal_minutes")
      .eq("user_id", ownerUserId)
      .maybeSingle(),
  ]);

  return {
    tasks: tasksRes.data || [],
    settings: settingsRes.data,
    today,
  };
}

function compactBlueprint(data) {
  const b = data.blueprint;
  return {
    short_description: b.short_description,
    problem: b.problem,
    solution: b.solution,
    target_audience: b.target_audience,
    value_proposition: b.value_proposition,
    roadmap_stage: b.roadmap_stage,
    vision: b.vision,
    features: (data.features || []).slice(0, 15).map((f) => ({
      title: f.title,
      priority: f.priority,
      is_mvp: f.is_mvp,
    })),
    mvp_items: (data.mvpItems || []).slice(0, 10).map((m) => m.title),
    competitors: (data.competitors || []).slice(0, 5).map((c) => c.competitor_name),
  };
}

function compactMarketing(data) {
  const b = data.blueprint;
  return {
    stage: b.stage,
    marketing_score: b.marketing_score,
    target_audience: b.target_audience,
    value_proposition: b.value_proposition,
    organic_percentage: b.organic_percentage,
    paid_percentage: b.paid_percentage,
    channels: (data.channels || []).filter((c) => c.enabled).map((c) => c.platform),
    weekly_tasks: (data.weeklyTasks || []).slice(0, 10).map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
    })),
    contents: (data.contents || []).slice(0, 8).map((c) => ({
      title: c.title,
      status: c.status,
      planned_date: c.planned_date,
    })),
    launch_checklist: (data.launchChecklist || []).map((i) => ({
      item: i.item_name,
      done: i.completed,
    })),
    kpis: data.kpis
      ? {
          visitors: data.kpis.visitors,
          signups: data.kpis.signups,
          conversion_rate: data.kpis.conversion_rate,
        }
      : null,
  };
}

const INTENT_CONTEXT_MAP = {
  [INTENTS.TODO]: ["project", "todos"],
  [INTENTS.BLUEPRINT]: ["project", "blueprint"],
  [INTENTS.MARKETING]: ["project", "marketing"],
  [INTENTS.STATUS]: ["project", "todos", "blueprint", "marketing", "deepwork"],
  [INTENTS.LAUNCH]: ["project", "marketing", "blueprint", "todos"],
  [INTENTS.REPORT]: ["projects_summary", "deepwork"],
  [INTENTS.WEEKLY]: ["projects_summary", "todos_summary"],
  [INTENTS.DEEPWORK]: ["deepwork", "projects"],
  [INTENTS.FEATURE]: ["project", "blueprint", "todos"],
  [INTENTS.SPRINT]: ["project", "todos", "blueprint"],
  [INTENTS.BRAIN_DUMP]: ["projects"],
  [INTENTS.CHAT]: ["projects"],
  [INTENTS.PROJECT]: ["project"],
  [INTENTS.PROJECTS]: ["projects"],
};

export async function buildContext(intent, project, projects) {
  const keys = INTENT_CONTEXT_MAP[intent] || ["projects"];
  const ctx = { intent, date: new Date().toISOString().slice(0, 10) };

  if (keys.includes("projects") || keys.includes("projects_summary")) {
    ctx.projects = projects.map((p) => ({ id: p.id, name: p.name, status: p.status }));
  }

  if (keys.includes("project") && project) {
    ctx.project = { id: project.id, name: project.name, status: project.status, type: project.type };
  }

  if (keys.includes("todos") && project) {
    ctx.todos = await loadTodos(project.id);
  }

  if (keys.includes("todos_summary")) {
    const supabase = getSupabase();
    const ids = projects.map((p) => p.id);
    if (ids.length) {
      const { data } = await supabase
        .from("project_todos")
        .select("title, is_completed, projects(name)")
        .in("project_id", ids)
        .eq("is_archived", false)
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })
        .limit(25);
      ctx.recent_todos = data || [];
    }
  }

  if (keys.includes("blueprint") && project) {
    ctx.blueprint = await loadBlueprint(project.id);
  }

  if (keys.includes("marketing") && project) {
    ctx.marketing = await loadMarketing(project.id);
  }

  if (keys.includes("deepwork")) {
    ctx.deepwork = await loadDeepWork();
  }

  return ctx;
}
