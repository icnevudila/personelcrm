import {
  ROADMAP_STAGES,
  USER_TYPES,
  COMPANY_TYPES,
  MONETIZATION_MODELS,
  TECH_CATEGORIES,
  DEFAULT_ICP,
  DEFAULT_MONETIZATION,
} from "./constants";

const STAGE_IDS = ROADMAP_STAGES.map((s) => s.id);
const USER_TYPE_SET = new Set(USER_TYPES);
const COMPANY_TYPE_SET = new Set(COMPANY_TYPES);
const MONETIZATION_IDS = new Set(MONETIZATION_MODELS.map((m) => m.id));
const TECH_CATEGORY_IDS = new Set(TECH_CATEGORIES.map((c) => c.id));
const MVP_STAGES = ["mvp", "next_version", "future"];

export const AI_BRIEF_SYSTEM_PROMPT = `Sen deneyimli bir ürün stratejisti ve Product Blueprint uzmanısın.
Kullanıcının proje bağlamına ve mevcut blueprint verilerine göre kapsamlı, uygulanabilir bir ürün blueprint'i üret.

Kurallar:
- Yanıt YALNIZCA geçerli JSON olsun.
- Tüm metinler Türkçe olsun.
- roadmap_stage: idea, validation, mvp, beta, launch, growth, scale
- priority: low, medium, high
- user_type şunlardan biri olmalı: ${USER_TYPES.join(", ")} (veya boş string)
- company_type şunlardan biri: ${COMPANY_TYPES.join(", ")} (veya boş string)
- monetization models id: ${MONETIZATION_MODELS.map((m) => m.id).join(", ")}
- tech_stack category: ${TECH_CATEGORIES.map((c) => c.id).join(", ")}
- mvp_items stage: mvp, next_version, future
- Mevcut verileri geliştir; boş alanları doldur; tutarlı ürün stratejisi öner.
- Özellikler ve MVP maddeleri somut ve eyleme dönük olsun.

JSON formatı:
{
  "message": "Kısa özet (2-4 cümle)",
  "short_description": "...",
  "elevator_pitch": "...",
  "problem": "...",
  "solution": "...",
  "target_audience": "...",
  "industry": "...",
  "country": "...",
  "user_type": "SMB",
  "company_type": "Startup",
  "ideal_customer_profile": {
    "user_profile": "...",
    "company_size": "...",
    "employee_count": "...",
    "estimated_budget": "...",
    "decision_maker": "...",
    "technical_level": "..."
  },
  "value_proposition": "...",
  "monetization_model": {
    "models": ["freemium", "subscription"],
    "price_note": "..."
  },
  "roadmap_stage": "mvp",
  "vision": "...",
  "mission": "...",
  "long_term_goal": "...",
  "features": [
    { "title": "...", "description": "...", "priority": "high", "is_mvp": true }
  ],
  "mvp_items": [
    { "title": "...", "description": "...", "stage": "mvp" }
  ],
  "success_metrics": [
    { "title": "İlk 100 kullanıcı", "target_value": "100", "current_value": "0" }
  ],
  "competitors": [
    {
      "competitor_name": "...",
      "website": "",
      "strengths": "...",
      "weaknesses": "...",
      "differentiation": "...",
      "notes": ""
    }
  ],
  "tech_stack": [
    { "technology": "Next.js", "category": "frontend" }
  ]
}`;

export function buildAiBriefUserPayload(project, blueprintData) {
  const { blueprint, features, successMetrics, competitors, techStack, mvpItems } = blueprintData;

  return {
    project: {
      name: project.name,
      description: project.description || "",
      type: project.type || "landing_page",
      setup_prompt: project.setup_prompt || "",
    },
    current_blueprint: blueprint,
    existing_features_count: features.length,
    existing_mvp_items_count: mvpItems.length,
    existing_competitors: competitors.map((c) => c.competitor_name),
    existing_tech: techStack.map((t) => t.technology),
    existing_metrics_count: successMetrics.length,
  };
}

export function normalizeAiBrief(raw) {
  const icp = { ...DEFAULT_ICP, ...(raw.ideal_customer_profile || {}) };
  const monetization = {
    ...DEFAULT_MONETIZATION,
    ...(raw.monetization_model || {}),
    models: Array.isArray(raw.monetization_model?.models)
      ? raw.monetization_model.models.filter((m) => MONETIZATION_IDS.has(m))
      : [],
  };

  return {
    message: String(raw.message || "").trim(),
    short_description: String(raw.short_description || "").trim(),
    elevator_pitch: String(raw.elevator_pitch || "").trim(),
    problem: String(raw.problem || "").trim(),
    solution: String(raw.solution || "").trim(),
    target_audience: String(raw.target_audience || "").trim(),
    industry: String(raw.industry || "").trim(),
    country: String(raw.country || "").trim(),
    user_type: USER_TYPE_SET.has(raw.user_type) ? raw.user_type : String(raw.user_type || ""),
    company_type: COMPANY_TYPE_SET.has(raw.company_type) ? raw.company_type : String(raw.company_type || ""),
    ideal_customer_profile: icp,
    value_proposition: String(raw.value_proposition || "").trim(),
    monetization_model: monetization,
    roadmap_stage: STAGE_IDS.includes(raw.roadmap_stage) ? raw.roadmap_stage : "idea",
    vision: String(raw.vision || "").trim(),
    mission: String(raw.mission || "").trim(),
    long_term_goal: String(raw.long_term_goal || "").trim(),
    features: Array.isArray(raw.features) ? raw.features.slice(0, 12) : [],
    mvp_items: Array.isArray(raw.mvp_items) ? raw.mvp_items.slice(0, 15) : [],
    success_metrics: Array.isArray(raw.success_metrics) ? raw.success_metrics.slice(0, 8) : [],
    competitors: Array.isArray(raw.competitors) ? raw.competitors.slice(0, 5) : [],
    tech_stack: Array.isArray(raw.tech_stack) ? raw.tech_stack.slice(0, 15) : [],
  };
}

export function validPriority(p) {
  return ["low", "medium", "high"].includes(p) ? p : "medium";
}

export function validMvpStage(s) {
  return MVP_STAGES.includes(s) ? s : "mvp";
}

export function validTechCategory(c) {
  return TECH_CATEGORY_IDS.has(c) ? c : "other";
}
