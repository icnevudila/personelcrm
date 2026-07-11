"use client";

import { useMemo } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import TaskCard from "@/components/deep-work/TaskCard";

export default function ArchiveTab() {
  const { tasks, patchTask, removeTask } = useDeepWork();

  const archived = useMemo(
    () => tasks.filter((t) => t.status === "archive").sort((a, b) => new Date(b.archived_at || b.updated_at) - new Date(a.archived_at || a.updated_at)),
    [tasks]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Arşiv</h3>
        <p className="text-sm text-zinc-500">Arşivlenmiş görevleri geri alabilir veya kalıcı silebilirsiniz.</p>
      </div>
      {archived.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Arşivde görev yok.
        </p>
      ) : (
        <div className="space-y-2">
          {archived.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => patchTask(task.id, { status: "todo" })}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-600"
                  >
                    Geri al
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
                  >
                    Kalıcı sil
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
