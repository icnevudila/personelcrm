"use client";

import { SectionCard } from "./ui";
import { patchLaunchItem } from "@/lib/marketing/clientApi";

export default function LaunchChecklistSection({ projectId, items, onItemUpdate }) {
  const completed = items.filter((i) => i.completed).length;

  async function toggle(item) {
    const updated = await patchLaunchItem(projectId, item.id, { completed: !item.completed });
    onItemUpdate(updated);
  }

  return (
    <SectionCard
      title="Launch Checklist"
      description={`${completed} / ${items.length} tamamlandı`}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
              item.completed
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                : "border-zinc-100 dark:border-zinc-800"
            }`}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggle(item)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            <span className={`text-sm ${item.completed ? "text-emerald-700 line-through dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}>
              {item.item_name}
            </span>
          </label>
        ))}
      </div>
    </SectionCard>
  );
}
