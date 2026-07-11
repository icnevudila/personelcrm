"use client";

import { useMemo, useState } from "react";
import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import { monthDays, toDateStr } from "@/lib/deep-work/dateUtils";

const WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

export default function CalendarTab() {
  const { tasks, patchTask } = useDeepWork();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateStr(now));

  const { days } = monthDays(year, month);

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.planned_date) continue;
      if (!map[t.planned_date]) map[t.planned_date] = [];
      map[t.planned_date].push(t);
    }
    return map;
  }, [tasks]);

  const unplanned = tasks.filter((t) => !t.planned_date && t.status !== "archive" && t.status !== "done");

  async function assignDate(taskId, date) {
    await patchTask(taskId, { planned_date: date });
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={prevMonth} className="rounded-lg px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
            ←
          </button>
          <h3 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-50">{monthLabel}</h3>
          <button type="button" onClick={nextMonth} className="rounded-lg px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {days.map((day) => {
            const key = toDateStr(day);
            const count = tasksByDate[key]?.length || 0;
            const isSelected = key === selectedDate;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={`min-h-[3.5rem] rounded-lg border p-1 text-left text-xs transition-colors ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                }`}
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{day.getDate()}</span>
                {count > 0 && (
                  <span className="mt-0.5 block truncate text-[10px] text-zinc-500">{count} görev</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {selectedDate} planı
          </h3>
          <div className="mt-2 space-y-2">
            {(tasksByDate[selectedDate] || []).length === 0 ? (
              <p className="text-sm text-zinc-500">Bu güne atanmış görev yok.</p>
            ) : (
              tasksByDate[selectedDate].map((t) => (
                <div key={t.id} className="rounded-lg border border-zinc-100 p-2 text-sm dark:border-zinc-800">
                  <p className="font-medium">{t.title}</p>
                  <button
                    type="button"
                    onClick={() => assignDate(t.id, null)}
                    className="mt-1 text-xs text-zinc-500 hover:text-red-600"
                  >
                    Tarihi kaldır
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Atanmamış görevler</h3>
          <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
            {unplanned.length === 0 ? (
              <p className="text-sm text-zinc-500">Tüm görevler planlandı.</p>
            ) : (
              unplanned.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{t.title}</span>
                  <button
                    type="button"
                    onClick={() => assignDate(t.id, selectedDate)}
                    className="shrink-0 rounded-md bg-zinc-900 px-2 py-0.5 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Ata
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
