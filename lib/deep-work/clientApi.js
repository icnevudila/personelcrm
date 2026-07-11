export async function fetchTasks(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.planned_date) qs.set("planned_date", params.planned_date);
  if (params.is_today_plan) qs.set("is_today_plan", "1");
  if (params.include_archive) qs.set("include_archive", "1");
  const res = await fetch(`/api/deep-work/tasks?${qs}`);
  if (!res.ok) throw new Error("Görevler yüklenemedi");
  return res.json();
}

export async function createTask(payload) {
  const res = await fetch("/api/deep-work/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Görev eklenemedi");
  return data;
}

export async function updateTask(id, payload) {
  const res = await fetch(`/api/deep-work/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Güncellenemedi");
  return data;
}

export async function deleteTask(id) {
  const res = await fetch(`/api/deep-work/tasks/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Silinemedi");
  }
}

export async function moveTask(payload) {
  const res = await fetch("/api/deep-work/tasks/move", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Taşınamadı");
  return data;
}

export async function fetchActiveSession() {
  const res = await fetch("/api/deep-work/sessions?active=1");
  if (!res.ok) return null;
  return res.json();
}

export async function startSession(taskId, sessionType = "focus") {
  const res = await fetch("/api/deep-work/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id: taskId, session_type: sessionType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Oturum başlatılamadı");
  return data;
}

export async function stopSession(sessionId) {
  const res = await fetch(`/api/deep-work/sessions/${sessionId}`, { method: "PATCH" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Oturum durdurulamadı");
  return data;
}

export async function fetchSettings() {
  const res = await fetch("/api/deep-work/settings");
  if (!res.ok) throw new Error("Ayarlar yüklenemedi");
  return res.json();
}

export async function saveSettings(payload) {
  const res = await fetch("/api/deep-work/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Kaydedilemedi");
  return data;
}

export async function fetchStats() {
  const res = await fetch("/api/deep-work/stats");
  if (!res.ok) throw new Error("İstatistikler yüklenemedi");
  return res.json();
}

export async function fetchReview(date) {
  const res = await fetch(`/api/deep-work/daily-reviews?date=${date}`);
  if (!res.ok) throw new Error("Değerlendirme yüklenemedi");
  return res.json();
}

export async function saveReview(payload) {
  const res = await fetch("/api/deep-work/daily-reviews", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Kaydedilemedi");
  return data;
}

export async function fetchProjects() {
  const res = await fetch("/api/projects");
  if (!res.ok) return [];
  return res.json();
}
