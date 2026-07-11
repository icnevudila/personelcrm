import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { checkProjectAccess } from "@/lib/keywords/projectAccess";
import { buildGroupCombinations, buildLocationKeywords } from "@/lib/keywords/combinations";
import { expandSeedsAutocomplete } from "@/lib/keywords/autocomplete";
import { insertKeywordCandidates } from "@/lib/keywords/candidates";
import { NextResponse } from "next/server";
import OpenAI from "openai";

async function loadInstallationContext(supabase, projectId) {
  const { data } = await supabase
    .from("installation_forms")
    .select("business_name, sector, services, service_regions, about_text")
    .eq("project_id", projectId)
    .maybeSingle();

  return data || {};
}

async function createJob(supabase, projectId, source, total) {
  const { data } = await supabase
    .from("keyword_generation_jobs")
    .insert({
      project_id: projectId,
      status: "running",
      source,
      total_keywords: total,
      processed_keywords: 0,
    })
    .select()
    .single();
  return data;
}

async function finishJob(supabase, jobId, processed, status = "completed") {
  await supabase
    .from("keyword_generation_jobs")
    .update({
      status,
      processed_keywords: processed,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function runAiKeywords(installation, mode) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY tanımlı değil");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const services = Array.isArray(installation.services)
    ? installation.services.map((s) => s.name || s).join(", ")
    : "";
  const regions = Array.isArray(installation.service_regions)
    ? JSON.stringify(installation.service_regions)
    : "";

  const system =
    mode === "goldmine"
      ? "Sen local SEO uzmanısın. Yüksek dönüşüm potansiyelli Türkçe arama ifadeleri üret. Yanıtı SADECE JSON ver."
      : "Sen keyword araştırma uzmanısın. Local SEO odaklı Türkçe anahtar kelimeler üret. Yanıtı SADECE JSON ver.";

  const user =
    mode === "goldmine"
      ? `İşletme: ${installation.business_name || "—"}. Sektör: ${installation.sector || "—"}. Hizmetler: ${services}. Bölgeler: ${regions}.
Local SEO goldmine: fiyat, acil, soru ve long-tail fırsatları içeren 25-40 keyword üret.
Format: {"keywords":[{"keyword":"...","search_intent":"Commercial|Local|Emergency|Informational","city":"","district":""}]}`
      : `İşletme: ${installation.business_name || "—"}. Sektör: ${installation.sector || "—"}. Hizmetler: ${services}. Bölgeler: ${regions}.
Rakip varyasyonları, soru bazlı, ticari niyet ve blog başlık fırsatları dahil 30-50 keyword üret.
Format: {"keywords":[{"keyword":"...","search_intent":"Commercial|Local|Emergency|Informational|Transactional|Navigational","city":"","district":""}]}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.75,
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed.keywords) ? parsed.keywords : [];
  return list
    .filter((k) => k?.keyword?.trim())
    .map((k) => ({
      keyword: k.keyword.trim(),
      search_intent: k.search_intent,
      city: k.city || null,
      district: k.district || null,
    }));
}

export async function POST(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const { project_id, action } = body;

  if (!project_id || !action) {
    return NextResponse.json({ error: "project_id ve action gerekli" }, { status: 400 });
  }

  const access = await checkProjectAccess(supabase, user, admin, project_id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    if (action === "combinations") {
      const { data: groups } = await supabase
        .from("keyword_groups")
        .select("*, keyword_group_items(*)")
        .eq("project_id", project_id);

      const keywords = buildGroupCombinations(groups || []);
      const job = await createJob(supabase, project_id, "combinations", keywords.length);
      const result = await insertKeywordCandidates(
        supabase,
        project_id,
        keywords,
        "combinations"
      );
      if (job) await finishJob(supabase, job.id, result.inserted);
      return NextResponse.json({ action, ...result, total: keywords.length });
    }

    if (action === "locations") {
      const { cities = [], districts = [], base_terms = [] } = body;
      let terms = base_terms;

      if (!terms?.length) {
        const { data: groups } = await supabase
          .from("keyword_groups")
          .select("*, keyword_group_items(*)")
          .eq("project_id", project_id);
        const firstGroup = groups?.[0];
        terms = (firstGroup?.keyword_group_items || []).map((i) => i.value);
      }

      const installation = await loadInstallationContext(supabase, project_id);
      let cityList = cities;
      let districtList = districts;

      if (!cityList?.length && installation.service_regions) {
        const regions = installation.service_regions;
        if (Array.isArray(regions)) {
          cityList = regions.map((r) => r.city || r.name).filter(Boolean);
          districtList = regions.flatMap((r) => r.districts || []).filter(Boolean);
        }
      }

      const keywords = buildLocationKeywords(terms, cityList, districtList);
      const job = await createJob(supabase, project_id, "locations", keywords.length);
      const result = await insertKeywordCandidates(
        supabase,
        project_id,
        keywords.map((kw) => ({ keyword: kw, search_intent: "Local" })),
        "locations"
      );
      if (job) await finishJob(supabase, job.id, result.inserted);
      return NextResponse.json({ action, ...result, total: keywords.length });
    }

    if (action === "autocomplete") {
      let seeds = body.seeds || [];

      if (!seeds.length) {
        const { data: groups } = await supabase
          .from("keyword_groups")
          .select("*, keyword_group_items(*)")
          .eq("project_id", project_id);
        seeds = buildGroupCombinations(groups || []).slice(0, 6);
      }

      const job = await createJob(supabase, project_id, "google_autocomplete", seeds.length);
      const keywords = await expandSeedsAutocomplete(seeds, 6);
      const result = await insertKeywordCandidates(
        supabase,
        project_id,
        keywords,
        "google_autocomplete"
      );
      if (job) await finishJob(supabase, job.id, result.inserted);
      return NextResponse.json({ action, ...result, seeds_used: seeds.length });
    }

    if (action === "ai_expand" || action === "ai_goldmine") {
      const installation = await loadInstallationContext(supabase, project_id);
      const mode = action === "ai_goldmine" ? "goldmine" : "expand";
      const keywords = await runAiKeywords(installation, mode);
      const source = mode === "goldmine" ? "ai_goldmine" : "ai_expand";
      const job = await createJob(supabase, project_id, source, keywords.length);
      const result = await insertKeywordCandidates(supabase, project_id, keywords, source);
      if (job) await finishJob(supabase, job.id, result.inserted);
      return NextResponse.json({ action, ...result, total: keywords.length });
    }

    if (action === "ai_cluster") {
      const { data: saved } = await supabase
        .from("project_keywords")
        .select("id, keyword, search_intent, cluster_name")
        .eq("project_id", project_id)
        .limit(80);

      if (!saved?.length) {
        return NextResponse.json({ error: "Önce projeye keyword kaydedin" }, { status: 400 });
      }

      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OPENAI_API_KEY tanımlı değil" }, { status: 500 });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Benzer keywordleri Türkçe cluster'lara ayır. SADECE JSON döndür.",
          },
          {
            role: "user",
            content: `Keywords: ${JSON.stringify(saved.map((k) => k.keyword))}
Format: {"clusters":[{"name":"Cluster adı","keywords":["kw1","kw2"]}]}`,
          },
        ],
        temperature: 0.5,
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
      const clusters = Array.isArray(parsed.clusters) ? parsed.clusters : [];
      let created = 0;

      for (const cl of clusters) {
        if (!cl.name || !cl.keywords?.length) continue;
        const { data: clusterRow } = await supabase
          .from("keyword_clusters")
          .insert({
            project_id,
            name: cl.name,
            description: "AI cluster",
          })
          .select()
          .single();

        for (const kwText of cl.keywords) {
          const match = saved.find(
            (s) => s.keyword.toLowerCase() === String(kwText).toLowerCase()
          );
          if (!match) continue;
          await supabase.from("keyword_cluster_items").insert({
            cluster_id: clusterRow.id,
            keyword_id: match.id,
          });
          await supabase
            .from("project_keywords")
            .update({ cluster_name: cl.name })
            .eq("id", match.id);
        }
        created += 1;
      }

      return NextResponse.json({ action, clusters_created: created });
    }

    return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
  } catch (err) {
    console.error("[api/keywords/generate]", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}
