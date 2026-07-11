"use client";

import { useCallback, useState } from "react";
import { SectionCard, SaveIndicator, inputCls, textareaCls, labelCls } from "./ui";
import { useAutoSave } from "./useAutoSave";
import { useBlueprintSync } from "./blueprintFormSync";
import { patchBlueprint } from "@/lib/productBlueprint/clientApi";

function snapshotFromBlueprint(blueprint) {
  return {
    short_description: blueprint?.short_description || "",
    elevator_pitch: blueprint?.elevator_pitch || "",
  };
}

export default function ProductSummarySection({ projectId, projectName, blueprint, onUpdate }) {
  const [form, setForm] = useState({ short_description: "", elevator_pitch: "" });
  const [savedForm, setSavedForm] = useState({ short_description: "", elevator_pitch: "" });

  useBlueprintSync(blueprint, snapshotFromBlueprint, setForm, setSavedForm, savedForm);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const { saveStatus, errorMsg } = useAutoSave(
    isDirty,
    useCallback(async () => {
      const updated = await patchBlueprint(projectId, form);
      onUpdate(updated);
      setSavedForm(form);
    }, [form, projectId, onUpdate])
  );

  return (
    <SectionCard
      title="Product Summary"
      description="Projenin kısa ve net tanımı — Single Source of Truth başlangıç noktası."
      action={<SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />}
    >
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Ürün Adı</label>
          <input value={projectName || ""} readOnly className={`${inputCls} bg-zinc-50 dark:bg-zinc-800/50`} />
          <p className="mt-1 text-xs text-zinc-400">Proje adından alınır. Ayarlar sekmesinden değiştirilebilir.</p>
        </div>
        <div>
          <label className={labelCls}>Kısa Açıklama</label>
          <textarea
            value={form.short_description}
            onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            placeholder="AI destekli restoran QR sipariş sistemi"
            className={textareaCls}
            rows={2}
          />
        </div>
        <div>
          <label className={labelCls}>Elevator Pitch</label>
          <input
            value={form.elevator_pitch}
            onChange={(e) => setForm({ ...form, elevator_pitch: e.target.value })}
            placeholder="Tek cümlelik ürün açıklaması"
            className={inputCls}
          />
        </div>
      </div>
    </SectionCard>
  );
}
