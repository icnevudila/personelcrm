"use client";

import { useEffect, useState } from "react";
import { formatMinutes, minutesBetween } from "@/lib/deep-work/dateUtils";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";

export default function DeepWorkTimer({ task, pomodoroMinutes, onStop, compact = false }) {
  const { activeSession } = useDeepWork();
  const [elapsed, setElapsed] = useState(0);

  const isActive = activeSession?.task_id === task?.id && !activeSession?.ended_at;
  const startedAt = isActive ? activeSession.started_at : null;

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(minutesBetween(startedAt, new Date()) * 60);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!isActive) return null;

  const totalSec = pomodoroMinutes * 60;
  const remaining = Math.max(0, totalSec - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = Math.min(100, (elapsed / totalSec) * 100);

  return (
    <div className={compact ? "space-y-2" : "rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"}>
      {!compact && <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Aktif oturum</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {mm}:{ss}
        </span>
        <button
          type="button"
          onClick={onStop}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Durdur
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-zinc-500">Geçen: {formatMinutes(Math.floor(elapsed / 60))}</p>
    </div>
  );
}
