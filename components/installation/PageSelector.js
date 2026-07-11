"use client";

import { useEffect, useMemo, useState } from "react";

export const POPULAR_PAGE_LABELS = [
  "Ana Sayfa",
  "Hizmetler",
  "İletişim",
  "Hakkımızda",
  "Galeri",
  "Blog",
  "Kampanyalar / Fiyatlar",
  "Ürünler",
  "S.S.S. (sık sorulan sorular)",
  "Referanslar",
  "KVKK",
  "Gizlilik sözleşmesi",
];

export default function PageSelector({ value, onChange }) {
  const [customInput, setCustomInput] = useState("");
  const safeValue = Array.isArray(value) ? value : [];
  const safeKey = useMemo(() => JSON.stringify(safeValue), [safeValue]);
  const customPages = safeValue.filter((p) => !POPULAR_PAGE_LABELS.includes(p));
  const MUST_HAVE = "Ana Sayfa";

  // Ana Sayfa her zaman seçili olmalı (DB'ye de insert edilsin)
  useEffect(() => {
    if (!safeValue.includes(MUST_HAVE)) {
      onChange([MUST_HAVE, ...safeValue]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeKey]);

  const toggle = (page) => {
    if (safeValue.includes(page)) {
      onChange(safeValue.filter((p) => p !== page));
    } else {
      onChange([...safeValue, page]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || safeValue.includes(trimmed)) return;
    onChange([...safeValue, trimmed]);
    setCustomInput("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {POPULAR_PAGE_LABELS.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => toggle(page)}
            disabled={page === "Ana Sayfa"}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${safeValue.includes(page) || page === "Ana Sayfa"
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
              } disabled:cursor-not-allowed disabled:opacity-80`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Özel sayfa ekle */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="Özel sayfa adı (ör: Galeri Sayfası)"
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Ekle
        </button>
      </div>

      {customPages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customPages.map((page) => (
            <span
              key={page}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800"
            >
              {page}
              <button
                type="button"
                onClick={() => onChange(safeValue.filter((p) => p !== page))}
                className="text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-400">
        Seçili: {safeValue.length > 0 ? safeValue.join(", ") : "Hiçbiri"}
      </p>
    </div>
  );
}
