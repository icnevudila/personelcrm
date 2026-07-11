export function marketingFetch(projectId, path, options = {}) {
  return fetch(`/api/projects/${projectId}/marketing${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

export async function patchBlueprint(projectId, data) {
  const res = await marketingFetch(projectId, "", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function patchChannel(projectId, channelId, data) {
  const res = await marketingFetch(projectId, `/channels/${channelId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function patchContentCategory(projectId, categoryId, data) {
  const res = await marketingFetch(projectId, `/content-categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function createContent(projectId, data) {
  const res = await marketingFetch(projectId, "/contents", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Oluşturulamadı");
  return json;
}

export async function patchContent(projectId, contentId, data) {
  const res = await marketingFetch(projectId, `/contents/${contentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function deleteContent(projectId, contentId) {
  const res = await marketingFetch(projectId, `/contents/${contentId}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Silinemedi");
  return json;
}

export async function createTask(projectId, data) {
  const res = await marketingFetch(projectId, "/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Oluşturulamadı");
  return json;
}

export async function patchTask(projectId, taskId, data) {
  const res = await marketingFetch(projectId, `/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function deleteTask(projectId, taskId) {
  const res = await marketingFetch(projectId, `/tasks/${taskId}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Silinemedi");
  return json;
}

export async function createWeeklyTask(projectId, data) {
  const res = await marketingFetch(projectId, "/weekly-tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Oluşturulamadı");
  return json;
}

export async function patchWeeklyTask(projectId, weeklyTaskId, data) {
  const res = await marketingFetch(projectId, `/weekly-tasks/${weeklyTaskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function deleteWeeklyTask(projectId, weeklyTaskId) {
  const res = await marketingFetch(projectId, `/weekly-tasks/${weeklyTaskId}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Silinemedi");
  return json;
}

export async function patchLaunchItem(projectId, itemId, data) {
  const res = await marketingFetch(projectId, `/launch-checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function createCompetitor(projectId, data) {
  const res = await marketingFetch(projectId, "/competitors", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Oluşturulamadı");
  return json;
}

export async function patchCompetitor(projectId, competitorId, data) {
  const res = await marketingFetch(projectId, `/competitors/${competitorId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function deleteCompetitor(projectId, competitorId) {
  const res = await marketingFetch(projectId, `/competitors/${competitorId}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Silinemedi");
  return json;
}

export async function patchKpis(projectId, data) {
  const res = await marketingFetch(projectId, "/kpis", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Kaydedilemedi");
  return json;
}

export async function generateMarketingPlan(projectId, hint = "") {
  const res = await marketingFetch(projectId, "/ai-coach", {
    method: "POST",
    body: JSON.stringify({ hint }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Plan oluşturulamadı");
  return json;
}
