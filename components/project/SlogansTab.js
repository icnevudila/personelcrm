"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchSlogans,
  createSlogan,
  patchSlogan,
  deleteSlogan,
  generateSlogans,
  sortByFavorite,
} from "@/lib/projectCopy/clientApi";
import { COPY_TYPES, COPY_TYPE_LABELS } from "@/lib/projectCopy/constants";
import { FavoriteButton, SourceBadge } from "./copy/ui";
import PremiumAiLoader from "./PremiumAiLoader";

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const textareaCls =
  "w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[4rem]";
const selectCls = inputCls;
const btnPrimaryCls =
  "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900";

export default function SlogansTab({ projectId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualType, setManualType] = useState("slogan");
  const [aiType, setAiType] = useState("slogan");
  const [hint, setHint] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const loadItems = useCallback(async () => {
    setError("");
    try {
      const data = await fetchSlogans(projectId);
      setItems(sortByFavorite(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    if (filterType === "all") return items;
    return items.filter((i) => i.copy_type === filterType);
  }, [items, filterType]);

  async function handleAddManual(e) {
    e.preventDefault();
    if (!manualContent.trim()) return;
    try {
      const created = await createSlogan(projectId, {
        content: manualContent.trim(),
        copy_type: manualType,
      });
      setItems(sortByFavorite([...items, created]));
      setManualContent("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGenerate() {
    setAiLoading(true);
    setAiMessage("");
    setError("");
    try {
      const result = await generateSlogans(projectId, aiType, hint);
      setItems(sortByFavorite(result.items));
      setAiMessage(result.message);
      setFilterType(aiType);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function toggleFavorite(item) {
    const updated = await patchSlogan(projectId, item.id, {
      is_favorited: !item.is_favorited,
    });
    setItems(sortByFavorite(items.map((i) => (i.id === item.id ? updated : i))));
  }

  async function handleDelete(id) {
    await deleteSlogan(projectId, id);
    setItems(items.filter((i) => i.id !== id));
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-zinc-400">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-4">
      <PremiumAiLoader
        loading={aiLoading}
        title="AI Metin Üretiyor"
        steps={[
          "Marka tonu analiz ediliyor...",
          "Yaratıcı alternatifler aranıyor...",
          "Sloganlar ve satış metinleri tasarlanıyor...",
          "En iyi seçenekler seçilip listeleniyor..."
        ]}
      />
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Slogan & Satış Metinleri</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Proje açıklamalarına göre slogan, tagline, başlık ve satış metinleri üretin. Favoriler en üstte sabitlenir.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Manuel Ekle</h3>
        <form onSubmit={handleAddManual} className="mt-3 space-y-3">
          <select value={manualType} onChange={(e) => setManualType(e.target.value)} className={selectCls}>
            {COPY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            placeholder="Slogan veya satış metni yazın…"
            className={textareaCls}
            rows={3}
          />
          <button type="submit" className={btnPrimaryCls}>Ekle</button>
        </form>
      </div>

      <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI ile Üret</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Metin tipi</label>
            <select value={aiType} onChange={(e) => setAiType(e.target.value)} className={selectCls} disabled={aiLoading}>
              {COPY_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Ek talimat (isteğe bağlı): samimi ton, B2B, kısa ve vurucu…"
          className={`${textareaCls} mt-3`}
          rows={2}
          disabled={aiLoading}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleGenerate} disabled={aiLoading} className={btnPrimaryCls}>
            {aiLoading ? "AI üretiyor…" : "AI ile Üret"}
          </button>
          {aiLoading && <span className="text-xs text-zinc-400">15-30 saniye sürebilir…</span>}
        </div>
        {aiMessage && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{aiMessage}</p>}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            filterType === "all" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"
          }`}
        >
          Tümü
        </button>
        {COPY_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilterType(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filterType === t.id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Metinler ({filteredItems.length})
        </h3>
        {filteredItems.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
            Henüz metin eklenmedi.
          </p>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2 rounded-xl border p-3 ${
                item.is_favorited
                  ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <FavoriteButton favorited={item.is_favorited} onToggle={() => toggleFavorite(item)} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {COPY_TYPE_LABELS[item.copy_type] || item.copy_type}
                  </span>
                  <SourceBadge source={item.source} />
                </div>
                <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{item.content}</p>
                {item.notes && <p className="mt-1 text-xs text-zinc-500">{item.notes}</p>}
              </div>
              <button type="button" onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:underline">
                Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
