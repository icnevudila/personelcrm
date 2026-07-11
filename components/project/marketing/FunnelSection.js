"use client";

import { useEffect, useState } from "react";
import { SectionCard, textareaCls, labelCls, btnPrimaryCls } from "./ui";
import { FUNNEL_STEPS } from "@/lib/marketing/constants";
import { patchBlueprint } from "@/lib/marketing/clientApi";

export default function FunnelSection({ projectId, blueprint, onUpdate }) {
  const [funnel, setFunnel] = useState(blueprint?.funnel_data || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFunnel(blueprint?.funnel_data || {});
  }, [blueprint]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await patchBlueprint(projectId, { funnel_data: funnel });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="Marketing Funnel"
      action={
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimaryCls}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      }
    >
      <div className="flex flex-col items-center gap-2">
        {FUNNEL_STEPS.map((step, index) => (
          <div key={step.key} className="w-full max-w-md">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <label className={labelCls}>{step.label}</label>
              <textarea
                value={funnel[step.key] || ""}
                onChange={(e) => setFunnel((prev) => ({ ...prev, [step.key]: e.target.value }))}
                placeholder={`${step.label} açıklaması…`}
                className={textareaCls}
                rows={2}
              />
            </div>
            {index < FUNNEL_STEPS.length - 1 && (
              <div className="flex justify-center py-1 text-zinc-300 dark:text-zinc-600">↓</div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
