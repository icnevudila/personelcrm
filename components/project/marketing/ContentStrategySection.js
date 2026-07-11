"use client";

import { SectionCard, inputCls } from "./ui";
import { patchContentCategory } from "@/lib/marketing/clientApi";

export default function ContentStrategySection({ projectId, categories, onCategoryUpdate }) {
  async function handleTargetChange(cat, value) {
    const target = Math.max(0, Number(value) || 0);
    const updated = await patchContentCategory(projectId, cat.id, { weekly_target: target });
    onCategoryUpdate(updated);
  }

  const totalWeekly = categories.reduce((sum, c) => sum + (c.weekly_target || 0), 0);

  return (
    <SectionCard
      title="Content Strategy"
      description={`Haftalık toplam hedef: ${totalWeekly} içerik`}
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
          >
            <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">{cat.category}</span>
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min={0}
                value={cat.weekly_target}
                onChange={(e) => handleTargetChange(cat, e.target.value)}
                className={`${inputCls} w-14 text-center`}
              />
              <span className="text-xs text-zinc-400">/hafta</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
