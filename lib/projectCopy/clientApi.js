function projectCopyFetch(projectId, path, options = {}) {
  return fetch(`/api/projects/${projectId}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

async function parseJson(res) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "İşlem başarısız");
  return json;
}

export function sortByFavorite(items) {
  return [...items].sort((a, b) => {
    if (a.is_favorited !== b.is_favorited) return a.is_favorited ? -1 : 1;
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return (b.sort_order ?? 0) - (a.sort_order ?? 0);
  });
}

// --- Name candidates ---

export async function fetchNameCandidates(projectId) {
  const res = await projectCopyFetch(projectId, "/name-candidates");
  return parseJson(res);
}

export async function createNameCandidate(projectId, data) {
  const res = await projectCopyFetch(projectId, "/name-candidates", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function patchNameCandidate(projectId, candidateId, data) {
  const res = await projectCopyFetch(projectId, `/name-candidates/${candidateId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteNameCandidate(projectId, candidateId) {
  const res = await projectCopyFetch(projectId, `/name-candidates/${candidateId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function generateNameCandidates(projectId, hint = "", count = 10) {
  const res = await projectCopyFetch(projectId, "/name-candidates/generate", {
    method: "POST",
    body: JSON.stringify({ hint, count }),
  });
  return parseJson(res);
}

// --- Slogans ---

export async function fetchSlogans(projectId) {
  const res = await projectCopyFetch(projectId, "/slogans");
  return parseJson(res);
}

export async function createSlogan(projectId, data) {
  const res = await projectCopyFetch(projectId, "/slogans", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function patchSlogan(projectId, sloganId, data) {
  const res = await projectCopyFetch(projectId, `/slogans/${sloganId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteSlogan(projectId, sloganId) {
  const res = await projectCopyFetch(projectId, `/slogans/${sloganId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function generateSlogans(projectId, copy_type = "slogan", hint = "", count = 6) {
  const res = await projectCopyFetch(projectId, "/slogans/generate", {
    method: "POST",
    body: JSON.stringify({ copy_type, hint, count }),
  });
  return parseJson(res);
}
