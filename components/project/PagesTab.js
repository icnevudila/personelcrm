"use client";

import { useMemo } from "react";

/**
 * Salt okunur: projedeki site sayfalarını listeler (site_pages).
 */
export default function PagesTab({ sitePages }) {
  const rows = useMemo(() => {
    if (!Array.isArray(sitePages) || sitePages.length === 0) return [];
    return [...sitePages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [sitePages]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Sayfalar</h2>
        <p className="text-sm text-zinc-500">
          Kurulum formunda seçilen sayfaların listesi.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Henüz tanımlı sayfa yok.</p>
          <p className="mt-1 text-xs text-zinc-400">
            Sayfalar, kurulum formunda &quot;Sitede Olacak Sayfalar&quot; bölümünden seçilir.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
          {rows.map((p, idx) => (
            <li
              key={p.id ?? `${p.title}-${idx}`}
              className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {idx + 1}
              </span>
              <span className="font-medium">{p.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
