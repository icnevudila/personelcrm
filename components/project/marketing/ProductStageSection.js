"use client";

import { PRODUCT_STAGES } from "@/lib/marketing/constants";
import { SectionCard } from "./ui";
import { patchBlueprint } from "@/lib/marketing/clientApi";

export default function ProductStageSection({ projectId, blueprint, onUpdate }) {
  const stage = blueprint?.stage || "idea";

  async function handleStageChange(newStage) {
    const updated = await patchBlueprint(projectId, { stage: newStage });
    onUpdate(updated);
  }

  return (
    <SectionCard title="Product Stage" description="Projenin bulunduğu aşamayı seçin. Görevler bu aşamaya göre filtrelenebilir.">
      <div className="flex flex-wrap gap-2">
        {PRODUCT_STAGES.map((s) => {
          const active = stage === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStageChange(s.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        Aktif aşama: <span className="font-medium text-zinc-600 dark:text-zinc-300">{PRODUCT_STAGES.find((s) => s.id === stage)?.label}</span>
      </p>
    </SectionCard>
  );
}
