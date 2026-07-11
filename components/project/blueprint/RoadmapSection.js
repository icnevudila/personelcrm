"use client";

import { useState } from "react";
import { SectionCard, SaveIndicator } from "./ui";
import { ROADMAP_STAGES } from "@/lib/productBlueprint/constants";
import { patchBlueprint } from "@/lib/productBlueprint/clientApi";

export default function RoadmapSection({ projectId, blueprint, onUpdate }) {
  const stage = blueprint?.roadmap_stage || "idea";
  const [saveStatus, setSaveStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleStageChange(newStage) {
    if (newStage === stage) return;
    setSaveStatus("saving");
    setErrorMsg("");
    try {
      const updated = await patchBlueprint(projectId, { roadmap_stage: newStage });
      onUpdate(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <SectionCard
      title="Roadmap"
      description="Projenin bulunduğu aşama"
      action={<SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />}
    >
      <div className="flex flex-col items-center gap-1">
        {ROADMAP_STAGES.map((s, index) => {
          const active = stage === s.id;
          const passed = ROADMAP_STAGES.findIndex((x) => x.id === stage) >= index;
          return (
            <div key={s.id} className="w-full max-w-xs">
              <button
                type="button"
                onClick={() => handleStageChange(s.id)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : passed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {s.label}
              </button>
              {index < ROADMAP_STAGES.length - 1 && (
                <div className="flex justify-center py-0.5 text-zinc-300 dark:text-zinc-600">↓</div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
