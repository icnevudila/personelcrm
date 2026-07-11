import { detectSearchIntent } from "./intent";
import { calculateOpportunityScore } from "./scoring";

function normalizeKeyword(keyword) {
  return (keyword || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export async function getExistingCandidateSet(supabase, projectId) {
  const { data } = await supabase
    .from("keyword_candidates")
    .select("keyword")
    .eq("project_id", projectId);

  return new Set((data || []).map((r) => normalizeKeyword(r.keyword)));
}

export function enrichCandidateRow(projectId, keyword, source, extra = {}) {
  const kw = normalizeKeyword(keyword);
  const city = extra.city || null;
  const district = extra.district || null;
  const search_intent =
    extra.search_intent || detectSearchIntent(kw, { city, district });
  const score =
    extra.score ?? calculateOpportunityScore(kw, { city, district });

  return {
    project_id: projectId,
    keyword: kw,
    source,
    score,
    search_intent,
    cluster_name: extra.cluster_name || null,
    city,
    district,
    selected: false,
    metadata: extra.metadata || null,
    parent_id: extra.parent_id || null,
  };
}

export async function insertKeywordCandidates(supabase, projectId, keywords, source, extra = {}) {
  const existing = await getExistingCandidateSet(supabase, projectId);
  const rows = [];

  for (const entry of keywords) {
    const raw =
      typeof entry === "string" ? entry : entry.keyword || entry.value || "";
    const kw = normalizeKeyword(raw);
    if (!kw || existing.has(kw)) continue;
    existing.add(kw);

    const rowExtra =
      typeof entry === "object" && entry !== null
        ? { ...extra, ...entry, keyword: kw }
        : { ...extra, keyword: kw };

    rows.push(enrichCandidateRow(projectId, kw, source, rowExtra));
  }

  if (rows.length === 0) return { inserted: 0, skipped: keywords.length };

  const { error } = await supabase.from("keyword_candidates").insert(rows);
  if (error) throw new Error(error.message);

  return { inserted: rows.length, skipped: keywords.length - rows.length };
}

/**
 * Google önerilerini alt aday olarak ekler veya listedeki kök adayları bu parent altına bağlar.
 */
export async function attachKeywordChildren(
  supabase,
  projectId,
  parentId,
  keywordList,
  source,
  parentKeyword
) {
  const parentNorm = normalizeKeyword(parentKeyword);
  const normalized = [
    ...new Set(
      keywordList
        .map((k) => (typeof k === "string" ? k : k.keyword || ""))
        .map(normalizeKeyword)
        .filter((kw) => kw && kw !== parentNorm)
    ),
  ];

  const { data: existing, error: exErr } = await supabase
    .from("keyword_candidates")
    .select("id, keyword, parent_id")
    .eq("project_id", projectId);

  if (exErr) throw new Error(exErr.message);

  const byKw = new Map();
  for (const row of existing || []) {
    byKw.set(normalizeKeyword(row.keyword), row);
  }

  const toInsert = [];
  const attachIds = [];
  let alreadyUnderParent = 0;

  for (const kw of normalized) {
    const row = byKw.get(kw);
    if (!row) {
      toInsert.push(enrichCandidateRow(projectId, kw, source, { parent_id: parentId }));
      continue;
    }
    if (row.id === parentId) continue;
    if (row.parent_id === parentId) {
      alreadyUnderParent += 1;
      continue;
    }
    if (!row.parent_id) {
      attachIds.push(row.id);
    }
  }

  if (attachIds.length > 0) {
    const { error: upErr } = await supabase
      .from("keyword_candidates")
      .update({ parent_id: parentId })
      .in("id", attachIds);
    if (upErr) {
      if (upErr.message?.includes("parent_id")) {
        throw new Error(
          "parent_id kolonu yok. Supabase SQL: alter table keyword_candidates add column parent_id uuid references keyword_candidates(id) on delete cascade;"
        );
      }
      throw new Error(upErr.message);
    }
  }

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase.from("keyword_candidates").insert(toInsert);
    if (insErr) {
      if (insErr.message?.includes("parent_id")) {
        throw new Error(
          "parent_id kolonu yok. Supabase SQL: alter table keyword_candidates add column parent_id uuid references keyword_candidates(id) on delete cascade;"
        );
      }
      throw new Error(insErr.message);
    }
  }

  return {
    inserted: toInsert.length,
    attached: attachIds.length,
    alreadyUnderParent,
    suggestions: normalized.length,
  };
}
