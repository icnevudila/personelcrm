"use client";

import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/deep-work/constants";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { formatMinutes } from "@/lib/deep-work/dateUtils";

export default function TaskCard({ task, actions, draggable, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isOver }) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900 ${
        isDragging ? "opacity-50" : ""
      } ${isOver ? "ring-2 ring-zinc-300 dark:ring-zinc-600" : ""}`}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <span className="mt-0.5 cursor-grab text-zinc-300 active:cursor-grabbing dark:text-zinc-600" aria-hidden>
            ⠿
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{task.title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.normal}`}>
              {PRIORITY_LABELS[task.priority] || task.priority}
            </span>
          </div>
          {task.description && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
            {task.estimated_minutes > 0 && <span>Tahmini: {formatMinutes(task.estimated_minutes)}</span>}
            {task.worked_minutes > 0 && <span>Çalışılan: {formatMinutes(task.worked_minutes)}</span>}
            {task.projects?.name && <span>{task.projects.name}</span>}
            <span>{formatRelativeTime(task.created_at)}</span>
            {task.completed_at && <span>Tamamlandı: {formatRelativeTime(task.completed_at)}</span>}
          </div>
        </div>
      </div>
      {actions && <div className="mt-2 flex flex-wrap gap-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-800">{actions}</div>}
    </div>
  );
}

export const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export function TaskFormFields({ form, setForm, projects }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Başlık</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className={inputCls}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Açıklama</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className={`${inputCls} resize-none`}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tahmini süre (dk)</label>
          <input
            type="number"
            min={0}
            value={form.estimated_minutes}
            onChange={(e) => setForm((p) => ({ ...p, estimated_minutes: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Öncelik</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
            className={inputCls}
          >
            <option value="low">Düşük</option>
            <option value="normal">Normal</option>
            <option value="high">Yüksek</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Proje</label>
          <select
            value={form.project_id}
            onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}
            className={inputCls}
          >
            <option value="">Proje yok</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
