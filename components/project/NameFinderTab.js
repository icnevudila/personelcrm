"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchNameCandidates,
  createNameCandidate,
  patchNameCandidate,
  deleteNameCandidate,
  generateNameCandidates,
  sortByFavorite,
} from "@/lib/projectCopy/clientApi";
import { FavoriteButton, SourceBadge } from "./copy/ui";
import PremiumAiLoader from "./PremiumAiLoader";

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
const textareaCls =
  "w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[4rem]";
const btnPrimaryCls =
  "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900";
const btnGhostCls =
  "rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

export default function NameFinderTab({ projectId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualName, setManualName] = useState("");
  const [hint, setHint] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const loadItems = useCallback(async () => {
    setError("");
    try {
      const data = await fetchNameCandidates(projectId);
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

  async function handleAddManual(e) {
    e.preventDefault();
    if (!manualName.trim()) return;
    try {
      const created = await createNameCandidate(projectId, { name: manualName.trim() });
      setItems(sortByFavorite([...items, created]));
      setManualName("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleGenerate() {
    setAiLoading(true);
    setAiMessage("");
    setError("");
    try {
      const result = await generateNameCandidates(projectId, hint);
      setItems(sortByFavorite(result.items));
      setAiMessage(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function toggleFavorite(item) {
    const updated = await patchNameCandidate(projectId, item.id, {
      is_favorited: !item.is_favorited,
    });
    setItems(sortByFavorite(items.map((i) => (i.id === item.id ? updated : i))));
  }

  async function handleDelete(id) {
    await deleteNameCandidate(projectId, id);
    setItems(items.filter((i) => i.id !== id));
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-zinc-400">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-4">
      <PremiumAiLoader
        loading={aiLoading}
        title="AI İsim Önerileri Arıyor"
        steps={[
          "Sektör ve rakip analizi yapılıyor...",
          "Marka kimliğine uygun kelimeler taranıyor...",
          "Yaratıcı ve akılda kalıcı isim alternatifleri türetiliyor...",
          "Kullanılabilirlik ve marka uygunluğu filtreleniyor..."
        ]}
      />
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Proje İsmi Bul</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Proje açıklaması ve blueprint kısa açıklamasına göre isim önerileri üretin. Favoriledikleriniz en üstte sabitlenir.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Manuel Ekle</h3>
        <form onSubmit={handleAddManual} className="mt-3 flex gap-2">
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Proje ismi yazın…"
            className={`${inputCls} flex-1`}
          />
          <button type="submit" className={btnPrimaryCls}>Ekle</button>
        </form>
      </div>

      <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50/40 p-4 dark:border-violet-800 dark:bg-violet-950/20">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI ile İsim Bul</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Mevcut proje adı dikkate alınmaz. Açıklama alanları doluysa daha isabetli öneriler üretilir.
        </p>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Ek talimat (isteğe bağlı): kısa isim, Türkçe, SaaS tarzı…"
          className={`${textareaCls} mt-3`}
          rows={2}
          disabled={aiLoading}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleGenerate} disabled={aiLoading} className={btnPrimaryCls}>
            {aiLoading ? "AI isim üretiyor…" : "AI ile İsim Bul"}
          </button>
          {aiLoading && <span className="text-xs text-zinc-400">15-30 saniye sürebilir…</span>}
        </div>
        {aiMessage && <p className="mt-2 text-sm text-violet-600 dark:text-violet-400">{aiMessage}</p>}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          İsimler ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
            Henüz isim eklenmedi. Manuel ekleyin veya AI ile üretin.
          </p>
        ) : (
          items.map((item) => (
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                  <SourceBadge source={item.source} />
                </div>
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
