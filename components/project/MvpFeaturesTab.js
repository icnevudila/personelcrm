"use client";

import { useEffect, useMemo, useState } from "react";

const FEATURE_LABELS = [
  {
    id: "mvp",
    label: "MVP",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    pill: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    id: "normal",
    label: "Normal",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    pill: "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
  },
  {
    id: "later",
    label: "Sonra",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    pill: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  },
];

const FILTER_OPTIONS = [
  { id: "all", label: "Tümü" },
  { id: "unlabeled", label: "Etiketsiz" },
  ...FEATURE_LABELS.map((l) => ({ id: l.id, label: l.label })),
];

function getLabelMeta(labelId) {
  return FEATURE_LABELS.find((l) => l.id === labelId) || null;
}

function DragHandleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

function LabelBadge({ labelId }) {
  const meta = getLabelMeta(labelId);
  if (!meta) return null;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

function LabelPicker({ value, onChange, size = "md" }) {
  const btnCls = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FEATURE_LABELS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(selected ? null : option.id)}
            className={`rounded-full border font-medium transition-colors ${btnCls} ${
              selected ? option.pill : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function FeatureRowActions({ feature, onLabelChange, onClearLabel, onDelete }) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
      {FEATURE_LABELS.map((option) => (
        <button
          key={option.id}
          type="button"
          title={option.label}
          aria-label={`${option.label} etiketi`}
          onClick={() => onLabelChange(feature, option.id)}
          className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            feature.label === option.id
              ? option.pill
              : "border-zinc-200 text-zinc-400 hover:border-zinc-300 dark:border-zinc-700"
          }`}
        >
          {option.label}
        </button>
      ))}
      {feature.label && (
        <button
          type="button"
          title="Etiketi kaldır"
          aria-label="Etiketi kaldır"
          onClick={() => onClearLabel(feature)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <button
        type="button"
        title="Sil"
        aria-label="Özelliği sil"
        onClick={() => onDelete(feature)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
      </button>
    </div>
  );
}

export default function MvpFeaturesTab({ projectId }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLabel, setNewLabel] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/mvp-features`)
      .then((r) => r.json())
      .then((data) => {
        setFeatures(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const counts = useMemo(
    () => ({
      mvp: features.filter((f) => f.label === "mvp").length,
      normal: features.filter((f) => f.label === "normal").length,
      later: features.filter((f) => f.label === "later").length,
      unlabeled: features.filter((f) => !f.label).length,
    }),
    [features]
  );

  const filteredFeatures = useMemo(() => {
    if (filter === "all") return features;
    if (filter === "unlabeled") return features.filter((f) => !f.label);
    return features.filter((f) => f.label === filter);
  }, [features, filter]);

  async function patchFeature(featureId, payload) {
    const res = await fetch(`/api/projects/${projectId}/mvp-features/${featureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Güncellenemedi");
    return data;
  }

  function replaceFeature(updated) {
    setFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  async function handleAdd(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || adding) return;

    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/mvp-features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: newDescription.trim(),
          label: newLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eklenemedi");
      setFeatures((prev) => [...prev, data]);
      setNewTitle("");
      setNewDescription("");
      setNewLabel(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleLabelChange(feature, labelId) {
    const nextLabel = feature.label === labelId ? null : labelId;
    const prevLabel = feature.label;
    setFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, label: nextLabel } : f)));
    try {
      const updated = await patchFeature(feature.id, { label: nextLabel });
      replaceFeature(updated);
    } catch (err) {
      setFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, label: prevLabel } : f)));
      setError(err.message);
    }
  }

  async function handleClearLabel(feature) {
    if (!feature.label) return;
    const prevLabel = feature.label;
    setFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, label: null } : f)));
    try {
      const updated = await patchFeature(feature.id, { label: null });
      replaceFeature(updated);
    } catch (err) {
      setFeatures((prev) => prev.map((f) => (f.id === feature.id ? { ...f, label: prevLabel } : f)));
      setError(err.message);
    }
  }

  async function handleDelete(feature) {
    if (!confirm(`"${feature.title}" silinsin mi?`)) return;
    setFeatures((prev) => prev.filter((f) => f.id !== feature.id));
    const res = await fetch(`/api/projects/${projectId}/mvp-features/${feature.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Silinemedi");
      fetch(`/api/projects/${projectId}/mvp-features`)
        .then((r) => r.json())
        .then((list) => setFeatures(Array.isArray(list) ? list : []));
    }
  }

  async function persistOrder(nextFeatures) {
    setReordering(true);
    const res = await fetch(`/api/projects/${projectId}/mvp-features/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered_ids: nextFeatures.map((f) => f.id) }),
    });
    const data = await res.json();
    setReordering(false);

    if (!res.ok) {
      setError(data.error || "Sıralama kaydedilemedi");
      fetch(`/api/projects/${projectId}/mvp-features`)
        .then((r) => r.json())
        .then((list) => setFeatures(Array.isArray(list) ? list : []));
      return;
    }

    setFeatures(Array.isArray(data) ? data : nextFeatures);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) setOverIndex(index);
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const visibleIds = filteredFeatures.map((f) => f.id);
    const reorderedVisible = [...filteredFeatures];
    const [moved] = reorderedVisible.splice(dragIndex, 1);
    reorderedVisible.splice(dropIndex, 0, moved);

    const hidden = features.filter((f) => !visibleIds.includes(f.id));
    const next = filter === "all"
      ? reorderedVisible
      : [...reorderedVisible, ...hidden];

    if (filter !== "all") {
      setError("Sıralamak için Tümü filtresini kullanın");
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    setFeatures(next);
    setDragIndex(null);
    setOverIndex(null);
    persistOrder(next);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  if (loading) {
    return <div className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">MVP Features</h2>
        <p className="text-sm text-zinc-500">
          Ürün özelliklerini listeleyin, sıralayın ve MVP kapsamına karar verin.
        </p>
        {features.length > 0 && (
          <p className="mt-1.5 text-xs text-zinc-400">
            {counts.mvp} MVP · {counts.normal} Normal · {counts.later} Sonra
            {counts.unlabeled > 0 && ` · ${counts.unlabeled} etiketsiz`}
          </p>
        )}
      </div>

      <form onSubmit={handleAdd} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Özellik</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Örn: Kullanıcı kaydı"
            className={`${inputCls} mt-1`}
            disabled={adding}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Kısa açıklama</label>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Örn: E-posta ile kayıt ve giriş"
            className={`${inputCls} mt-1`}
            disabled={adding}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Etiket (opsiyonel)</p>
          <div className="mt-1.5">
            <LabelPicker value={newLabel} onChange={setNewLabel} />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {adding ? "Ekleniyor…" : "Özellik ekle"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {features.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === option.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {filteredFeatures.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            {features.length === 0
              ? "Henüz özellik yok. Yukarıdan ekleyin."
              : "Bu filtrede özellik bulunamadı."}
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {filteredFeatures.map((feature, index) => {
            const isDragging = dragIndex === index;
            const isOver = overIndex === index && dragIndex !== index;
            const canDrag = filter === "all";

            return (
              <li
                key={feature.id}
                draggable={canDrag && !reordering}
                onDragStart={canDrag ? () => handleDragStart(index) : undefined}
                onDragOver={canDrag ? (e) => handleDragOver(e, index) : undefined}
                onDrop={canDrag ? (e) => handleDrop(e, index) : undefined}
                onDragEnd={canDrag ? handleDragEnd : undefined}
                className={`group flex items-start gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-2.5 transition-all sm:gap-3 sm:px-3 dark:border-zinc-700 dark:bg-zinc-900 ${
                  isDragging ? "opacity-50" : isOver ? "ring-2 ring-zinc-200 dark:ring-zinc-700" : ""
                }`}
              >
                {canDrag ? (
                  <button
                    type="button"
                    className="mt-0.5 cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
                    aria-label="Sürükleyerek sırala"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <DragHandleIcon className="h-5 w-5" />
                  </button>
                ) : (
                  <span className="mt-0.5 w-5 shrink-0" aria-hidden />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{feature.title}</p>
                    <LabelBadge labelId={feature.label} />
                  </div>
                  {feature.description && (
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{feature.description}</p>
                  )}
                </div>

                <FeatureRowActions
                  feature={feature}
                  onLabelChange={handleLabelChange}
                  onClearLabel={handleClearLabel}
                  onDelete={handleDelete}
                />
              </li>
            );
          })}
        </ul>
      )}

      {filter !== "all" && filteredFeatures.length > 0 && (
        <p className="text-xs text-zinc-400">Sıralama yalnızca &quot;Tümü&quot; filtresinde kullanılabilir.</p>
      )}

      {reordering && <p className="text-xs text-zinc-400">Sıralama kaydediliyor…</p>}
    </div>
  );
}
