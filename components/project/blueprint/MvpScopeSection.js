"use client";

import { useMemo, useState } from "react";
import { SectionCard, inputCls, textareaCls, btnPrimaryCls, labelCls } from "./ui";
import { MVP_STAGES } from "@/lib/productBlueprint/constants";
import { createMvpItem, patchMvpItem, deleteMvpItem } from "@/lib/productBlueprint/clientApi";

function DragHandleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

export default function MvpScopeSection({ projectId, mvpItems, onMvpItemsChange }) {
  const [newTitles, setNewTitles] = useState({ mvp: "", next_version: "", future: "" });
  const [dragId, setDragId] = useState(null);

  const columns = useMemo(
    () =>
      MVP_STAGES.map((col) => ({
        ...col,
        items: mvpItems.filter((i) => i.stage === col.id).sort((a, b) => a.sort_order - b.sort_order),
      })),
    [mvpItems]
  );

  async function handleAdd(stage) {
    const title = newTitles[stage]?.trim();
    if (!title) return;
    const created = await createMvpItem(projectId, { title, stage });
    onMvpItemsChange([...mvpItems, created]);
    setNewTitles((prev) => ({ ...prev, [stage]: "" }));
  }

  async function removeItem(id) {
    await deleteMvpItem(projectId, id);
    onMvpItemsChange(mvpItems.filter((i) => i.id !== id));
  }

  async function moveItem(item, newStage) {
    if (item.stage === newStage) return;
    const updated = await patchMvpItem(projectId, item.id, { stage: newStage });
    onMvpItemsChange(mvpItems.map((i) => (i.id === item.id ? updated : i)));
  }

  function handleDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e, targetItem, stage) {
    e.preventDefault();
    if (!dragId || dragId === targetItem.id) return;

    const stageItems = mvpItems.filter((i) => i.stage === stage).sort((a, b) => a.sort_order - b.sort_order);
    const fromIdx = stageItems.findIndex((i) => i.id === dragId);
    const toIdx = stageItems.findIndex((i) => i.id === targetItem.id);
    if (fromIdx < 0 || toIdx < 0) return;

    const reordered = [...stageItems];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const orderMap = Object.fromEntries(reordered.map((i, idx) => [i.id, idx]));
    onMvpItemsChange(
      mvpItems.map((i) => (i.stage === stage && orderMap[i.id] !== undefined ? { ...i, sort_order: orderMap[i.id] } : i))
    );
    setDragId(null);
  }

  return (
    <SectionCard title="MVP Scope" description="Ürün kapsamını üç aşamada planlayın. Kartları sürükleyerek sıralayın.">
      <div className="grid gap-3 lg:grid-cols-3">
        {columns.map((col) => (
          <div key={col.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/30">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{col.label}</h4>
            <div className="mb-2 flex gap-1">
              <input
                value={newTitles[col.id]}
                onChange={(e) => setNewTitles({ ...newTitles, [col.id]: e.target.value })}
                placeholder="Yeni madde…"
                className={`${inputCls} flex-1 text-xs`}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd(col.id))}
              />
              <button type="button" onClick={() => handleAdd(col.id)} className={btnPrimaryCls}>+</button>
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, item, col.id)}
                  className="group flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <DragHandleIcon className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-zinc-300 group-hover:text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.title}</p>
                    {item.description && <p className="text-xs text-zinc-500">{item.description}</p>}
                    <div className="mt-1 flex gap-1">
                      {MVP_STAGES.filter((s) => s.id !== col.id).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => moveItem(item, s.id)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-600"
                        >
                          → {s.label.split(" ")[0]}
                        </button>
                      ))}
                      <button type="button" onClick={() => removeItem(item.id)} className="ml-auto text-[10px] text-red-500">Sil</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
