"use client";

import { useState } from "react";
import { SectionCard, inputCls, textareaCls, selectCls, btnPrimaryCls, PriorityBadge, labelCls } from "./ui";
import { PRIORITIES } from "@/lib/productBlueprint/constants";
import { createFeature, patchFeature, deleteFeature } from "@/lib/productBlueprint/clientApi";

export default function CoreFeaturesSection({ projectId, features, onFeaturesChange }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", is_mvp: false });
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setAdding(true);
    try {
      const created = await createFeature(projectId, form);
      onFeaturesChange([...features, created]);
      setForm({ title: "", description: "", priority: "medium", is_mvp: false });
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  }

  async function updateFeature(feature, field, value) {
    const updated = await patchFeature(projectId, feature.id, { [field]: value });
    onFeaturesChange(features.map((f) => (f.id === feature.id ? updated : f)));
  }

  async function removeFeature(id) {
    await deleteFeature(projectId, id);
    onFeaturesChange(features.filter((f) => f.id !== id));
  }

  return (
    <SectionCard
      title="Core Features"
      description="Ürünün ana özellikleri"
      action={
        <button type="button" onClick={() => setShowForm((v) => !v)} className={btnPrimaryCls}>
          {showForm ? "İptal" : "Özellik Ekle"}
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
              <label className={labelCls}>Öncelik</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={selectCls}>
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Açıklama</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaCls} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" checked={form.is_mvp} onChange={(e) => setForm({ ...form, is_mvp: e.target.checked })} />
              MVP özelliği
            </label>
          </div>
          <button type="submit" disabled={adding} className={btnPrimaryCls}>Ekle</button>
        </form>
      )}

      <div className="space-y-2">
        {features.length === 0 && <p className="text-sm text-zinc-400">Henüz özellik eklenmedi.</p>}
        {features.map((feature) => (
          <div key={feature.id} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{feature.title}</p>
                {feature.description && <p className="mt-1 text-sm text-zinc-500">{feature.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={feature.priority} />
                {feature.is_mvp && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">MVP</span>
                )}
                <button type="button" onClick={() => removeFeature(feature.id)} className="text-xs text-red-500">Sil</button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={feature.priority}
                onChange={(e) => updateFeature(feature, "priority", e.target.value)}
                className={`${selectCls} w-auto text-xs`}
              >
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <label className="flex items-center gap-1 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  checked={feature.is_mvp}
                  onChange={(e) => updateFeature(feature, "is_mvp", e.target.checked)}
                />
                MVP
              </label>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
