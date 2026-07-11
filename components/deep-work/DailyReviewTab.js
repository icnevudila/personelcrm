"use client";

import { useEffect, useState } from "react";
import { fetchReview, saveReview } from "@/lib/deep-work/clientApi";
import { todayDateStr } from "@/lib/deep-work/dateUtils";
import { inputCls } from "@/components/deep-work/TaskCard";

export default function DailyReviewTab() {
  const [form, setForm] = useState({
    today_summary: "",
    tomorrow_first_task: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchReview(todayDateStr())
      .then((data) => {
        if (data) {
          setForm({
            today_summary: data.today_summary || "",
            tomorrow_first_task: data.tomorrow_first_task || "",
            notes: data.notes || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await saveReview({ ...form, review_date: todayDateStr() });
      setMsg("Gün sonu değerlendirmesi kaydedildi.");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</p>;

  return (
    <div className="max-w-xl">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gün Sonu Değerlendirmesi</h3>
        <p className="text-sm text-zinc-500">Günü kapatmadan önce kısa bir değerlendirme yapın.</p>
      </div>
      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Bugün ne yaptım?</label>
          <textarea
            rows={3}
            value={form.today_summary}
            onChange={(e) => setForm((p) => ({ ...p, today_summary: e.target.value }))}
            className={`${inputCls} resize-none`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Yarın ilk yapacağım iş</label>
          <input
            type="text"
            value={form.tomorrow_first_task}
            onChange={(e) => setForm((p) => ({ ...p, tomorrow_first_task: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Not</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className={`${inputCls} resize-none`}
          />
        </div>
        {msg && <p className={`text-sm ${msg.includes("kaydedildi") ? "text-emerald-600" : "text-red-600"}`}>{msg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
