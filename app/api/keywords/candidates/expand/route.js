import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { expandKeywordWithAlphabet } from "@/lib/keywords/autocomplete";
import { attachKeywordChildren } from "@/lib/keywords/candidates";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { project_id, candidate_id } = await request.json();
  if (!project_id || !candidate_id) {
    return NextResponse.json({ error: "project_id ve candidate_id gerekli" }, { status: 400 });
  }

  const access = await checkProjectAccess(supabase, user, admin, project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data: parent, error: pErr } = await supabase
    .from("keyword_candidates")
    .select("id, keyword, project_id")
    .eq("id", candidate_id)
    .eq("project_id", project_id)
    .single();

  if (pErr || !parent) {
    return NextResponse.json({ error: "Aday bulunamadı" }, { status: 404 });
  }

  try {
    const suggestions = await expandKeywordWithAlphabet(parent.keyword, { includeBase: true });

    const result = await attachKeywordChildren(
      supabase,
      project_id,
      parent.id,
      suggestions,
      "google_autocomplete_expand",
      parent.keyword
    );

    const { data: children, error: chErr } = await supabase
      .from("keyword_candidates")
      .select("*")
      .eq("parent_id", parent.id)
      .order("score", { ascending: false });

    if (chErr && chErr.message?.includes("parent_id")) {
      return NextResponse.json(
        {
          error:
            "parent_id kolonu eksik. Supabase: alter table keyword_candidates add column parent_id uuid references keyword_candidates(id) on delete cascade;",
        },
        { status: 500 }
      );
    }

    const payload = {
      parent_id: parent.id,
      seed: parent.keyword,
      suggestions_found: suggestions.length,
      inserted: result.inserted,
      attached: result.attached,
      already_under_parent: result.alreadyUnderParent,
      children: children || [],
    };

    console.log("[keywords/expand]", payload);

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[api/keywords/candidates/expand]", err);
    return NextResponse.json({ error: err.message || "Genişletme başarısız" }, { status: 500 });
  }
}
