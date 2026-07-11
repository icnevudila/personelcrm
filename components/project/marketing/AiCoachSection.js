"use client";

import { useState } from "react";
import { SectionCard, textareaCls, btnPrimaryCls, labelCls } from "./ui";
import { generateMarketingPlan } from "@/lib/marketing/clientApi";

export default function AiCoachSection({ projectId, onPlanGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coachMessage, setCoachMessage] = useState("");
  const [hint, setHint] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setCoachMessage("");

    try {
      const result = await generateMarketingPlan(projectId, hint);
      setCoachMessage(result.message || "Pazarlama planı başarıyla oluşturuldu.");
      onPlanGenerated?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="AI Marketing Coach"
      description="ChatGPT ile pazarlama planını otomatik oluşturun — skor, hedef kitle, kanallar, görevler ve içerik takvimi güncellenir."
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-6 py-6 text-center dark:border-violet-800 dark:bg-violet-950/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
            <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 0 0-6.08 10.52L2 22l9.48-3.92A7 7 0 1 0 12 2zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm-1 2h2v2h-2V6zm0 4h2v4h-2v-4z" />
            </svg>
          </div>
          <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Proje bilgileriniz ve mevcut marketing verileriniz analiz edilir. AI; skor, hedef kitle,
            funnel, kanallar, içerik stratejisi, haftalık plan, görevler ve içerik takvimini otomatik doldurur.
          </p>
        </div>

        <div>
          <label className={labelCls}>Ek talimat (isteğe bağlı)</label>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Örn: B2B SaaS odaklı olsun, LinkedIn öncelikli, launch için 2 haftalık plan…"
            className={textareaCls}
            rows={2}
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleGenerate} disabled={loading} className={btnPrimaryCls}>
            {loading ? "AI plan oluşturuyor…" : "Marketing Planı Oluştur"}
          </button>
          {loading && (
            <span className="text-sm text-zinc-400">
              Bu işlem 15-30 saniye sürebilir…
            </span>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        {coachMessage && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/30">
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
              AI Coach Özeti
            </p>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{coachMessage}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
