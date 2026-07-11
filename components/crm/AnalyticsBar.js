"use client";

import { useState, useEffect } from "react";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AnalyticsBar() {
  const [date, setDate] = useState(today());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // setState-in-effect lint kuralına takılmamak için
    // loading'i "date değişti" aksiyonunda yönetiyoruz.
    fetch(`/api/crm/analytics?date=${date}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false));
  }, [date]);

  const cards = [
    { label: "Aranan Müşteri", value: stats?.calledToday ?? "—", color: "text-zinc-900 dark:text-zinc-50" },
    { label: "Olumlu", value: stats?.positive ?? "—", color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Olumsuz", value: stats?.negative ?? "—", color: "text-red-500 dark:text-red-400" },
    { label: "Tekrar Ara", value: stats?.callback ?? "—", color: "text-amber-500 dark:text-amber-400" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Genel İstatistikler</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setLoading(true);
            setDate(e.target.value);
          }}
          className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800"
          >
            <p className={`text-2xl font-bold ${c.color}`}>
              {loading ? (
                <span className="inline-block h-6 w-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              ) : (
                c.value
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
