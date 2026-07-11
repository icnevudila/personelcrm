"use client";

import { useEffect, useState } from "react";
import { SectionCard, inputCls, btnPrimaryCls } from "./ui";
import { KPI_FIELDS } from "@/lib/marketing/constants";
import { patchKpis } from "@/lib/marketing/clientApi";

export default function KpiSection({ projectId, kpis, onKpisUpdate }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!kpis) return;
    const initial = {};
    for (const f of KPI_FIELDS) {
      initial[f.key] = kpis[f.key] ?? 0;
    }
    setForm(initial);
  }, [kpis]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await patchKpis(projectId, form);
      onKpisUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="KPI Dashboard"
      description="Metrikleri manuel olarak girin ve takip edin."
      action={
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimaryCls}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KPI_FIELDS.map((f) => (
          <div key={f.key} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
            <label className="text-xs font-medium text-zinc-500">{f.label}</label>
            <input
              type="number"
              min={0}
              step={f.key === "conversion_rate" || f.key === "mrr" || f.key === "cac" || f.key === "ltv" ? "0.01" : "1"}
              value={form[f.key] ?? 0}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className={`${inputCls} mt-1 text-lg font-semibold`}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
