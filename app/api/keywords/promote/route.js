import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { NextResponse } from "next/server";

function normalizeKeyword(keyword) {
  return (keyword || "").trim().toLowerCase();
}

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project_id, candidate_ids, only_selected } = await request.json();
  if (!project_id) {
    return NextResponse.json({ error: "project_id gerekli" }, { status: 400 });
  }

  const access = await checkProjectAccess(supabase, user, admin, project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data: allCandidates, error: cErr } = await supabase
    .from("keyword_candidates")
    .select("id, keyword, selected, score, search_intent, cluster_name, source")
    .eq("project_id", project_id);

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  let selectedCandidates = (allCandidates || []).filter((c) => c.selected);

  if (candidate_ids?.length) {
    const idSet = new Set(candidate_ids);
    selectedCandidates = (allCandidates || []).filter((c) => idSet.has(c.id));
  } else if (!only_selected) {
    return NextResponse.json({ error: "candidate_ids veya only_selected gerekli" }, { status: 400 });
  }

  const { data: existingProjectKw, error: pkErr } = await supabase
    .from("project_keywords")
    .select("id, keyword")
    .eq("project_id", project_id);

  if (pkErr) return NextResponse.json({ error: pkErr.message }, { status: 500 });

  const candidateKeywordSet = new Set(
    (allCandidates || []).map((c) => normalizeKeyword(c.keyword))
  );
  const selectedKeywordSet = new Set(
    selectedCandidates.map((c) => normalizeKeyword(c.keyword))
  );

  const toRemoveIds = (existingProjectKw || [])
    .filter((pk) => {
      const n = normalizeKeyword(pk.keyword);
      return candidateKeywordSet.has(n) && !selectedKeywordSet.has(n);
    })
    .map((pk) => pk.id);

  if (toRemoveIds.length > 0) {
    const { error: delErr } = await supabase
      .from("project_keywords")
      .delete()
      .in("id", toRemoveIds);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const remainingSet = new Set(
    (existingProjectKw || [])
      .filter((pk) => !toRemoveIds.includes(pk.id))
      .map((pk) => normalizeKeyword(pk.keyword))
  );

  const toInsert = [];
  for (const c of selectedCandidates) {
    const kw = normalizeKeyword(c.keyword);
    if (remainingSet.has(kw)) continue;
    remainingSet.add(kw);
    toInsert.push({
      project_id,
      keyword: kw,
      score: c.score,
      search_intent: c.search_intent,
      cluster_name: c.cluster_name,
      status: "pending",
      source: c.source,
    });
  }

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase.from("project_keywords").insert(toInsert);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  const total = selectedKeywordSet.size;

  return NextResponse.json({
    promoted: toInsert.length,
    removed: toRemoveIds.length,
    total,
    message:
      toRemoveIds.length || toInsert.length
        ? undefined
        : "Liste zaten güncel",
  });
}
