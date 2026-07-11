"use client";

import { useDeepWork } from "@/components/deep-work/DeepWorkProvider";
import { formatMinutes } from "@/lib/deep-work/dateUtils";

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}

export default function StatsTab() {
  const { stats, loading } = useDeepWork();

  if (loading || !stats) {
    return <p className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Bu hafta" value={formatMinutes(stats.weekMinutes)} />
        <StatCard label="Bu ay" value={formatMinutes(stats.monthMinutes)} />
        <StatCard label="Toplam Deep Work" value={formatMinutes(stats.totalMinutes)} />
        <StatCard label="Tamamlanan görev" value={stats.completedCount} />
        <StatCard label="Streak (gün)" value={stats.streak} />
        <StatCard label="Bugün" value={formatMinutes(stats.todayMinutes)} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">En çok zaman harcanan projeler</h3>
        {stats.topProjects?.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Henüz veri yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.topProjects.map((p) => (
              <li key={p.name} className="flex items-center justify-between text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">{p.name}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatMinutes(p.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
