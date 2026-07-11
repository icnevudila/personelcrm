"use client";

import DashboardGoals from "@/components/dashboard/DashboardGoals";
import { getTabsForProjectType, TabIcon } from "@/components/project/ProjectNavSidebar";

const STATUS_LABEL = {
  created: "Oluşturuldu",
  preparing: "Hazırlanıyor",
  coding: "Kodlanıyor",
  completed: "Tamamlandı",
};

const QUICK_LINKS = [
  "todo-list",
  "roadmap",
  "mvp-features",
  "installation",
  "domain",
  "pages",
  "logo",
  "db-schema-planner",
  "settings",
];

export default function ProjectOverviewTab({ project, onNavigate }) {
  const domainCount = project.domains?.length || 0;
  const pageCount = project.site_pages?.length || 0;
  const primaryDomain = project.domains?.find((d) => d.is_primary)?.domain;
  const availableTabs = getTabsForProjectType(project.type || "landing_page");
  const quickLinks = QUICK_LINKS.filter((key) => availableTabs.some((t) => t.key === key));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Proje Özeti</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Genel bilgiler ve hızlı erişim. Sol menüden tüm modüllere ulaşabilirsiniz.
        </p>
      </div>

      <DashboardGoals
        apiBase={`/api/projects/${project.id}/goals`}
        title="Proje Hedefleri"
        description="Bu projenin öncelikli hedeflerini ve ilerlemeyi burada takip et."
        compact
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Ödeme</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {project.payment_status === "paid" ? "Ödendi" : "Beklemede"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Durum</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {STATUS_LABEL[project.status] || project.status || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Domain</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {domainCount > 0 ? `${domainCount} kayıt` : "Henüz yok"}
          </p>
          {primaryDomain && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{primaryDomain}</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Sayfalar</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {pageCount > 0 ? `${pageCount} sayfa` : "Henüz yok"}
          </p>
        </div>
      </div>

      {project.description && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Açıklama</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {project.description}
          </p>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Hızlı erişim</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {quickLinks.map((key) => {
            const tab = availableTabs.find((t) => t.key === key);
            if (!tab) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onNavigate(key)}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <TabIcon tabKey={key} className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {project.created_at && (
        <p className="text-xs text-zinc-400">
          Oluşturulma: {new Date(project.created_at).toLocaleDateString("tr-TR", { dateStyle: "long" })}
        </p>
      )}
    </div>
  );
}
