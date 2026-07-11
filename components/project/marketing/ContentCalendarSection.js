"use client";

import { useMemo, useState } from "react";
import { SectionCard, inputCls, selectCls, btnPrimaryCls, btnGhostCls } from "./ui";
import { CONTENT_STATUSES } from "@/lib/marketing/constants";
import { createContent, patchContent, deleteContent } from "@/lib/marketing/clientApi";

function getWeekDates(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().slice(0, 10);
  });
}

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function ContentCalendarSection({ projectId, contents, onContentsChange }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [adding, setAdding] = useState(false);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const contentsByDate = useMemo(() => {
    const map = {};
    for (const date of weekDates) map[date] = [];
    for (const c of contents) {
      if (c.planned_date && map[c.planned_date]) {
        map[c.planned_date].push(c);
      }
    }
    return map;
  }, [contents, weekDates]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    setAdding(true);
    try {
      const created = await createContent(projectId, {
        title: newTitle.trim(),
        planned_date: newDate,
        status: "planned",
      });
      onContentsChange([...contents, created]);
      setNewTitle("");
      setNewDate("");
    } finally {
      setAdding(false);
    }
  }

  async function handleStatusChange(content, status) {
    const updated = await patchContent(projectId, content.id, { status });
    onContentsChange(contents.map((c) => (c.id === content.id ? updated : c)));
  }

  async function handleDelete(contentId) {
    await deleteContent(projectId, contentId);
    onContentsChange(contents.filter((c) => c.id !== contentId));
  }

  const statusColors = {
    planned: "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800",
    preparing: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
    ready: "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
    published: "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30",
  };

  return (
    <SectionCard
      title="Content Calendar"
      description="İçerikleri günlere atayın ve durumlarını takip edin."
      action={
        <div className="flex gap-1">
          <button type="button" onClick={() => setWeekOffset((w) => w - 1)} className={btnGhostCls}>←</button>
          <button type="button" onClick={() => setWeekOffset(0)} className={btnGhostCls}>Bu Hafta</button>
          <button type="button" onClick={() => setWeekOffset((w) => w + 1)} className={btnGhostCls}>→</button>
        </div>
      }
    >
      <form onSubmit={handleAdd} className="mb-4 flex flex-wrap gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="İçerik başlığı"
          className={`${inputCls} min-w-[10rem] flex-1`}
        />
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className={inputCls}
        />
        <button type="submit" disabled={adding} className={btnPrimaryCls}>Ekle</button>
      </form>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {weekDates.map((date, i) => (
          <div key={date} className="min-h-[8rem] rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
            <p className="mb-2 text-center text-xs font-medium text-zinc-500">
              {DAY_LABELS[i]}
              <br />
              <span className="text-zinc-400">{date.slice(5)}</span>
            </p>
            <div className="space-y-1.5">
              {(contentsByDate[date] || []).map((c) => (
                <div key={c.id} className={`rounded-md border p-1.5 text-xs ${statusColors[c.status] || statusColors.planned}`}>
                  <p className="font-medium truncate">{c.title}</p>
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c, e.target.value)}
                    className="mt-1 w-full rounded border-0 bg-transparent text-[10px]"
                  >
                    {CONTENT_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="mt-0.5 text-[10px] text-red-500 hover:underline"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
