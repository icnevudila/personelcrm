"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionCard, inputCls, textareaCls, labelCls, btnPrimaryCls } from "./ui";
import { patchBlueprint } from "@/lib/marketing/clientApi";

export default function MarketingScoreSection({ projectId, blueprint, onUpdate }) {
  const [score, setScore] = useState(blueprint?.marketing_score ?? 0);
  const [summary, setSummary] = useState(blueprint?.score_summary || "");
  const [gapsText, setGapsText] = useState((blueprint?.score_gaps || []).join("\n"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScore(blueprint?.marketing_score ?? 0);
    setSummary(blueprint?.score_summary || "");
    setGapsText((blueprint?.score_gaps || []).join("\n"));
  }, [blueprint]);

  async function handleSave() {
    setSaving(true);
    try {
      const gaps = gapsText
        .split("\n")
        .map((g) => g.trim())
        .filter(Boolean);
      const updated = await patchBlueprint(projectId, {
        marketing_score: Number(score),
        score_summary: summary,
        score_gaps: gaps,
      });
      onUpdate(updated);
    } finally {
      setSaving(false);
    }
  }

  const gaps = gapsText.split("\n").filter((g) => g.trim());

  return (
    <SectionCard
      title="Marketing Score"
      description="AI analiz kartı — skor ve eksikler burada yönetilir."
      action={
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimaryCls}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-zinc-50 px-6 py-4 dark:bg-zinc-800/50">
          <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{score}</span>
          <span className="text-sm text-zinc-500">/ 100</span>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label className={labelCls}>Skor (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Özet</label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Henüz pazarlama planı oluşturulmamış."
              className={inputCls}
            />
          </div>
          {gaps.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">Eksikler</p>
              <ul className="space-y-1">
                {gaps.map((gap) => (
                  <li key={gap} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <label className={labelCls}>Eksikler (her satır bir madde)</label>
            <textarea value={gapsText} onChange={(e) => setGapsText(e.target.value)} className={textareaCls} rows={4} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
