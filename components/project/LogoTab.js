"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LogoGenerateModal from "@/components/project/LogoGenerateModal";
import LogoLightbox, { DownloadIcon, RemoveBgIcon } from "@/components/project/LogoLightbox";
import { downloadLogoFile, safeLogoSlug } from "@/lib/logoUtils";

const actionBtnCls =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 dark:bg-zinc-900/95 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800";

export default function LogoTab({ projectId, projectName, projectDescription = "" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [removingBgId, setRemovingBgId] = useState(null);
  const [removeBgError, setRemoveBgError] = useState("");
  const sentinelRef = useRef(null);

  const fetchMore = useCallback(
    async (initial = false) => {
      if (loadingMore) return;
      if (!initial && nextOffset == null) return;

      setLoadingMore(true);
      if (initial) setLoading(true);

      try {
        const offset = initial ? 0 : nextOffset || 0;
        const res = await fetch(
          `/api/logo-generations?project_id=${encodeURIComponent(projectId)}&offset=${offset}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Liste alınamadı");

        const newItems = Array.isArray(data?.items) ? data.items : [];
        setItems((prev) => (initial ? newItems : [...prev, ...newItems]));
        setNextOffset(data?.nextOffset ?? null);
      } catch {
        if (initial) setItems([]);
      } finally {
        setLoadingMore(false);
        if (initial) setLoading(false);
      }
    },
    [projectId, nextOffset, loadingMore]
  );

  useEffect(() => {
    fetchMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries?.[0]?.isIntersecting) fetchMore(false);
      },
      { root: null, rootMargin: "400px", threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [fetchMore, nextOffset, loadingMore]);

  function handleGenerated(item) {
    setItems((prev) => [item, ...prev.filter((it) => it.id !== item.id)]);
  }

  async function handleRemoveBg(logoItem) {
    if (removingBgId) return;
    setRemovingBgId(logoItem.id);
    setRemoveBgError("");
    try {
      const res = await fetch("/api/logo-generations/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          source_logo_id: logoItem.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Arka plan silinemedi");

      setItems((prev) => [data.item, ...prev.filter((it) => it.id !== data.item.id)]);
      if (lightboxIndex != null) {
        setLightboxIndex(0);
      }
    } catch (e) {
      setRemoveBgError(e?.message || "Bir hata oluştu");
    } finally {
      setRemovingBgId(null);
    }
  }

  const downloadName = `${safeLogoSlug(projectName)}.png`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Logo</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Bu proje için AI ile logo üretin, arka planı silin ve indirin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Yeni Logo
        </button>
      </div>

      {removeBgError && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {removeBgError}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Henüz logo üretilmedi.</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            İlk logoyu üret
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Üretilen logolar
            </p>
            <p className="text-xs text-zinc-500">{items.length} kayıt</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it, index) => {
              const isRemoving = removingBgId === it.id;
              return (
                <div
                  key={it.id}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="relative block aspect-square w-full cursor-zoom-in bg-white dark:bg-zinc-950"
                    aria-label="Logoyu büyüt"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={it.logo_url}
                      alt={`${projectName} logosu`}
                      className="h-full w-full object-contain p-3"
                      loading="lazy"
                    />
                  </button>

                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBg(it);
                      }}
                      disabled={!!removingBgId}
                      title="Arka planı sil"
                      aria-label="Arka planı sil"
                      className={actionBtnCls}
                    >
                      {isRemoving ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                      ) : (
                        <RemoveBgIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadLogoFile(it.logo_url, downloadName);
                      }}
                      title="İndir"
                      aria-label="Logoyu indir"
                      className={actionBtnCls}
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500">
                      {it.created_at
                        ? new Date(it.created_at).toLocaleString("tr-TR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={sentinelRef} className="h-8" />
          {loadingMore && (
            <p className="text-center text-xs text-zinc-500">Daha fazla yükleniyor…</p>
          )}
          {nextOffset == null && items.length > 0 && (
            <p className="text-center text-xs text-zinc-400">Tüm logolar listelendi.</p>
          )}
        </div>
      )}

      <LogoGenerateModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        projectName={projectName}
        projectDescription={projectDescription}
        onGenerated={handleGenerated}
      />

      {lightboxIndex != null && items[lightboxIndex] && (
        <LogoLightbox
          items={items}
          index={lightboxIndex}
          projectName={projectName}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(items.length - 1, i + 1))}
          onRemoveBg={handleRemoveBg}
          removingBgId={removingBgId}
        />
      )}
    </div>
  );
}
