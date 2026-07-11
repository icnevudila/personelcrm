import { DEFAULT_ICP, DEFAULT_MONETIZATION } from "./constants";

export async function ensureProjectBlueprint(supabase, projectId) {
  const { data: existing } = await supabase
    .from("project_blueprints")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: blueprint, error } = await supabase
    .from("project_blueprints")
    .insert({
      project_id: projectId,
      ideal_customer_profile: DEFAULT_ICP,
      monetization_model: DEFAULT_MONETIZATION,
    })
    .select("id")
    .single();

  if (error) throw error;
  return blueprint.id;
}

export async function fetchBlueprintData(supabase, blueprintId) {
  const [
    blueprintRes,
    featuresRes,
    metricsRes,
    competitorsRes,
    techStackRes,
    mvpItemsRes,
  ] = await Promise.all([
    supabase.from("project_blueprints").select("*").eq("id", blueprintId).single(),
    supabase
      .from("blueprint_features")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("blueprint_success_metrics")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("blueprint_competitors")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("created_at", { ascending: false }),
    supabase
      .from("blueprint_tech_stack")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("blueprint_mvp_items")
      .select("*")
      .eq("blueprint_id", blueprintId)
      .order("sort_order", { ascending: true }),
  ]);

  if (blueprintRes.error) throw blueprintRes.error;

  return {
    blueprint: blueprintRes.data,
    features: featuresRes.data || [],
    successMetrics: metricsRes.data || [],
    competitors: competitorsRes.data || [],
    techStack: techStackRes.data || [],
    mvpItems: mvpItemsRes.data || [],
  };
}
