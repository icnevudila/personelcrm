"use client";

import { useMemo } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import DeepWorkTimer from "@/components/deep-work/DeepWorkTimer";
import TaskCard from "@/components/deep-work/TaskCard";
import { formatMinutes } from "@/lib/deep-work/dateUtils";
import { fetchReview, saveReview } from "@/lib/deep-work/clientApi";
import { todayDateStr } from "@/lib/deep-work/dateUtils";
import { useEffect, useState } from "react";

function ActionBtn({ children, onClick, variant = "default" }) {
  const cls =
    variant === "primary"
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "border border-zinc-200 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300";
  return (
    <button type="button" onClick={onClick} className={`rounded-md px-2 py-1 text-xs font-medium ${cls}`}>
      {children}
    </button>
  );
}

export default function DeepWorkDashboardTab() {
  const { tasks, settings, stats, activeSession, beginSession, endSession, patchTask, updateSettings } = useDeepWork();
  const [reviewNote, setReviewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const goal = settings?.daily_goal_minutes || 120;
  const todayWorked = stats?.todayMinutes || 0;
  const progress = Math.min(100, (todayWorked / goal) * 100);

  const todayTasks = useMemo(() => tasks.filter((t) => t.is_today_plan && t.status !== "done" && t.status !== "archive"), [tasks]);
  const doneToday = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);
  const plannedTotal = todayTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
  const remaining = Math.max(0, goal - todayWorked);

  useEffect(() => {
    fetchReview(todayDateStr()).then((r) => {
      if (r?.notes) setReviewNote(r.notes);
    }).catch(() => {});
  }, []);

  async function handleComplete(task) {
    if (activeSession?.task_id === task.id) await endSession();
    await patchTask(task.id, { status: "done" });
  }

  async function saveNote() {
    setSavingNote(true);
    try {
      await saveReview({ notes: reviewNote, review_date: todayDateStr() });
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bugünkü Hedef</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {todayWorked} / {goal} dk
            </p>
          </div>
          <div className="text-right text-sm text-zinc-500">
            <p>Planlanan: {formatMinutes(plannedTotal)}</p>
            <p>Kalan: {formatMinutes(remaining)}</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Bugünün görevleri</h3>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-zinc-500">Günlük Plan sekmesinden bugünkü görevleri seçin.</p>
          ) : (
            todayTasks.map((task) => (
              <div key={task.id} className="space-y-2">
                <TaskCard
                  task={task}
                  actions={
                    <>
                      {!activeSession || activeSession.task_id !== task.id ? (
                        <ActionBtn variant="primary" onClick={() => beginSession(task.id)}>
                          Başlat
                        </ActionBtn>
                      ) : null}
                      {activeSession?.task_id === task.id && (
                        <ActionBtn onClick={endSession}>Durdur</ActionBtn>
                      )}
                      <ActionBtn onClick={() => beginSession(task.id)}>Devam Et</ActionBtn>
                      <ActionBtn onClick={() => handleComplete(task)}>Tamamlandı</ActionBtn>
                    </>
                  }
                />
                {activeSession?.task_id === task.id && (
                  <DeepWorkTimer
                    task={task}
                    pomodoroMinutes={settings?.pomodoro_work_minutes || 25}
                    onStop={endSession}
                    compact
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pomodoro ayarları</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["daily_goal_minutes", "Günlük hedef", goal],
                ["pomodoro_work_minutes", "Çalışma", settings?.pomodoro_work_minutes || 25],
                ["pomodoro_break_minutes", "Mola", settings?.pomodoro_break_minutes || 5],
              ].map(([key, label, val]) => (
                <div key={key}>
                  <label className="text-xs text-zinc-500">{label}</label>
                  <input
                    type="number"
                    min={1}
                    defaultValue={val}
                    onBlur={(e) => updateSettings({ ...settings, [key]: Number(e.target.value) })}
                    className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Bugün tamamlanan</h3>
            {doneToday.length === 0 ? (
              <p className="text-sm text-zinc-500">Henüz tamamlanan görev yok.</p>
            ) : (
              <div className="space-y-2">
                {doneToday.slice(0, 5).map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Kısa günlük not</h3>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              placeholder="Bugün hakkında kısa not..."
            />
            <button
              type="button"
              onClick={saveNote}
              disabled={savingNote}
              className="mt-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {savingNote ? "Kaydediliyor…" : "Notu kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
