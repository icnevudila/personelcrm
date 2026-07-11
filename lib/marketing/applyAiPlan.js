import { PLATFORMS, CONTENT_CATEGORIES } from "./constants";

function matchPlatform(name) {
  if (!name) return null;
  const exact = PLATFORMS.find((p) => p === name);
  if (exact) return exact;
  const lower = String(name).toLowerCase();
  return PLATFORMS.find((p) => p.toLowerCase() === lower) || null;
}

function matchCategory(name) {
  if (!name) return null;
  const exact = CONTENT_CATEGORIES.find((c) => c === name);
  if (exact) return exact;
  const lower = String(name).toLowerCase();
  return CONTENT_CATEGORIES.find((c) => c.toLowerCase() === lower) || null;
}

function validPriority(p) {
  return ["low", "medium", "high"].includes(p) ? p : "medium";
}

function validStage(stage, fallback) {
  const stages = ["idea", "validation", "mvp", "beta", "launch", "growth", "scale"];
  return stages.includes(stage) ? stage : fallback;
}

function validWeeklyStatus(s) {
  return ["todo", "doing", "done"].includes(s) ? s : "todo";
}

function validContentStatus(s) {
  return ["planned", "preparing", "ready", "published"].includes(s) ? s : "planned";
}

export async function applyAiMarketingPlan(supabase, blueprintId, plan, existingData) {
  const now = new Date().toISOString();

  const blueprintUpdate = {
    stage: plan.stage,
    marketing_score: plan.marketing_score,
    score_summary: plan.score_summary,
    score_gaps: plan.score_gaps,
    target_audience: plan.target_audience,
    problem: plan.problem,
    solution: plan.solution,
    competitors: plan.competitors,
    value_proposition: plan.value_proposition,
    organic_percentage: plan.organic_percentage,
    paid_percentage: plan.paid_percentage,
    funnel_data: { ...(existingData.blueprint.funnel_data || {}), ...plan.funnel_data },
    reverse_engineering: {
      ...(existingData.blueprint.reverse_engineering || {}),
      ...plan.reverse_engineering,
    },
    notes: plan.notes,
    updated_at: now,
  };

  const { error: blueprintError } = await supabase
    .from("marketing_blueprints")
    .update(blueprintUpdate)
    .eq("id", blueprintId);

  if (blueprintError) throw blueprintError;

  const channelMap = Object.fromEntries(
    (existingData.channels || []).map((c) => [c.platform, c.id])
  );

  for (const ch of plan.channels) {
    const platform = matchPlatform(ch.platform);
    const channelId = platform ? channelMap[platform] : null;
    if (!channelId) continue;

    await supabase
      .from("marketing_channels")
      .update({
        enabled: Boolean(ch.enabled),
        priority: validPriority(ch.priority),
        notes: String(ch.notes || ""),
        updated_at: now,
      })
      .eq("id", channelId);
  }

  const categoryMap = Object.fromEntries(
    (existingData.contentCategories || []).map((c) => [c.category, c.id])
  );

  for (const cat of plan.content_categories) {
    const category = matchCategory(cat.category);
    const categoryId = category ? categoryMap[category] : null;
    if (!categoryId) continue;

    const weekly_target = Math.max(0, Number(cat.weekly_target) || 0);
    await supabase
      .from("marketing_content_categories")
      .update({ weekly_target, updated_at: now })
      .eq("id", categoryId);
  }

  const existingCompetitorNames = new Set(
    (existingData.competitors || []).map((c) => c.competitor_name.toLowerCase())
  );

  for (const comp of plan.competitors_analysis) {
    const name = String(comp.competitor_name || "").trim();
    if (!name || existingCompetitorNames.has(name.toLowerCase())) continue;

    await supabase.from("marketing_competitors").insert({
      blueprint_id: blueprintId,
      competitor_name: name,
      website: String(comp.website || ""),
      strengths: String(comp.strengths || ""),
      weaknesses: String(comp.weaknesses || ""),
      strategy: String(comp.strategy || ""),
      notes: String(comp.notes || ""),
    });
    existingCompetitorNames.add(name.toLowerCase());
  }

  const currentStage = plan.stage;
  for (const task of plan.marketing_tasks) {
    const title = String(task.title || "").trim();
    if (!title) continue;

    await supabase.from("marketing_tasks").insert({
      blueprint_id: blueprintId,
      title,
      description: String(task.description || ""),
      platform: matchPlatform(task.platform) || String(task.platform || ""),
      stage: validStage(task.stage, currentStage),
      priority: validPriority(task.priority),
      assigned_to: String(task.assigned_to || ""),
      due_date: task.due_date || null,
      status: "todo",
    });
  }

  let weeklySort = (existingData.weeklyTasks || []).length;
  for (const task of plan.weekly_tasks) {
    const title = String(task.title || "").trim();
    if (!title) continue;

    await supabase.from("marketing_weekly_tasks").insert({
      blueprint_id: blueprintId,
      title,
      description: String(task.description || ""),
      due_date: task.due_date || null,
      priority: validPriority(task.priority),
      assigned_to: String(task.assigned_to || ""),
      status: validWeeklyStatus(task.status),
      sort_order: weeklySort++,
    });
  }

  for (const content of plan.content_calendar) {
    const title = String(content.title || "").trim();
    if (!title) continue;

    await supabase.from("marketing_contents").insert({
      blueprint_id: blueprintId,
      title,
      category: matchCategory(content.category) || String(content.category || ""),
      platform: matchPlatform(content.platform) || String(content.platform || ""),
      planned_date: content.planned_date || null,
      status: validContentStatus(content.status),
      notes: String(content.notes || ""),
    });
  }

  const checklistByName = Object.fromEntries(
    (existingData.launchChecklist || []).map((i) => [i.item_name, i.id])
  );

  for (const itemName of plan.launch_checklist_completed) {
    const itemId = checklistByName[itemName];
    if (!itemId) continue;

    await supabase
      .from("marketing_launch_checklist")
      .update({ completed: true, updated_at: now })
      .eq("id", itemId);
  }
}
