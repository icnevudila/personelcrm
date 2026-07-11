"use client";

import { useState } from "react";
import { SectionCard, inputCls, textareaCls, btnPrimaryCls, PriorityBadge, labelCls } from "./ui";
import { WEEKLY_STATUSES, PRIORITIES } from "@/lib/marketing/constants";
import { createWeeklyTask, patchWeeklyTask, deleteWeeklyTask } from "@/lib/marketing/clientApi";

export default function WeeklyPlanSection({ projectId, weeklyTasks, onWeeklyTasksChange }) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const columns = WEEKLY_STATUSES.map((col) => ({
    ...col,
    tasks: weeklyTasks.filter((t) => t.status === col.id),
  }));

  async function handleAdd(e, status = "todo") {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const created = await createWeeklyTask(projectId, { title: newTitle.trim(), status });
      onWeeklyTasksChange([...weeklyTasks, created]);
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  }

  async function moveTask(task, newStatus) {
    const updated = await patchWeeklyTask(projectId, task.id, { status: newStatus });
    onWeeklyTasksChange(weeklyTasks.map((t) => (t.id === task.id ? updated : t)));
  }

  async function updateTask(task, field, value) {
    const updated = await patchWeeklyTask(projectId, task.id, { [field]: value });
    onWeeklyTasksChange(weeklyTasks.map((t) => (t.id === task.id ? updated : t)));
  }

  async function removeTask(taskId) {
    await deleteWeeklyTask(projectId, taskId);
    onWeeklyTasksChange(weeklyTasks.filter((t) => t.id !== taskId));
  }

  return (
    <SectionCard title="Weekly Marketing Plan" description="Haftalık yapılacaklar — Kanban görünümü">
      <form onSubmit={(e) => handleAdd(e)} className="mb-4 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Yeni görev…"
          className={`${inputCls} flex-1`}
        />
        <button type="submit" disabled={adding} className={btnPrimaryCls}>Ekle</button>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        {columns.map((col) => (
          <div key={col.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/30">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{col.label}</h4>
            <div className="space-y-2">
              {col.tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <input
                    value={task.title}
                    onChange={(e) => updateTask(task, "title", e.target.value)}
                    className="w-full border-0 bg-transparent text-sm font-medium text-zinc-900 focus:outline-none dark:text-zinc-100"
                  />
                  <textarea
                    value={task.description || ""}
                    onChange={(e) => updateTask(task, "description", e.target.value)}
                    onBlur={(e) => updateTask(task, "description", e.target.value)}
                    placeholder="Açıklama"
                    className="mt-1 w-full resize-none border-0 bg-transparent text-xs text-zinc-500 focus:outline-none"
                    rows={2}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <input
                      type="date"
                      value={task.due_date || ""}
                      onChange={(e) => updateTask(task, "due_date", e.target.value || null)}
                      className="rounded border border-zinc-200 px-1 py-0.5 text-[10px] dark:border-zinc-700"
                    />
                    <input
                      value={task.assigned_to || ""}
                      onChange={(e) => updateTask(task, "assigned_to", e.target.value)}
                      onBlur={(e) => updateTask(task, "assigned_to", e.target.value)}
                      placeholder="Sorumlu"
                      className="flex-1 min-w-[4rem] rounded border border-zinc-200 px-1 py-0.5 text-[10px] dark:border-zinc-700"
                    />
                  </div>
                  <div className="mt-2 flex gap-1">
                    {WEEKLY_STATUSES.filter((s) => s.id !== col.id).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => moveTask(task, s.id)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        → {s.label}
                      </button>
                    ))}
                    <button type="button" onClick={() => removeTask(task.id)} className="ml-auto text-[10px] text-red-500">
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
