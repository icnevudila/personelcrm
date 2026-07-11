"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FIXED_LOGO_PROMPT,
  buildDefaultLogoPrompt,
  downloadLogoFile,
  isValidLogoPrompt,
  safeLogoSlug,
} from "@/lib/logoUtils";

function DownloadIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}

export default function LogoGenerateModal({
  open,
  onClose,
  projectId,
  projectName,
  projectDescription = "",
  onGenerated,
}) {
  const defaultPrompt = useMemo(
    () => buildDefaultLogoPrompt(projectName, projectDescription),
    [projectName, projectDescription]
  );

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPrompt(defaultPrompt);
    setSubmitting(false);
    setError("");
    setPreview(null);
  }, [open, defaultPrompt]);

  const promptLen = useMemo(() => String(prompt || "").trim().length, [prompt]);
  const canGenerate = isValidLogoPrompt(prompt) && !submitting;

  if (!open) return null;

  async function handleGenerate() {
    if (!canGenerate) return;
    setSubmitting(true);
    setError("");
    setPreview(null);
    try {
      const res = await fetch("/api/logo-generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Logo üretilemedi");
      if (!data?.item?.logo_url) throw new Error("Logo URL alınamadı");

      setPreview(data.item);
      onGenerated?.(data.item);
    } catch (e) {
      setError(e?.message || "Bağlantı hatası");
    } finally {
      setSubmitting(false);
    }
  }

  const downloadName = `${safeLogoSlug(projectName)}.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Yeni Logo</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {projectName} — sabit prompt otomatik uygulanır, aşağıdaki metni düzenleyebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!submitting) onClose();
            }}
            className="shrink-0 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Sabit prompt
            </span>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              {FIXED_LOGO_PROMPT}
            </div>
          </div>

          <label className="block space-y-1">
            <div className="flex items-end justify-between gap-2">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Ek prompt
              </span>
              <span className={`text-xs ${promptLen >= 100 ? "text-emerald-600" : "text-zinc-500"}`}>
                {promptLen}/100 min.
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={7}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-indigo-600 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Sektör, stil, renk ve ikon fikirlerinizi yazın…"
            />
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Üretiliyor…
                </>
              ) : (
                "Logo üret"
              )}
            </button>

            {preview?.logo_url ? (
              <button
                type="button"
                onClick={() => downloadLogoFile(preview.logo_url, downloadName)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <DownloadIcon className="h-4 w-4" />
                İndir
              </button>
            ) : (
              <span className="text-xs text-zinc-500">Üretim sonrası önizleme burada görünür.</span>
            )}
          </div>

          {preview?.logo_url && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <div className="border-b border-zinc-100 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                Önizleme
              </div>
              <div className="bg-white p-4 dark:bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.logo_url}
                  alt={`${projectName} logo önizleme`}
                  className="mx-auto aspect-square w-full max-w-xs object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
