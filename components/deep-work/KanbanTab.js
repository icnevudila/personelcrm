"use client";

import { useMemo, useState } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import TaskCard from "@/components/deep-work/TaskCard";
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/deep-work/constants";

const KANBAN_COLUMNS = TASK_STATUSES.filter((s) => s !== "archive");

export default function KanbanTab() {
  const { tasks, patchTask, removeTask, reorderTasks } = useDeepWork();
  const [dragTaskId, setDragTaskId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  const columns = useMemo(() => {
    const map = {};
    for (const col of KANBAN_COLUMNS) {
      map[col] = tasks
        .filter((t) => t.status === col)
        .sort((a, b) => a.sort_order - b.sort_order || new Date(b.created_at) - new Date(a.created_at));
    }
    return map;
  }, [tasks]);

  async function handleDrop(status, targetIndex = 0) {
    if (!dragTaskId) return;
    const colTasks = columns[status] || [];
    const others = colTasks.filter((t) => t.id !== dragTaskId);
    const dragged = tasks.find((t) => t.id === dragTaskId);
    if (!dragged) return;

    const newOrder = [...others];
    newOrder.splice(targetIndex, 0, { ...dragged, status });
    await reorderTasks(newOrder.map((t) => t.id), status);
    setDragTaskId(null);
    setOverColumn(null);
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {KANBAN_COLUMNS.map((status) => (
          <div
            key={status}
            className={`w-72 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/50 ${
              overColumn === status ? "ring-2 ring-zinc-300 dark:ring-zinc-600" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(status);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(status, columns[status]?.length || 0);
            }}
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {STATUS_LABELS[status]} ({columns[status]?.length || 0})
            </h3>
            <div className="space-y-2">
              {(columns[status] || []).map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  draggable
                  isDragging={dragTaskId === task.id}
                  onDragStart={() => setDragTaskId(task.id)}
                  onDragEnd={() => {
                    setDragTaskId(null);
                    setOverColumn(null);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDrop(status, index);
                  }}
                  actions={
                    <>
                      {status !== "archive" && (
                        <button
                          type="button"
                          onClick={() => patchTask(task.id, { status: "archive" })}
                          className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-600"
                        >
                          Arşivle
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
                      >
                        Sil
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
