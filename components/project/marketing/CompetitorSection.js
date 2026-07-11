"use client";

import { useState } from "react";
import { SectionCard, inputCls, textareaCls, btnPrimaryCls, btnGhostCls, labelCls } from "./ui";
import { createCompetitor, patchCompetitor, deleteCompetitor } from "@/lib/marketing/clientApi";

function CompetitorCard({ competitor, projectId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...competitor });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await patchCompetitor(projectId, competitor.id, form);
      onUpdate(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{competitor.competitor_name}</h4>
            {competitor.website && (
              <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                {competitor.website}
              </a>
            )}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setEditing(true)} className={btnGhostCls}>Düzenle</button>
            <button type="button" onClick={() => onDelete(competitor.id)} className="text-xs text-red-500 px-2">Sil</button>
          </div>
        </div>
        {competitor.strengths && <p className="mt-2 text-xs text-zinc-500"><strong>Güçlü:</strong> {competitor.strengths}</p>}
        {competitor.weaknesses && <p className="mt-1 text-xs text-zinc-500"><strong>Zayıf:</strong> {competitor.weaknesses}</p>}
        {competitor.strategy && <p className="mt-1 text-xs text-zinc-500"><strong>Strateji:</strong> {competitor.strategy}</p>}
      </div>
    );
  }

  const fields = [
    { key: "competitor_name", label: "Ürün Adı" },
    { key: "website", label: "Website" },
    { key: "strengths", label: "Güçlü Yanlar", textarea: true },
    { key: "weaknesses", label: "Zayıf Yanlar", textarea: true },
    { key: "strategy", label: "Pazarlama Stratejisi", textarea: true },
    { key: "notes", label: "Notlar", textarea: true },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
            <label className={labelCls}>{f.label}</label>
            {f.textarea ? (
              <textarea value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={textareaCls} rows={2} />
            ) : (
              <input value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimaryCls}>Kaydet</button>
        <button type="button" onClick={() => setEditing(false)} className={btnGhostCls}>İptal</button>
      </div>
    </div>
  );
}

export default function CompetitorSection({ projectId, competitors, onCompetitorsChange }) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const created = await createCompetitor(projectId, { competitor_name: name.trim() });
      onCompetitorsChange([created, ...competitors]);
      setName("");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    await deleteCompetitor(projectId, id);
    onCompetitorsChange(competitors.filter((c) => c.id !== id));
  }

  return (
    <SectionCard title="Competitor Analysis" description="Rakip ürünleri analiz edin. İleride AI destekli analiz eklenecek.">
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rakip ürün adı" className={`${inputCls} flex-1`} />
        <button type="submit" disabled={adding} className={btnPrimaryCls}>Ekle</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        {competitors.map((c) => (
          <CompetitorCard
            key={c.id}
            competitor={c}
            projectId={projectId}
            onUpdate={(updated) => onCompetitorsChange(competitors.map((x) => (x.id === updated.id ? updated : x)))}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </SectionCard>
  );
}
