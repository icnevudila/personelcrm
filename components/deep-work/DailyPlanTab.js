"use client";

import { useMemo, useState } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import { formatMinutes } from "@/lib/deep-work/dateUtils";

export default function DailyPlanTab() {
  const { tasks, settings, patchTask } = useDeepWork();
  const [saving, setSaving] = useState(false);

  const candidates = useMemo(
    () => tasks.filter((t) => t.status !== "done" && t.status !== "archive"),
    [tasks]
  );

  const selected = useMemo(() => tasks.filter((t) => t.is_today_plan), [tasks]);
  const totalEstimated = selected.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
  const goal = settings?.daily_goal_minutes || 120;

  async function togglePlan(task) {
    setSaving(true);
    try {
      await patchTask(task.id, { is_today_plan: !task.is_today_plan });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Günlük Plan</h3>
            <p className="text-sm text-zinc-500">Bugün odaklanacağınız görevleri seçin.</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{formatMinutes(totalEstimated)}</p>
            <p className="text-xs text-zinc-500">Hedef: {goal} dk</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full ${totalEstimated > goal ? "bg-amber-500" : "bg-zinc-900 dark:bg-zinc-100"}`}
            style={{ width: `${Math.min(100, (totalEstimated / goal) * 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {candidates.length === 0 ? (
          <p className="text-sm text-zinc-500">Planlanacak görev yok. Inbox veya Kanban'dan ekleyin.</p>
        ) : (
          candidates.map((task) => {
            const checked = task.is_today_plan;
            return (
              <label
                key={task.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  checked
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={saving}
                  onChange={() => togglePlan(task)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{task.title}</p>
                  {task.projects?.name && (
                    <p className="text-xs text-zinc-500">{task.projects.name}</p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {formatMinutes(task.estimated_minutes || 0)}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
