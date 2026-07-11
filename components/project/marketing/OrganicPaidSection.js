"use client";

import { useEffect, useState } from "react";
import { SectionCard, inputCls } from "./ui";
import { patchBlueprint } from "@/lib/marketing/clientApi";

export default function OrganicPaidSection({ projectId, blueprint, onUpdate }) {
  const [organic, setOrganic] = useState(blueprint?.organic_percentage ?? 50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOrganic(blueprint?.organic_percentage ?? 50);
  }, [blueprint]);

  const paid = 100 - Number(organic);

  async function handleOrganicChange(val) {
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    setOrganic(num);
    setSaving(true);
    try {
      const updated = await patchBlueprint(projectId, {
        organic_percentage: num,
        paid_percentage: 100 - num,
      });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Organic / Paid" description="Pazarlama bütçe dağılımı">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Organic</p>
          <div className="mt-2 flex items-end gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={organic}
              onChange={(e) => handleOrganicChange(e.target.value)}
              className={`${inputCls} w-20 text-2xl font-bold`}
            />
            <span className="mb-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">%</span>
          </div>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/50 dark:bg-violet-950/30">
          <p className="text-sm font-medium text-violet-800 dark:text-violet-300">Paid</p>
          <p className="mt-2 text-4xl font-bold text-violet-700 dark:text-violet-400">{paid}%</p>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={organic}
        onChange={(e) => handleOrganicChange(e.target.value)}
        className="mt-4 w-full accent-zinc-900 dark:accent-zinc-100"
      />
      {saving && <p className="mt-2 text-xs text-zinc-400">Kaydediliyor…</p>}
    </SectionCard>
  );
}
