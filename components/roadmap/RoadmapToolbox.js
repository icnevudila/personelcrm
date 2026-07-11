"use client";

import { NODE_TYPES } from "@/lib/roadmap/constants";
import { ANNOTATION_TYPES } from "@/lib/roadmap/annotations";

function shapeClass(shape) {
  if (shape === "circle") return "rounded-full";
  if (shape === "diamond") return "rotate-45 rounded-lg";
  if (shape === "rectangle") return "rounded-md";
  return "rounded-xl";
}

function ToolButton({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-left text-xs font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40"
    >
      {children}
    </button>
  );
}

export default function RoadmapToolbox({ onAddNode, onAddAnnotation }) {
  const nodeTools = NODE_TYPES;
  const annTools = ANNOTATION_TYPES;

  return (
    <aside className="flex w-40 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1 overflow-y-auto p-2">
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Node
        </p>
        <div className="space-y-1">
          {nodeTools.map((t) => (
            <ToolButton key={t.id} title={t.label} onClick={() => onAddNode(t.id)}>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 border-current ${shapeClass(t.shape)}`}
                style={{
                  width: 18,
                  height: t.shape === "circle" || t.shape === "diamond" ? 18 : 14,
                }}
              />
              <span className="truncate">{t.label}</span>
            </ToolButton>
          ))}
        </div>

        <p className="mb-1.5 mt-4 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          Araçlar
        </p>
        <div className="space-y-1">
          {annTools.map((t) => (
            <ToolButton key={t.id} title={t.label} onClick={() => onAddAnnotation(t.id)}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-200/80 text-[11px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-200">
                {t.icon}
              </span>
              <span className="truncate">{t.label}</span>
            </ToolButton>
          ))}
        </div>
      </div>
    </aside>
  );
}
