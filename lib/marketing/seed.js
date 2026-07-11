import {
  PLATFORMS,
  CONTENT_CATEGORIES,
  LAUNCH_CHECKLIST_ITEMS,
  DEFAULT_SCORE_GAPS,
  DEFAULT_FUNNEL_DATA,
  DEFAULT_REVERSE_ENGINEERING,
} from "./constants";

export async function ensureMarketingBlueprint(supabase, projectId) {
  const { data: existing } = await supabase
    .from("marketing_blueprints")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: blueprint, error } = await supabase
    .from("marketing_blueprints")
    .insert({
      project_id: projectId,
      score_gaps: DEFAULT_SCORE_GAPS,
      funnel_data: DEFAULT_FUNNEL_DATA,
      reverse_engineering: DEFAULT_REVERSE_ENGINEERING,
    })
    .select("id")
    .single();

  if (error) throw error;

  const blueprintId = blueprint.id;

  await Promise.all([
    seedChannels(supabase, blueprintId),
    seedContentCategories(supabase, blueprintId),
    seedLaunchChecklist(supabase, blueprintId),
    supabase.from("marketing_kpis").insert({ blueprint_id: blueprintId }),
  ]);

  return blueprintId;
}

async function seedChannels(supabase, blueprintId) {
  const rows = PLATFORMS.map((platform, index) => ({
    blueprint_id: blueprintId,
    platform,
    sort_order: index,
  }));
  await supabase.from("marketing_channels").insert(rows);
}

async function seedContentCategories(supabase, blueprintId) {
  const rows = CONTENT_CATEGORIES.map((category, index) => ({
    blueprint_id: blueprintId,
    category,
    sort_order: index,
  }));
  await supabase.from("marketing_content_categories").insert(rows);
}

async function seedLaunchChecklist(supabase, blueprintId) {
  const rows = LAUNCH_CHECKLIST_ITEMS.map((item_name, index) => ({
    blueprint_id: blueprintId,
    item_name,
    sort_order: index,
  }));
  await supabase.from("marketing_launch_checklist").insert(rows);
}

export async function fetchMarketingData(supabase, blueprintId) {
  const [
    blueprintRes,
    channelsRes,
    categoriesRes,
    contentsRes,
    tasksRes,
    weeklyRes,
    checklistRes,
    competitorsRes,
    kpisRes,
  ] = await Promise.all([
    supabase.from("marketing_blueprints").select("*").eq("id", blueprintId).single(),
    supabase
      .from("marketing_channels")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("marketing_content_categories")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("marketing_contents")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("planned_date", { ascending: true }),
    supabase
      .from("marketing_tasks")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("created_at", { ascending: false }),
    supabase
      .from("marketing_weekly_tasks")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("marketing_launch_checklist")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("marketing_competitors")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("created_at", { ascending: false }),
    supabase.from("marketing_kpis").select("*").eq("blueprint_id", blueprintId).maybeSingle(),
  ]);

  if (blueprintRes.error) throw blueprintRes.error;

  return {
    blueprint: blueprintRes.data,
    channels: channelsRes.data || [],
    contentCategories: categoriesRes.data || [],
    contents: contentsRes.data || [],
    tasks: tasksRes.data || [],
    weeklyTasks: weeklyRes.data || [],
    launchChecklist: checklistRes.data || [],
    competitors: competitorsRes.data || [],
    kpis: kpisRes.data || null,
  };
}
