import { validPriority, validMvpStage, validTechCategory } from "./aiBrief";

export async function applyAiProductBrief(supabase, blueprintId, brief, existingData) {
  const now = new Date().toISOString();

  const blueprintUpdate = {
    short_description: brief.short_description,
    elevator_pitch: brief.elevator_pitch,
    problem: brief.problem,
    solution: brief.solution,
    target_audience: brief.target_audience,
    industry: brief.industry,
    country: brief.country,
    user_type: brief.user_type,
    company_type: brief.company_type,
    ideal_customer_profile: brief.ideal_customer_profile,
    value_proposition: brief.value_proposition,
    monetization_model: brief.monetization_model,
    roadmap_stage: brief.roadmap_stage,
    vision: brief.vision,
    mission: brief.mission,
    long_term_goal: brief.long_term_goal,
    updated_at: now,
  };

  const { error: blueprintError } = await supabase
    .from("project_blueprints")
    .update(blueprintUpdate)
    .eq("id", blueprintId);

  if (blueprintError) throw blueprintError;

  // 1. Bulk insert features
  const existingFeatureTitles = new Set(
    (existingData.features || []).map((f) => f.title.toLowerCase())
  );
  let featureSort = (existingData.features || []).length;
  const featuresToInsert = [];

  for (const feature of brief.features) {
    const title = String(feature.title || "").trim();
    if (!title || existingFeatureTitles.has(title.toLowerCase())) continue;

    featuresToInsert.push({
      blueprint_id: blueprintId,
      title,
      description: String(feature.description || ""),
      priority: validPriority(feature.priority),
      is_mvp: Boolean(feature.is_mvp),
      sort_order: featureSort++,
    });
    existingFeatureTitles.add(title.toLowerCase());
  }

  if (featuresToInsert.length > 0) {
    const { error: err } = await supabase.from("blueprint_features").insert(featuresToInsert);
    if (err) throw err;
  }

  // 2. Bulk insert MVP items
  const existingMvpTitles = new Set(
    (existingData.mvpItems || []).map((i) => `${i.stage}:${i.title.toLowerCase()}`)
  );
  const mvpItemsToInsert = [];
  const stageLastOrders = {}; // Cache to determine sort_order for each stage in bulk

  for (const item of brief.mvp_items) {
    const title = String(item.title || "").trim();
    const stage = validMvpStage(item.stage);
    const key = `${stage}:${title.toLowerCase()}`;
    if (!title || existingMvpTitles.has(key)) continue;

    if (stageLastOrders[stage] === undefined) {
      const { data: last } = await supabase
        .from("blueprint_mvp_items")
        .select("sort_order")
        .eq("blueprint_id", blueprintId)
        .eq("stage", stage)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      stageLastOrders[stage] = last?.sort_order ?? -1;
    }

    stageLastOrders[stage] += 1;

    mvpItemsToInsert.push({
      blueprint_id: blueprintId,
      title,
      description: String(item.description || ""),
      stage,
      sort_order: stageLastOrders[stage],
    });
    existingMvpTitles.add(key);
  }

  if (mvpItemsToInsert.length > 0) {
    const { error: err } = await supabase.from("blueprint_mvp_items").insert(mvpItemsToInsert);
    if (err) throw err;
  }

  // 3. Bulk insert success metrics
  const existingMetricTitles = new Set(
    (existingData.successMetrics || []).map((m) => m.title.toLowerCase())
  );
  let metricSort = (existingData.successMetrics || []).length;
  const metricsToInsert = [];

  for (const metric of brief.success_metrics) {
    const title = String(metric.title || "").trim();
    if (!title || existingMetricTitles.has(title.toLowerCase())) continue;

    metricsToInsert.push({
      blueprint_id: blueprintId,
      title,
      target_value: String(metric.target_value || ""),
      current_value: String(metric.current_value || ""),
      completed: false,
      sort_order: metricSort++,
    });
    existingMetricTitles.add(title.toLowerCase());
  }

  if (metricsToInsert.length > 0) {
    const { error: err } = await supabase.from("blueprint_success_metrics").insert(metricsToInsert);
    if (err) throw err;
  }

  // 4. Bulk insert competitors
  const existingCompetitorNames = new Set(
    (existingData.competitors || []).map((c) => c.competitor_name.toLowerCase())
  );
  const competitorsToInsert = [];

  for (const comp of brief.competitors) {
    const name = String(comp.competitor_name || "").trim();
    if (!name || existingCompetitorNames.has(name.toLowerCase())) continue;

    competitorsToInsert.push({
      blueprint_id: blueprintId,
      competitor_name: name,
      website: String(comp.website || ""),
      strengths: String(comp.strengths || ""),
      weaknesses: String(comp.weaknesses || ""),
      differentiation: String(comp.differentiation || ""),
      notes: String(comp.notes || ""),
    });
    existingCompetitorNames.add(name.toLowerCase());
  }

  if (competitorsToInsert.length > 0) {
    const { error: err } = await supabase.from("blueprint_competitors").insert(competitorsToInsert);
    if (err) throw err;
  }

  // 5. Bulk insert tech stack items
  const existingTech = new Set(
    (existingData.techStack || []).map((t) => t.technology.toLowerCase())
  );
  let techSort = (existingData.techStack || []).length;
  const techToInsert = [];

  for (const tech of brief.tech_stack) {
    const technology = String(tech.technology || "").trim();
    if (!technology || existingTech.has(technology.toLowerCase())) continue;

    techToInsert.push({
      blueprint_id: blueprintId,
      technology,
      category: validTechCategory(tech.category),
      sort_order: techSort++,
    });
    existingTech.add(technology.toLowerCase());
  }

  if (techToInsert.length > 0) {
    const { error: err } = await supabase.from("blueprint_tech_stack").insert(techToInsert);
    if (err) throw err;
  }
}
