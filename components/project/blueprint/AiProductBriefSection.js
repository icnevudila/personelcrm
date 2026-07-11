"use client";

import { useState } from "react";
import { SectionCard, textareaCls, btnPrimaryCls, labelCls } from "./ui";
import { generateBlueprintBrief } from "@/lib/productBlueprint/clientApi";

export default function AiProductBriefSection({ projectId, onBriefGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coachMessage, setCoachMessage] = useState("");
  const [hint, setHint] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setCoachMessage("");

    try {
      const result = await generateBlueprintBrief(projectId, hint);
      setCoachMessage(result.message || "Blueprint başarıyla oluşturuldu.");
      onBriefGenerated?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="AI Product Assistant"
      description="ChatGPT ile ürün blueprint'ini otomatik oluşturun — özet, hedef kitle, özellikler, MVP ve daha fazlası."
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-sky-300 bg-sky-50/50 px-6 py-6 text-center dark:border-sky-800 dark:bg-sky-950/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50">
            <svg className="h-6 w-6 text-sky-600 dark:text-sky-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 0 0-6.08 10.52L2 22l9.48-3.92A7 7 0 1 0 12 2zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm-1 2h2v2h-2V6zm0 4h2v4h-2v-4z" />
            </svg>
          </div>
          <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Proje bilgileriniz analiz edilir. AI; ürün özeti, problem/çözüm, hedef kitle, ICP, value proposition,
            özellikler, MVP kapsamı, metrikler, rakipler, tech stack ve vizyonu otomatik doldurur.
          </p>
        </div>

        <div>
          <label className={labelCls}>Ek talimat (isteğe bağlı)</label>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Örn: B2B SaaS, Türkiye pazarı, freemium model, mobil öncelikli…"
            className={textareaCls}
            rows={2}
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleGenerate} disabled={loading} className={btnPrimaryCls}>
            {loading ? "AI blueprint oluşturuyor…" : "Blueprint Oluştur"}
          </button>
          {loading && (
            <span className="text-sm text-zinc-400">Bu işlem 15-30 saniye sürebilir…</span>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        {coachMessage && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/30">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
              AI Özeti
            </p>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{coachMessage}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
