"use client";

import { useState } from "react";
import { SectionCard, inputCls, btnPrimaryCls, labelCls } from "./ui";
import { createMetric, patchMetric, deleteMetric } from "@/lib/productBlueprint/clientApi";

export default function SuccessMetricsSection({ projectId, metrics, onMetricsChange }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const created = await createMetric(projectId, { title: title.trim(), target_value: target });
      onMetricsChange([...metrics, created]);
      setTitle("");
      setTarget("");
    } finally {
      setAdding(false);
    }
  }

  async function toggleComplete(metric) {
    const updated = await patchMetric(projectId, metric.id, { completed: !metric.completed });
    onMetricsChange(metrics.map((m) => (m.id === metric.id ? updated : m)));
  }

  async function updateMetric(metric, field, value) {
    const updated = await patchMetric(projectId, metric.id, { [field]: value });
    onMetricsChange(metrics.map((m) => (m.id === metric.id ? updated : m)));
  }

  async function removeMetric(id) {
    await deleteMetric(projectId, id);
    onMetricsChange(metrics.filter((m) => m.id !== id));
  }

  return (
    <SectionCard title="Success Metrics" description="Başarı hedefleri ve ilerleme takibi">
      <form onSubmit={handleAdd} className="mb-4 flex flex-wrap gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: İlk 100 kullanıcı" className={`${inputCls} min-w-[12rem] flex-1`} />
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Hedef değer" className={`${inputCls} w-32`} />
        <button type="submit" disabled={adding} className={btnPrimaryCls}>Ekle</button>
      </form>
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 ${
              metric.completed
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                : "border-zinc-100 dark:border-zinc-800"
            }`}
          >
            <input type="checkbox" checked={metric.completed} onChange={() => toggleComplete(metric)} className="h-4 w-4" />
            <span className={`flex-1 text-sm font-medium ${metric.completed ? "line-through text-emerald-700 dark:text-emerald-400" : "text-zinc-800 dark:text-zinc-200"}`}>
              {metric.title}
            </span>
            <input
              value={metric.target_value || ""}
              onChange={(e) => updateMetric(metric, "target_value", e.target.value)}
              onBlur={(e) => updateMetric(metric, "target_value", e.target.value)}
              placeholder="Hedef"
              className={`${inputCls} w-24 text-xs`}
            />
            <input
              value={metric.current_value || ""}
              onChange={(e) => updateMetric(metric, "current_value", e.target.value)}
              onBlur={(e) => updateMetric(metric, "current_value", e.target.value)}
              placeholder="Mevcut"
              className={`${inputCls} w-24 text-xs`}
            />
            <button type="button" onClick={() => removeMetric(metric.id)} className="text-xs text-red-500">Sil</button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
