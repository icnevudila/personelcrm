"use client";

import { useCallback, useState } from "react";
import { SectionCard, SaveIndicator, textareaCls, labelCls } from "./ui";
import { useAutoSave } from "./useAutoSave";
import { useBlueprintSync } from "./blueprintFormSync";
import { MONETIZATION_MODELS, DEFAULT_MONETIZATION } from "@/lib/productBlueprint/constants";
import { patchBlueprint } from "@/lib/productBlueprint/clientApi";

export default function MonetizationSection({ projectId, blueprint, onUpdate }) {
  const [data, setData] = useState(DEFAULT_MONETIZATION);
  const [savedData, setSavedData] = useState(DEFAULT_MONETIZATION);

  useBlueprintSync(
    blueprint,
    useCallback((bp) => ({ ...DEFAULT_MONETIZATION, ...(bp.monetization_model || {}) }), []),
    setData,
    setSavedData,
    savedData
  );

  const isDirty = JSON.stringify(data) !== JSON.stringify(savedData);

  const { saveStatus, errorMsg } = useAutoSave(
    isDirty,
    useCallback(async () => {
      const updated = await patchBlueprint(projectId, { monetization_model: data });
      onUpdate(updated);
      setSavedData(data);
    }, [data, projectId, onUpdate])
  );

  function toggleModel(id) {
    setData((prev) => {
      const models = prev.models || [];
      const next = models.includes(id) ? models.filter((m) => m !== id) : [...models, id];
      return { ...prev, models: next };
    });
  }

  return (
    <SectionCard
      title="Monetization"
      description="Gelir modeli — birden fazla seçim yapılabilir."
      action={<SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />}
    >
      <div className="flex flex-wrap gap-2">
        {MONETIZATION_MODELS.map((m) => {
          const active = (data.models || []).includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleModel(m.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <label className={labelCls}>Fiyat Notu</label>
        <textarea
          value={data.price_note || ""}
          onChange={(e) => setData({ ...data, price_note: e.target.value })}
          placeholder="Fiyatlandırma stratejisi, planlar, notlar…"
          className={textareaCls}
          rows={3}
        />
      </div>
    </SectionCard>
  );
}
