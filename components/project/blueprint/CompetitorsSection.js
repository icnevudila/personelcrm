"use client";

import { useCallback, useState } from "react";
import { SectionCard, SaveIndicator, inputCls, textareaCls, btnPrimaryCls, labelCls } from "./ui";
import { useAutoSave } from "./useAutoSave";
import { useBlueprintSync } from "./blueprintFormSync";
import { createCompetitor, patchCompetitor, deleteCompetitor } from "@/lib/productBlueprint/clientApi";

function competitorSnapshot(competitor) {
  return {
    competitor_name: competitor.competitor_name || "",
    website: competitor.website || "",
    strengths: competitor.strengths || "",
    weaknesses: competitor.weaknesses || "",
    differentiation: competitor.differentiation || "",
    notes: competitor.notes || "",
  };
}

function CompetitorCard({ competitor, projectId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(competitorSnapshot(competitor));
  const [savedForm, setSavedForm] = useState(competitorSnapshot(competitor));

  useBlueprintSync(competitor, competitorSnapshot, setForm, setSavedForm, savedForm);

  const isDirty = editing && JSON.stringify(form) !== JSON.stringify(savedForm);

  const { saveStatus, errorMsg } = useAutoSave(
    isDirty,
    useCallback(async () => {
      const updated = await patchCompetitor(projectId, competitor.id, form);
      onUpdate(updated);
      setSavedForm(form);
    }, [form, competitor.id, projectId, onUpdate])
  );

  const fields = [
    { key: "competitor_name", label: "Rakip Adı" },
    { key: "website", label: "Website" },
    { key: "strengths", label: "Güçlü Yanları", textarea: true },
    { key: "weaknesses", label: "Zayıf Yanları", textarea: true },
    { key: "differentiation", label: "Bizim Farkımız", textarea: true },
    { key: "notes", label: "Notlar", textarea: true },
  ];

  if (!editing) {
    return (
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{competitor.competitor_name}</h4>
            {competitor.website && (
              <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">{competitor.website}</a>
            )}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-zinc-500 hover:underline">Düzenle</button>
            <button type="button" onClick={() => onDelete(competitor.id)} className="text-xs text-red-500">Sil</button>
          </div>
        </div>
        {competitor.differentiation && <p className="mt-2 text-xs text-zinc-500"><strong>Fark:</strong> {competitor.differentiation}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="mb-3 flex justify-end">
        <SaveIndicator saveStatus={saveStatus} errorMsg={errorMsg} />
      </div>
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
      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            const snap = competitorSnapshot(competitor);
            setForm(snap);
            setSavedForm(snap);
          }}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}

export default function CompetitorsSection({ projectId, competitors, onCompetitorsChange }) {
  const [name, setName] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await createCompetitor(projectId, { competitor_name: name.trim() });
    onCompetitorsChange([created, ...competitors]);
    setName("");
  }

  async function handleDelete(id) {
    await deleteCompetitor(projectId, id);
    onCompetitorsChange(competitors.filter((c) => c.id !== id));
  }

  return (
    <SectionCard title="Competitors" description="Rakip analizi">
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rakip adı" className={`${inputCls} flex-1`} />
        <button type="submit" className={btnPrimaryCls}>Ekle</button>
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
