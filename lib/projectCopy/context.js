export { getProjectAccess, requireProjectAccess } from "@/lib/marketing/access";

export async function fetchProjectCopyContext(supabase, projectId) {
  const [projectRes, blueprintRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, type, setup_prompt")
      .eq("id", projectId)
      .single(),
    supabase
      .from("project_blueprints")
      .select("short_description, elevator_pitch, problem, solution, value_proposition, target_audience, industry")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  if (projectRes.error) throw projectRes.error;

  const project = projectRes.data;
  const blueprint = blueprintRes.data;

  const description = (project.description || "").trim();
  const shortDescription = (blueprint?.short_description || "").trim();
  const elevatorPitch = (blueprint?.elevator_pitch || "").trim();

  const contextParts = [];
  if (description) contextParts.push(`Proje açıklaması: ${description}`);
  if (shortDescription) contextParts.push(`Kısa açıklama: ${shortDescription}`);
  if (elevatorPitch) contextParts.push(`Elevator pitch: ${elevatorPitch}`);
  if (blueprint?.problem) contextParts.push(`Problem: ${blueprint.problem}`);
  if (blueprint?.solution) contextParts.push(`Çözüm: ${blueprint.solution}`);
  if (blueprint?.value_proposition) contextParts.push(`Değer önerisi: ${blueprint.value_proposition}`);
  if (blueprint?.target_audience) contextParts.push(`Hedef kitle: ${blueprint.target_audience}`);
  if (blueprint?.industry) contextParts.push(`Sektör: ${blueprint.industry}`);

  return {
    project,
    blueprint,
    hasRichContext: Boolean(description && shortDescription),
    contextText: contextParts.join("\n"),
    description,
    shortDescription,
  };
}
