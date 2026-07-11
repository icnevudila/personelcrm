"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCopyfastItems,
  createCopyfastItem,
  patchCopyfastItem,
  deleteCopyfastItem,
  uploadCopyfastImage,
  analyzeCopyfastItem,
  analyzeCopyfastProject,
  fetchCopyfastMeta,
  downloadPrompt,
  copyPrompt,
} from "@/lib/copyfast/clientApi";
import CopyFastItemModal from "./copyfast/CopyFastItemModal";
import CopyFastGeneratingModal from "./copyfast/CopyFastGeneratingModal";

const btnPrimary =
  "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900";
const btnSecondary =
  "rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800";
const btnViolet =
  "rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60";

function hasRequiredImage(item) {
  if (item.is_responsive) return Boolean(item.web_image_url && item.mobile_image_url);
  return Boolean(item.web_image_url);
}

function PromptActions({ text, filename }) {
  const [copied, setCopied] = useState(false);
  if (!text?.trim()) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={async () => {
          await copyPrompt(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={btnSecondary}
      >
        {copied ? "Kopyalandı!" : "Kopyala"}
      </button>
      <button type="button" onClick={() => downloadPrompt(text, filename)} className={btnSecondary}>
        İndir (.md)
      </button>
    </div>
  );
}

function ItemCard({
  item,
  components,
  onEdit,
  onDelete,
  onAnalyze,
  onAddComponent,
  onDropImage,
  analyzing,
}) {
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type?.startsWith("image/")) onDropImage(item, file);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div
        className={`p-4 ${dragOver ? "ring-2 ring-violet-400" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            {item.web_image_url ? (
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.web_image_url} alt="" className="h-full w-full object-cover" />
                {analyzing && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="copyfast-scanner absolute left-0 right-0 h-0.5 bg-blue-400/80" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400">
                Görsel yok
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</h4>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {item.item_type === "component" ? "Bileşen" : "Sayfa"}
                </span>
                {item.is_responsive ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                    Responsive
                  </span>
                ) : null}
                <StatusBadge status={item.status} />
              </div>
              {item.description ? (
                <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
              ) : null}
              {item.error_message ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{item.error_message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onEdit(item)} className={btnSecondary}>Düzenle</button>
            <button type="button" onClick={() => onDelete(item.id)} className={btnSecondary}>Sil</button>
            <button
              type="button"
              onClick={() => onAnalyze([item])}
              disabled={analyzing || !hasRequiredImage(item)}
              className={btnViolet}
              title={!hasRequiredImage(item) ? "Analiz için görsel gerekli" : ""}
            >
              AI Analiz
            </button>
            {item.item_type === "page" ? (
              <button type="button" onClick={() => onAddComponent(item.id)} className={btnSecondary}>
                + Bileşen
              </button>
            ) : null}
          </div>
        </div>

        {item.mobile_image_url ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-zinc-500">Mobil:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.mobile_image_url} alt="" className="h-12 w-8 rounded border object-cover" />
          </div>
        ) : null}

        {item.generated_prompt ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Üretilen Prompt</p>
            <pre className="max-h-40 overflow-y-auto rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              {item.generated_prompt.slice(0, 600)}
              {item.generated_prompt.length > 600 ? "…" : ""}
            </pre>
            <PromptActions text={item.generated_prompt} filename={`${item.name}-prompt.md`} />
          </div>
        ) : null}
      </div>

      {components.length > 0 ? (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Bileşenler</p>
          <div className="space-y-3">
            {components.map((comp) => (
              <ItemCard
                key={comp.id}
                item={comp}
                components={[]}
                onEdit={onEdit}
                onDelete={onDelete}
                onAnalyze={onAnalyze}
                onAddComponent={onAddComponent}
                onDropImage={onDropImage}
                analyzing={analyzing}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-zinc-100 text-zinc-500",
    generating: "bg-blue-100 text-blue-600",
    generated: "bg-emerald-100 text-emerald-600",
    error: "bg-red-100 text-red-600",
  };
  const labels = {
    pending: "Bekliyor",
    generating: "Üretiliyor",
    generated: "Tamamlandı",
    error: "Hata",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export default function CopyFastTab({ projectId, projectName }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalParentId, setModalParentId] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [generatingOpen, setGeneratingOpen] = useState(false);
  const [generatingItems, setGeneratingItems] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [projectAnalyzing, setProjectAnalyzing] = useState(false);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [itemsData, metaData] = await Promise.all([
        fetchCopyfastItems(projectId),
        fetchCopyfastMeta(projectId),
      ]);
      setItems(itemsData);
      setMeta(metaData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pages = useMemo(() => items.filter((i) => i.item_type === "page"), [items]);
  const componentsByParent = useMemo(() => {
    const map = {};
    for (const item of items) {
      if (item.item_type === "component" && item.parent_id) {
        if (!map[item.parent_id]) map[item.parent_id] = [];
        map[item.parent_id].push(item);
      }
    }
    return map;
  }, [items]);

  function openCreate(parentId = null, file = null) {
    setEditingItem(null);
    setModalParentId(parentId);
    setPendingFile(file);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setModalParentId(item.parent_id);
    setPendingFile(null);
    setModalOpen(true);
  }

  async function handleSave(formData) {
    if (editingItem) {
      const updated = await patchCopyfastItem(projectId, editingItem.id, formData);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    }
    const created = await createCopyfastItem(projectId, formData);
    setItems((prev) => [...prev, created]);
    return created;
  }

  async function handleDelete(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    await deleteCopyfastItem(projectId, id);
    setItems((prev) => prev.filter((i) => i.id !== id && i.parent_id !== id));
  }

  async function runAnalyze(targetItems) {
    const valid = targetItems.filter(hasRequiredImage);
    if (valid.length === 0) {
      setError("Analiz için görseli olan en az bir öğe gerekli");
      return;
    }

    setAnalyzing(true);
    setGeneratingItems(valid);
    setProgressMap(Object.fromEntries(valid.map((i) => [i.id, "pending"])));
    setGeneratingOpen(true);
    setError("");

    for (const item of valid) {
      setProgressMap((prev) => ({ ...prev, [item.id]: "generating" }));
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "generating" } : i))
      );

      try {
        const updated = await analyzeCopyfastItem(projectId, item.id);
        setProgressMap((prev) => ({ ...prev, [item.id]: "generated" }));
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } catch (err) {
        setProgressMap((prev) => ({ ...prev, [item.id]: "error" }));
        if (err.item) {
          setItems((prev) => prev.map((i) => (i.id === err.item.id ? err.item : i)));
        } else {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: "error", error_message: err.message }
                : i
            )
          );
        }
      }
    }

    setAnalyzing(false);
  }

  async function handleAnalyzeAll() {
    const targets = items.filter(
      (i) => hasRequiredImage(i) && (i.status === "pending" || i.status === "error")
    );
    await runAnalyze(targets);
  }

  async function handleProjectAnalyze() {
    setProjectAnalyzing(true);
    setError("");
    try {
      const result = await analyzeCopyfastProject(projectId);
      setMeta(result);
    } catch (err) {
      if (err.meta) setMeta(err.meta);
      setError(err.message);
    } finally {
      setProjectAnalyzing(false);
    }
  }

  function handleRootDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type?.startsWith("image/")) openCreate(null, file);
  }

  async function handleItemDrop(item, file) {
    try {
      const updated = await uploadCopyfastImage(projectId, item.id, file, "web");
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-zinc-400">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-4">
      <style jsx global>{`
        .copyfast-scanner {
          animation: copyfast-scan-global 1.8s ease-in-out infinite;
        }
        @keyframes copyfast-scan-global {
          0%, 100% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">CopyFast</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {projectName} — ekran görüntülerinden Next.js tasarım promptu üretin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => openCreate()} className={btnPrimary}>
            + Sayfa Ekle
          </button>
          <button
            type="button"
            onClick={handleAnalyzeAll}
            disabled={analyzing}
            className={btnViolet}
          >
            Tümünü Üret
          </button>
          <button
            type="button"
            onClick={handleProjectAnalyze}
            disabled={projectAnalyzing}
            className={btnViolet}
          >
            {projectAnalyzing ? "Proje Analiz…" : "Proje Analiz"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {meta?.project_prompt ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Proje Promptu</h3>
            <StatusBadge status={meta.project_prompt_status} />
          </div>
          <pre className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-white/80 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300">
            {meta.project_prompt.slice(0, 800)}
            {meta.project_prompt.length > 800 ? "…" : ""}
          </pre>
          <div className="mt-3">
            <PromptActions
              text={meta.project_prompt}
              filename={`${projectName || "proje"}-copyfast-prompt.md`}
            />
          </div>
        </div>
      ) : null}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleRootDrop}
        className={`rounded-xl border border-dashed p-6 transition-colors ${
          dragOver
            ? "border-violet-400 bg-violet-50/50 dark:border-violet-600 dark:bg-violet-950/20"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
      >
        {pages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            Henüz sayfa yok. Üstteki + butonuyla veya görsel sürükleyerek ekleyin.
          </p>
        ) : (
          <div className="space-y-4">
            {pages.map((page) => (
              <ItemCard
                key={page.id}
                item={page}
                components={componentsByParent[page.id] || []}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAnalyze={runAnalyze}
                onAddComponent={(parentId) => openCreate(parentId)}
                onDropImage={handleItemDrop}
                analyzing={analyzing}
              />
            ))}
          </div>
        )}
      </div>

      <CopyFastItemModal
        open={modalOpen}
        projectId={projectId}
        itemId={editingItem?.id}
        initial={editingItem || {}}
        parentId={modalParentId}
        pendingFile={pendingFile}
        onClose={(saved) => {
          setModalOpen(false);
          setPendingFile(null);
          if (saved?.id) {
            setItems((prev) => {
              const exists = prev.some((i) => i.id === saved.id);
              return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved];
            });
          }
        }}
        onSave={handleSave}
      />

      <CopyFastGeneratingModal
        open={generatingOpen}
        items={generatingItems}
        progressMap={progressMap}
        onClose={() => setGeneratingOpen(false)}
      />
    </div>
  );
}
