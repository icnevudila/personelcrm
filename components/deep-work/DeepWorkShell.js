"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { DEEP_WORK_TABS } from "@/lib/deep-work/constants";
import { DeepWorkProvider, useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import DeepWorkDashboardTab from "@/components/deep-work/DeepWorkDashboardTab";
import InboxTab from "@/components/deep-work/InboxTab";
import KanbanTab from "@/components/deep-work/KanbanTab";
import DailyPlanTab from "@/components/deep-work/DailyPlanTab";
import CalendarTab from "@/components/deep-work/CalendarTab";
import StatsTab from "@/components/deep-work/StatsTab";
import ArchiveTab from "@/components/deep-work/ArchiveTab";
import DailyReviewTab from "@/components/deep-work/DailyReviewTab";

const TAB_COMPONENTS = {
  dashboard: DeepWorkDashboardTab,
  inbox: InboxTab,
  kanban: KanbanTab,
  plan: DailyPlanTab,
  calendar: CalendarTab,
  stats: StatsTab,
  archive: ArchiveTab,
  review: DailyReviewTab,
};

function DeepWorkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, error } = useDeepWork();

  const tabParam = searchParams.get("tab");
  const activeTab = TAB_COMPONENTS[tabParam] ? tabParam : "dashboard";
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  function setTab(key) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (tabParam && !TAB_COMPONENTS[tabParam]) {
      setTab("dashboard");
    }
  }, [tabParam]);

  if (loading) {
    return <p className="py-12 text-center text-sm text-zinc-400">Deep Work yükleniyor…</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
        {DEEP_WORK_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <ActiveComponent />
    </div>
  );
}

export default function DeepWorkShell() {
  return (
    <DeepWorkProvider>
      <Suspense fallback={<p className="py-12 text-center text-sm text-zinc-400">Yükleniyor…</p>}>
        <DeepWorkContent />
      </Suspense>
    </DeepWorkProvider>
  );
}
