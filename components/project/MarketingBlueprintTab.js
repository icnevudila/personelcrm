"use client";

import { useCallback, useEffect, useState } from "react";
import { marketingFetch } from "@/lib/marketing/clientApi";
import MarketingScoreSection from "./marketing/MarketingScoreSection";
import ProductStageSection from "./marketing/ProductStageSection";
import TargetAudienceSection from "./marketing/TargetAudienceSection";
import ChannelsSection from "./marketing/ChannelsSection";
import OrganicPaidSection from "./marketing/OrganicPaidSection";
import ContentStrategySection from "./marketing/ContentStrategySection";
import ContentCalendarSection from "./marketing/ContentCalendarSection";
import FunnelSection from "./marketing/FunnelSection";
import LaunchChecklistSection from "./marketing/LaunchChecklistSection";
import WeeklyPlanSection from "./marketing/WeeklyPlanSection";
import MarketingTasksSection from "./marketing/MarketingTasksSection";
import CompetitorSection from "./marketing/CompetitorSection";
import KpiSection from "./marketing/KpiSection";
import AiCoachSection from "./marketing/AiCoachSection";
import ReverseEngineeringSection from "./marketing/ReverseEngineeringSection";

export default function MarketingBlueprintTab({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const res = await marketingFetch(projectId, "");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Veri yüklenemedi");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateBlueprint(blueprint) {
    setData((prev) => ({ ...prev, blueprint }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-zinc-400">Marketing Blueprint yükleniyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-600">{error}</p>
        <button type="button" onClick={loadData} className="mt-3 text-sm font-medium text-red-700 underline">
          Tekrar dene
        </button>
      </div>
    );
  }

  const { blueprint, channels, contentCategories, contents, tasks, weeklyTasks, launchChecklist, competitors, kpis } = data;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Marketing Blueprint</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ürününüzün pazarlama operasyonlarını tek ekrandan yönetin — fikirden büyümeye.
        </p>
      </div>

      <MarketingScoreSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <AiCoachSection
        projectId={projectId}
        onPlanGenerated={(result) => {
          setData({
            blueprint: result.blueprint,
            channels: result.channels,
            contentCategories: result.contentCategories,
            contents: result.contents,
            tasks: result.tasks,
            weeklyTasks: result.weeklyTasks,
            launchChecklist: result.launchChecklist,
            competitors: result.competitors,
            kpis: result.kpis,
          });
        }}
      />
      <ProductStageSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <TargetAudienceSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <ChannelsSection
        projectId={projectId}
        channels={channels}
        onChannelUpdate={(updated) =>
          setData((prev) => ({
            ...prev,
            channels: prev.channels.map((c) => (c.id === updated.id ? updated : c)),
          }))
        }
      />
      <OrganicPaidSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <ContentStrategySection
        projectId={projectId}
        categories={contentCategories}
        onCategoryUpdate={(updated) =>
          setData((prev) => ({
            ...prev,
            contentCategories: prev.contentCategories.map((c) => (c.id === updated.id ? updated : c)),
          }))
        }
      />
      <ContentCalendarSection
        projectId={projectId}
        contents={contents}
        onContentsChange={(newContents) => setData((prev) => ({ ...prev, contents: newContents }))}
      />
      <FunnelSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <LaunchChecklistSection
        projectId={projectId}
        items={launchChecklist}
        onItemUpdate={(updated) =>
          setData((prev) => ({
            ...prev,
            launchChecklist: prev.launchChecklist.map((i) => (i.id === updated.id ? updated : i)),
          }))
        }
      />
      <WeeklyPlanSection
        projectId={projectId}
        weeklyTasks={weeklyTasks}
        onWeeklyTasksChange={(newTasks) => setData((prev) => ({ ...prev, weeklyTasks: newTasks }))}
      />
      <MarketingTasksSection
        projectId={projectId}
        tasks={tasks}
        currentStage={blueprint?.stage}
        onTasksChange={(newTasks) => setData((prev) => ({ ...prev, tasks: newTasks }))}
      />
      <CompetitorSection
        projectId={projectId}
        competitors={competitors}
        onCompetitorsChange={(newCompetitors) => setData((prev) => ({ ...prev, competitors: newCompetitors }))}
      />
      <KpiSection
        projectId={projectId}
        kpis={kpis}
        onKpisUpdate={(updated) => setData((prev) => ({ ...prev, kpis: updated }))}
      />
      <ReverseEngineeringSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
    </div>
  );
}
