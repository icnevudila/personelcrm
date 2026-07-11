"use client";

import { useMemo, useState } from "react";
import { SectionCard, inputCls, textareaCls, selectCls, btnPrimaryCls, PriorityBadge, labelCls } from "./ui";
import { PRODUCT_STAGES, PLATFORMS, TASK_STATUSES, PRIORITIES } from "@/lib/marketing/constants";
import { createTask, patchTask, deleteTask } from "@/lib/marketing/clientApi";

export default function MarketingTasksSection({ projectId, tasks, currentStage, onTasksChange }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    platform: "",
    stage: currentStage || "idea",
    priority: "medium",
    assigned_to: "",
    due_date: "",
    status: "todo",
  });
  const [adding, setAdding] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!currentStage) return tasks;
    return tasks.filter((t) => t.stage === currentStage);
  }, [tasks, currentStage]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setAdding(true);
    try {
      const created = await createTask(projectId, {
        ...form,
        due_date: form.due_date || null,
      });
      onTasksChange([created, ...tasks]);
      setForm({
        title: "",
        description: "",
        platform: "",
        stage: currentStage || "idea",
        priority: "medium",
        assigned_to: "",
        due_date: "",
        status: "todo",
      });
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  }

  async function updateTaskItem(task, field, value) {
    const updated = await patchTask(projectId, task.id, { [field]: value });
    onTasksChange(tasks.map((t) => (t.id === task.id ? updated : t)));
  }

  async function removeTask(taskId) {
    await deleteTask(projectId, taskId);
    onTasksChange(tasks.filter((t) => t.id !== taskId));
  }

  return (
    <SectionCard
      title="Marketing Tasks"
      description={currentStage ? `Aşama filtresi: ${currentStage}` : "Tüm pazarlama görevleri"}
      action={
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimaryCls}>
          {showForm ? "İptal" : "Görev Ekle"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Başlık *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Platform</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={selectCls}>
                <option value="">Seçin</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Açıklama</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaCls} rows={2} />
            </div>
            <div>
              <label className={labelCls}>Aşama</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={selectCls}>
                {PRODUCT_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Öncelik</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={selectCls}>
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Son Tarih</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sorumlu</label>
              <input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={adding} className={btnPrimaryCls}>Oluştur</button>
        </form>
      )}

      <div className="space-y-2">
        {filteredTasks.length === 0 && (
          <p className="text-sm text-zinc-400">Bu aşamada görev yok.</p>
        )}
        {filteredTasks.map((task) => (
          <div key={task.id} className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-3 sm:flex-row sm:items-center dark:border-zinc-800">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
              {task.description && <p className="text-xs text-zinc-500 line-clamp-2">{task.description}</p>}
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                {task.platform && <span>{task.platform}</span>}
                {task.due_date && <span>📅 {task.due_date}</span>}
                {task.assigned_to && <span>👤 {task.assigned_to}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={task.priority} />
              <select
                value={task.status}
                onChange={(e) => updateTaskItem(task, "status", e.target.value)}
                className={`${selectCls} w-auto text-xs`}
              >
                {TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button type="button" onClick={() => removeTask(task.id)} className="text-xs text-red-500 hover:underline">Sil</button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
