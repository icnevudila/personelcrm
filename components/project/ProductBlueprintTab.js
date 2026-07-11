"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBlueprint } from "@/lib/productBlueprint/clientApi";
import ProductSummarySection from "./blueprint/ProductSummarySection";
import TextBlueprintSection from "./blueprint/TextBlueprintSection";
import TargetAudienceSection from "./blueprint/TargetAudienceSection";
import IcpSection from "./blueprint/IcpSection";
import CoreFeaturesSection from "./blueprint/CoreFeaturesSection";
import MvpScopeSection from "./blueprint/MvpScopeSection";
import MonetizationSection from "./blueprint/MonetizationSection";
import SuccessMetricsSection from "./blueprint/SuccessMetricsSection";
import CompetitorsSection from "./blueprint/CompetitorsSection";
import TechStackSection from "./blueprint/TechStackSection";
import RoadmapSection from "./blueprint/RoadmapSection";
import VisionSection from "./blueprint/VisionSection";
import AiProductBriefSection from "./blueprint/AiProductBriefSection";

export default function ProductBlueprintTab({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const json = await fetchBlueprint(projectId);
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
        <p className="text-sm text-zinc-400">Blueprint yükleniyor…</p>
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

  const { project, blueprint, features, successMetrics, competitors, techStack, mvpItems } = data;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Blueprint</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Projenin Single Source of Truth — tüm temel bilgiler, hedefler ve strateji tek yerde.
        </p>
      </div>

      <AiProductBriefSection
        projectId={projectId}
        onBriefGenerated={(result) => {
          setData({
            project: result.project,
            blueprint: result.blueprint,
            features: result.features,
            successMetrics: result.successMetrics,
            competitors: result.competitors,
            techStack: result.techStack,
            mvpItems: result.mvpItems,
          });
        }}
      />

      <ProductSummarySection
        projectId={projectId}
        projectName={project?.name}
        blueprint={blueprint}
        onUpdate={updateBlueprint}
      />
      <TextBlueprintSection
        projectId={projectId}
        blueprint={blueprint}
        onUpdate={updateBlueprint}
        title="Problem"
        description="Bu ürün hangi problemi çözüyor?"
        field="problem"
      />
      <TextBlueprintSection
        projectId={projectId}
        blueprint={blueprint}
        onUpdate={updateBlueprint}
        title="Solution"
        description="Problemi nasıl çözüyoruz?"
        field="solution"
      />
      <TargetAudienceSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <IcpSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <TextBlueprintSection
        projectId={projectId}
        blueprint={blueprint}
        onUpdate={updateBlueprint}
        title="Value Proposition"
        description="Neden bu ürünü tercih etmeliler? Rakiplerden farkımız nedir?"
        field="value_proposition"
      />
      <CoreFeaturesSection
        projectId={projectId}
        features={features}
        onFeaturesChange={(newFeatures) => setData((prev) => ({ ...prev, features: newFeatures }))}
      />
      <MvpScopeSection
        projectId={projectId}
        mvpItems={mvpItems}
        onMvpItemsChange={(newItems) => setData((prev) => ({ ...prev, mvpItems: newItems }))}
      />
      <MonetizationSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <SuccessMetricsSection
        projectId={projectId}
        metrics={successMetrics}
        onMetricsChange={(newMetrics) => setData((prev) => ({ ...prev, successMetrics: newMetrics }))}
      />
      <CompetitorsSection
        projectId={projectId}
        competitors={competitors}
        onCompetitorsChange={(newCompetitors) => setData((prev) => ({ ...prev, competitors: newCompetitors }))}
      />
      <TechStackSection
        projectId={projectId}
        techStack={techStack}
        onTechStackChange={(newStack) => setData((prev) => ({ ...prev, techStack: newStack }))}
      />
      <RoadmapSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
      <VisionSection projectId={projectId} blueprint={blueprint} onUpdate={updateBlueprint} />
    </div>
  );
}
