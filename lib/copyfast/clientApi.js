function copyfastFetch(projectId, path, options = {}) {
  return fetch(`/api/projects/${projectId}/copyfast${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
}

async function parseJson(res) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "İşlem başarısız");
  return json;
}

export async function fetchCopyfastItems(projectId) {
  const res = await copyfastFetch(projectId, "/items");
  return parseJson(res);
}

export async function createCopyfastItem(projectId, data) {
  const res = await copyfastFetch(projectId, "/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function patchCopyfastItem(projectId, itemId, data) {
  const res = await copyfastFetch(projectId, `/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson(res);
}

export async function deleteCopyfastItem(projectId, itemId) {
  const res = await copyfastFetch(projectId, `/items/${itemId}`, { method: "DELETE" });
  return parseJson(res);
}

export async function uploadCopyfastImage(projectId, itemId, file, imageType) {
  const form = new FormData();
  form.append("file", file);
  form.append("image_type", imageType);
  const res = await copyfastFetch(projectId, `/items/${itemId}/upload`, {
    method: "POST",
    body: form,
  });
  return parseJson(res);
}

export async function analyzeCopyfastItem(projectId, itemId) {
  const res = await copyfastFetch(projectId, `/items/${itemId}/analyze`, { method: "POST" });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error || "İşlem başarısız");
    err.item = json.item;
    throw err;
  }
  return json;
}

export async function analyzeCopyfastProject(projectId) {
  const res = await copyfastFetch(projectId, "/analyze-project", { method: "POST" });
  return parseJson(res);
}

export async function fetchCopyfastMeta(projectId) {
  const res = await copyfastFetch(projectId, "/meta");
  return parseJson(res);
}

export function downloadPrompt(text, filename) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyPrompt(text) {
  await navigator.clipboard.writeText(text);
}
