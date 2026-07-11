"use client";

import { useEffect, useState } from "react";
import { NODE_COLORS } from "@/lib/roadmap/constants";
import { NOTE_COLORS, isLineType, getAnnotationTypeDef } from "@/lib/roadmap/annotations";
import RoadmapDeleteConfirmModal from "./RoadmapDeleteConfirmModal";

export default function AnnotationSettingsModal({ annotation, onClose, onChange, onDelete }) {
  const [draft, setDraft] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (annotation) {
      setDraft({ ...annotation });
      setShowDeleteConfirm(false);
    } else {
      setDraft(null);
      setShowDeleteConfirm(false);
    }
  }, [annotation]);

  if (!annotation || !draft) return null;

  const typeDef = getAnnotationTypeDef(draft.type);
  const isLine = isLineType(draft.type);

  function patch(fields) {
    const next = { ...draft, ...fields };
    setDraft(next);
    onChange(annotation.id, fields);
  }

  function handleDeleteConfirm() {
    onDelete(annotation.id);
    setShowDeleteConfirm(false);
  }

  function deleteItemLabel() {
    if (draft.type === "frame") {
      const label = String(draft.title || "").trim();
      return label || "Etiketsiz çerçeve";
    }
    if (isLine) return draft.type === "arrow" ? "Ok" : "Çizgi";
    return draft.title || typeDef.label;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {typeDef.label} Ayarları
          </h2>
          <div className="mt-4 space-y-4">
            {!isLine && draft.type !== "frame" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Metin</label>
                <textarea
                  rows={draft.type === "note" ? 4 : 2}
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            )}

            {draft.type === "frame" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Etiket (opsiyonel)</label>
                <input
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Boş bırakılabilir"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            )}

            {(draft.type === "text" || draft.type === "heading") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Punto ({draft.fontSize}px)
                </label>
                <input
                  type="range"
                  min={12}
                  max={48}
                  value={draft.fontSize}
                  onChange={(e) => patch({ fontSize: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {!isLine && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Genişlik</label>
                  <input
                    type="number"
                    min={40}
                    value={Math.round(draft.width)}
                    onChange={(e) => patch({ width: Number(e.target.value) || 40 })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Yükseklik</label>
                  <input
                    type="number"
                    min={24}
                    value={Math.round(draft.height)}
                    onChange={(e) => patch({ height: Number(e.target.value) || 24 })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                  />
                </div>
              </div>
            )}

            {isLine && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Kalınlık ({draft.strokeWidth}px)
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={draft.strokeWidth}
                  onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {draft.type === "frame" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Kenar kalınlığı ({draft.strokeWidth}px)
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={draft.strokeWidth}
                  onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {draft.type === "note" ? (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Not rengi</label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => patch({ backgroundColor: c.value, color: "#713f12" })}
                      className={`h-7 w-7 rounded-md border-2 transition ${
                        draft.backgroundColor === c.value
                          ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-2 dark:border-zinc-100 dark:ring-zinc-100"
                          : "border-zinc-200 dark:border-zinc-600"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            ) : (
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
            )}

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
        title={`${typeDef.label} silinsin mi?`}
        message="Bu işlem geri alınamaz. Öğe canvas'tan kaldırılacak."
        itemLabel={deleteItemLabel()}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
