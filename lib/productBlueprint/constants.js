export const ROADMAP_STAGES = [
  { id: "idea", label: "Idea" },
  { id: "validation", label: "Validation" },
  { id: "mvp", label: "MVP" },
  { id: "beta", label: "Beta" },
  { id: "launch", label: "Launch" },
  { id: "growth", label: "Growth" },
  { id: "scale", label: "Scale" },
];

export const PRIORITIES = [
  { id: "low", label: "Düşük" },
  { id: "medium", label: "Orta" },
  { id: "high", label: "Yüksek" },
];

export const USER_TYPES = [
  "Restaurant",
  "Doctor",
  "Agency",
  "Freelancer",
  "Teacher",
  "SMB",
  "Enterprise",
];

export const COMPANY_TYPES = ["SMB", "Enterprise", "Startup", "Agency", "Freelancer"];

export const MONETIZATION_MODELS = [
  { id: "freemium", label: "Freemium" },
  { id: "subscription", label: "Subscription" },
  { id: "lifetime", label: "Lifetime" },
  { id: "enterprise", label: "Enterprise" },
  { id: "marketplace", label: "Marketplace" },
  { id: "commission", label: "Commission" },
  { id: "ads", label: "Ads" },
];

export const TECH_CATEGORIES = [
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "database", label: "Database" },
  { id: "ai", label: "AI" },
  { id: "payment", label: "Payment" },
  { id: "hosting", label: "Hosting" },
  { id: "analytics", label: "Analytics" },
  { id: "other", label: "Diğer" },
];

export const MVP_STAGES = [
  { id: "mvp", label: "MVP'de Olacak" },
  { id: "next_version", label: "Sonraki Versiyon" },
  { id: "future", label: "Gelecek Fikirler" },
];

export const DEFAULT_ICP = {
  user_profile: "",
  company_size: "",
  employee_count: "",
  estimated_budget: "",
  decision_maker: "",
  technical_level: "",
};

export const DEFAULT_MONETIZATION = {
  models: [],
  price_note: "",
};
