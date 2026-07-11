"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AnalyticsBar from "./AnalyticsBar";
import NewGroupModal from "./NewGroupModal";

export default function CrmDashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch("/api/crm/groups")
      .then((r) => r.json())
      .then((d) => setGroups(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(group) {
    setGroups((prev) => [group, ...prev]);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-2 text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
              </svg>
            </span>
            <span className="text-sm font-medium">Panele dön</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Müşteri CRM</h1>
            <p className="text-sm text-zinc-500">Müşteri gruplarını yönetin</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Yeni Grup
        </button>
      </div>

      <AnalyticsBar />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider">
          Müşteri Grupları
        </h2>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-400">
              Henüz grup yok. &ldquo;+ Yeni Grup&rdquo; ile başlayın.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/crm/${g.id}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
                      👥
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                        {g.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(g.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                  <span className="text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewGroupModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
