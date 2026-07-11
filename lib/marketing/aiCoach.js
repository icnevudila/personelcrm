import {
  PLATFORMS,
  CONTENT_CATEGORIES,
  PRODUCT_STAGES,
  LAUNCH_CHECKLIST_ITEMS,
} from "./constants";

const STAGE_IDS = PRODUCT_STAGES.map((s) => s.id);

export const AI_COACH_SYSTEM_PROMPT = `Sen deneyimli bir SaaS ve dijital ürün pazarlama stratejistisin (Marketing OS Coach).
Kullanıcının proje bağlamına ve mevcut marketing blueprint verilerine göre kapsamlı, uygulanabilir bir pazarlama planı üret.

Kurallar:
- Yanıt YALNIZCA geçerli JSON olsun.
- Tüm metinler Türkçe olsun (platform adları ve funnel adımları İngilizce kalabilir).
- marketing_score 0-100 arası gerçekçi olsun.
- organic_percentage + paid_percentage = 100 olmalı.
- stage değerleri: idea, validation, mvp, beta, launch, growth, scale
- priority değerleri: low, medium, high
- Kanal platform adları şunlardan biri olmalı: ${PLATFORMS.join(", ")}
- İçerik kategorileri şunlardan biri olmalı: ${CONTENT_CATEGORIES.join(", ")}
- planned_date YYYY-MM-DD formatında, bugünden sonraki 14 gün içinde olsun.
- Mevcut verileri geliştir; boş alanları doldur; tutarlı strateji öner.
- Görevler somut ve eyleme dönük olsun.

JSON formatı:
{
  "message": "Kısa coaching özeti (2-4 cümle)",
  "marketing_score": 42,
  "score_summary": "Pazarlama olgunluk özeti",
  "score_gaps": ["eksik 1", "eksik 2"],
  "stage": "mvp",
  "target_audience": "...",
  "problem": "...",
  "solution": "...",
  "competitors": "genel rakip özeti",
  "value_proposition": "...",
  "organic_percentage": 60,
  "paid_percentage": 40,
  "funnel_data": {
    "awareness": "...",
    "interest": "...",
    "signup": "...",
    "activation": "...",
    "revenue": "...",
    "referral": "..."
  },
  "reverse_engineering": {
    "product": "...",
    "landing": "...",
    "pricing": "...",
    "ads": "...",
    "seo": "...",
    "content": "...",
    "funnel": "...",
    "notes": "..."
  },
  "notes": "Genel pazarlama notları",
  "channels": [
    { "platform": "SEO", "enabled": true, "priority": "high", "notes": "..." }
  ],
  "content_categories": [
    { "category": "Eğitim", "weekly_target": 2 }
  ],
  "marketing_tasks": [
    {
      "title": "...",
      "description": "...",
      "platform": "LinkedIn",
      "stage": "mvp",
      "priority": "high",
      "assigned_to": "",
      "due_date": "YYYY-MM-DD"
    }
  ],
  "weekly_tasks": [
    {
      "title": "...",
      "description": "...",
      "priority": "medium",
      "assigned_to": "",
      "status": "todo",
      "due_date": "YYYY-MM-DD"
    }
  ],
  "content_calendar": [
    {
      "title": "...",
      "category": "Blog",
      "platform": "LinkedIn",
      "planned_date": "YYYY-MM-DD",
      "status": "planned",
      "notes": ""
    }
  ],
  "competitors_analysis": [
    {
      "competitor_name": "...",
      "website": "",
      "strengths": "...",
      "weaknesses": "...",
      "strategy": "...",
      "notes": ""
    }
  ],
  "launch_checklist_completed": ["Landing Page", "Logo"]
}`;

export function buildAiCoachUserPayload(project, marketingData) {
  const { blueprint, channels, contentCategories, tasks, weeklyTasks, contents, competitors } =
    marketingData;

  return {
    project: {
      name: project.name,
      description: project.description || "",
      type: project.type || "landing_page",
      setup_prompt: project.setup_prompt || "",
    },
    current_blueprint: {
      stage: blueprint.stage,
      marketing_score: blueprint.marketing_score,
      score_summary: blueprint.score_summary,
      score_gaps: blueprint.score_gaps,
      target_audience: blueprint.target_audience,
      problem: blueprint.problem,
      solution: blueprint.solution,
      competitors: blueprint.competitors,
      value_proposition: blueprint.value_proposition,
      organic_percentage: blueprint.organic_percentage,
      paid_percentage: blueprint.paid_percentage,
      funnel_data: blueprint.funnel_data,
      reverse_engineering: blueprint.reverse_engineering,
      notes: blueprint.notes,
    },
    active_channels: channels.filter((c) => c.enabled).map((c) => c.platform),
    existing_tasks_count: tasks.length,
    existing_weekly_tasks_count: weeklyTasks.length,
    existing_contents_count: contents.length,
    existing_competitors: competitors.map((c) => c.competitor_name),
    content_categories_summary: contentCategories.map((c) => ({
      category: c.category,
      weekly_target: c.weekly_target,
    })),
    today: new Date().toISOString().slice(0, 10),
    launch_checklist_options: LAUNCH_CHECKLIST_ITEMS,
  };
}

export function normalizeAiPlan(raw) {
  const organic = Math.min(100, Math.max(0, Number(raw.organic_percentage) || 50));
  const paid = Math.min(100, Math.max(0, Number(raw.paid_percentage) || 100 - organic));
  const organicFinal = organic + paid === 100 ? organic : organic;
  const paidFinal = 100 - organicFinal;

  const stage = STAGE_IDS.includes(raw.stage) ? raw.stage : "idea";

  return {
    message: String(raw.message || "").trim(),
    marketing_score: Math.min(100, Math.max(0, Number(raw.marketing_score) || 0)),
    score_summary: String(raw.score_summary || "").trim(),
    score_gaps: Array.isArray(raw.score_gaps) ? raw.score_gaps.map(String).filter(Boolean).slice(0, 8) : [],
    stage,
    target_audience: String(raw.target_audience || "").trim(),
    problem: String(raw.problem || "").trim(),
    solution: String(raw.solution || "").trim(),
    competitors: String(raw.competitors || "").trim(),
    value_proposition: String(raw.value_proposition || "").trim(),
    organic_percentage: organicFinal,
    paid_percentage: paidFinal,
    funnel_data: raw.funnel_data && typeof raw.funnel_data === "object" ? raw.funnel_data : {},
    reverse_engineering:
      raw.reverse_engineering && typeof raw.reverse_engineering === "object"
        ? raw.reverse_engineering
        : {},
    notes: String(raw.notes || "").trim(),
    channels: Array.isArray(raw.channels) ? raw.channels.slice(0, 20) : [],
    content_categories: Array.isArray(raw.content_categories) ? raw.content_categories.slice(0, 16) : [],
    marketing_tasks: Array.isArray(raw.marketing_tasks) ? raw.marketing_tasks.slice(0, 10) : [],
    weekly_tasks: Array.isArray(raw.weekly_tasks) ? raw.weekly_tasks.slice(0, 8) : [],
    content_calendar: Array.isArray(raw.content_calendar) ? raw.content_calendar.slice(0, 14) : [],
    competitors_analysis: Array.isArray(raw.competitors_analysis)
      ? raw.competitors_analysis.slice(0, 5)
      : [],
    launch_checklist_completed: Array.isArray(raw.launch_checklist_completed)
      ? raw.launch_checklist_completed
      : [],
  };
}
