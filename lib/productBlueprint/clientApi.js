export function blueprintFetch(projectId, path, options = {}) {
  return fetch(`/api/projects/${projectId}/blueprint${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

async function parseJson(res) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "İşlem başarısız");
  return json;
}

export async function fetchBlueprint(projectId) {
  const res = await blueprintFetch(projectId, "");
  return parseJson(res);
}

export async function patchBlueprint(projectId, data) {
  const res = await blueprintFetch(projectId, "", { method: "PATCH", body: JSON.stringify(data) });
  return parseJson(res);
}

export async function createFeature(projectId, data) {
  const res = await blueprintFetch(projectId, "/features", { method: "POST", body: JSON.stringify(data) });
  return parseJson(res);
}

export async function patchFeature(projectId, featureId, data) {
  const res = await blueprintFetch(projectId, `/features/${featureId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteFeature(projectId, featureId) {
  const res = await blueprintFetch(projectId, `/features/${featureId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function reorderFeatures(projectId, ordered_ids) {
  const res = await blueprintFetch(projectId, "/features/reorder", {
    method: "PUT",
    body: JSON.stringify({ ordered_ids }),
  });
  return parseJson(res);
}

export async function createMetric(projectId, data) {
  const res = await blueprintFetch(projectId, "/metrics", { method: "POST", body: JSON.stringify(data) });
  return parseJson(res);
}

export async function patchMetric(projectId, metricId, data) {
  const res = await blueprintFetch(projectId, `/metrics/${metricId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteMetric(projectId, metricId) {
  const res = await blueprintFetch(projectId, `/metrics/${metricId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function createCompetitor(projectId, data) {
  const res = await blueprintFetch(projectId, "/competitors", { method: "POST", body: JSON.stringify(data) });
  return parseJson(res);
}

export async function patchCompetitor(projectId, competitorId, data) {
  const res = await blueprintFetch(projectId, `/competitors/${competitorId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteCompetitor(projectId, competitorId) {
  const res = await blueprintFetch(projectId, `/competitors/${competitorId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function createTech(projectId, data) {
  const res = await blueprintFetch(projectId, "/tech-stack", { method: "POST", body: JSON.stringify(data) });
  return parseJson(res);
}

export async function patchTech(projectId, techId, data) {
  const res = await blueprintFetch(projectId, `/tech-stack/${techId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteTech(projectId, techId) {
  const res = await blueprintFetch(projectId, `/tech-stack/${techId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function createMvpItem(projectId, data) {
  const res = await blueprintFetch(projectId, "/mvp-items", { method: "POST", body: JSON.stringify(data) });
  return parseJson(res);
}

export async function patchMvpItem(projectId, itemId, data) {
  const res = await blueprintFetch(projectId, `/mvp-items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteMvpItem(projectId, itemId) {
  const res = await blueprintFetch(projectId, `/mvp-items/${itemId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function reorderMvpItems(projectId, stage, ordered_ids) {
  const res = await blueprintFetch(projectId, "/mvp-items/reorder", {
    method: "PUT",
    body: JSON.stringify({ stage, ordered_ids }),
  });
  return parseJson(res);
}

export async function generateBlueprintBrief(projectId, hint = "") {
  const res = await blueprintFetch(projectId, "/ai-brief", {
    method: "POST",
    body: JSON.stringify({ hint }),
  });
  return parseJson(res);
}
