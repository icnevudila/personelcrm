export const PROJECT_STATUSES = [
  { id: "created", label: "Oluşturuldu" },
  { id: "preparing", label: "Hazırlanıyor" },
  { id: "coding", label: "Kodlanıyor" },
  { id: "completed", label: "Tamamlandı" },
];

export const PROJECT_TYPES = [
  { id: "landing_page", label: "Landing Page" },
  { id: "saas", label: "SaaS" },
  { id: "mobile_app", label: "Mobile App" },
];

export const TYPE_LABEL = Object.fromEntries(PROJECT_TYPES.map((t) => [t.id, t.label]));

export const STATUS_LABEL = Object.fromEntries(PROJECT_STATUSES.map((s) => [s.id, s.label]));

export const TYPE_COLOR = {
  landing_page: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  saas: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  mobile_app: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export const STATUS_COLOR = {
  created: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  preparing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  coding: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export function filterProjects(projects, { status, type } = {}) {
  return projects.filter((p) => {
    if (status && p.status !== status) return false;
    if (type && p.type !== type) return false;
    return true;
  });
}
