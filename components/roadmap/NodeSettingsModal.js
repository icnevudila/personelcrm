"use client";

import { useEffect, useState } from "react";
import { NODE_COLORS, NODE_TYPES } from "@/lib/roadmap/constants";
import RoadmapDeleteConfirmModal from "./RoadmapDeleteConfirmModal";

export default function NodeSettingsModal({ node, onClose, onChange, onDelete }) {
  const [draft, setDraft] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (node) {
      setDraft({
        title: node.title,
        description: node.description,
        color: node.color,
        type: node.type,
        imageUrl: node.imageUrl || "",
      });
      setShowDeleteConfirm(false);
    } else {
      setDraft(null);
      setShowDeleteConfirm(false);
    }
  }, [node]);

  if (!node || !draft) return null;

  function patch(fields) {
    const next = { ...draft, ...fields };
    setDraft(next);
    onChange(node.id, fields);
  }

  function handleDeleteConfirm() {
    onDelete(node.id);
    setShowDeleteConfirm(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Öğe Ayarları</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Başlık</label>
              <input
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Açıklama</label>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => patch({ description: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Görsel URL</label>
              <input
                type="url"
                value={draft.imageUrl}
                onChange={(e) => patch({ imageUrl: e.target.value.trim() })}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Tür</label>
              <select
                value={draft.type}
                onChange={(e) => patch({ type: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {NODE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">Renk</label>
              <div className="flex flex-wrap gap-2">
                {NODE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => patch({ color: c.value })}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      draft.color === c.value
                        ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-2 dark:border-zinc-100 dark:ring-zinc-100"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Sil
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      </div>

      <RoadmapDeleteConfirmModal
        open={showDeleteConfirm}
        title="Öğe silinsin mi?"
        message="Bu işlem geri alınamaz. Öğe ve bağlı bağlantıları canvas'tan kaldırılacak."
        itemLabel={draft.title || "İsimsiz öğe"}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
