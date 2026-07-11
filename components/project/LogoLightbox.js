"use client";

import { useEffect } from "react";
import { downloadLogoFile, safeLogoSlug } from "@/lib/logoUtils";

function DownloadIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}

function RemoveBgIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7.5 16.5l3-4 2.25 3 1.5-2.25L15 16.5h-7.5z" />
    </svg>
  );
}

function ChevronIcon({ className, direction }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {direction === "left" ? (
        <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
      ) : (
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      )}
    </svg>
  );
}

export default function LogoLightbox({
  items,
  index,
  projectName,
  onClose,
  onPrev,
  onNext,
  onRemoveBg,
  removingBgId,
}) {
  const item = items[index];
  const downloadName = `${safeLogoSlug(projectName)}.png`;
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const isRemoving = removingBgId === item?.id;

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />

      {hasPrev && (
        <button
          type="button"
          onClick={onPrev}
          aria-label="Önceki logo"
          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-lg hover:bg-white sm:left-6 sm:h-12 sm:w-12"
        >
          <ChevronIcon className="h-6 w-6" direction="left" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label="Sonraki logo"
          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-lg hover:bg-white sm:right-6 sm:h-12 sm:w-12"
        >
          <ChevronIcon className="h-6 w-6" direction="right" />
        </button>
      )}

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {projectName}
            </p>
            <p className="text-xs text-zinc-500">
              {index + 1} / {items.length}
              {item.created_at &&
                ` · ${new Date(item.created_at).toLocaleString("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onRemoveBg(item)}
              disabled={!!removingBgId}
              title="Arka planı sil"
              aria-label="Arka planı sil"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {isRemoving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              ) : (
                <RemoveBgIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => downloadLogoFile(item.logo_url, downloadName)}
              title="İndir"
              aria-label="Logoyu indir"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Kapat
            </button>
          </div>
        </div>

        <div
          className="flex flex-1 items-center justify-center overflow-auto p-6"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.logo_url}
            alt={`${projectName} logosu`}
            className="max-h-[65vh] w-full max-w-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export { DownloadIcon, RemoveBgIcon };
