"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CustomerList from "./CustomerList";

const TABS = [
  { key: "pending", label: "Bekleyen", statusKey: "pending" },
  { key: "callback", label: "Tekrar Ara", statusKey: "callback" },
  { key: "positive", label: "Olumlu", statusKey: "positive" },
  { key: "negative", label: "Olumsuz", statusKey: "negative" },
];

export default function GroupDetail({ groupId }) {
  const [group, setGroup] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/crm/groups/${groupId}`)
      .then((r) => r.json())
      .then((d) => {
        setGroup(d);
        setStats(d.stats ?? null);
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  // Kayıt sonrası sayacları anlık güncelle (DB'ye gidilmez)
  function handleStatusChange(oldStatus, newStatus) {
    if (oldStatus === newStatus) return;
    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [oldStatus]: Math.max(0, (prev[oldStatus] ?? 0) - 1),
        [newStatus]: (prev[newStatus] ?? 0) + 1,
      };
    });
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200" />
      </div>
    );
  }

  if (!group || group.error) {
    return <p className="py-8 text-center text-sm text-zinc-400">Grup bulunamadı.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/crm"
          className="inline-flex items-center gap-2.5 text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
          </span>
          <span className="text-sm font-medium">Müşteri CRM</span>
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{group.name}</h1>
          <p className="text-sm text-zinc-500">Toplam: {stats?.total ?? 0} müşteri</p>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const count = stats?.[tab.key] ?? null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
                {count !== null && (
                  <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pb-24">
        <CustomerList
          key={activeTab}
          groupId={groupId}
          status={activeTab}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
