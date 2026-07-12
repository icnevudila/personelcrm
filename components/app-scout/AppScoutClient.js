"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score == null) return { ring: "border-zinc-300", text: "text-zinc-500", bg: "bg-zinc-50" };
  if (score >= 70) return { ring: "border-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (score >= 40) return { ring: "border-amber-400", text: "text-amber-600", bg: "bg-amber-50" };
  return { ring: "border-red-400", text: "text-red-600", bg: "bg-red-50" };
}

function verdictBg(color) {
  if (color === "green") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (color === "yellow") return "bg-amber-50 text-amber-700 border-amber-200";
  if (color === "red") return "bg-red-50 text-red-700 border-red-200";
  return "bg-zinc-50 text-zinc-700 border-zinc-200";
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg max-w-sm">
      <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <div className="flex-1 text-sm text-red-700">{message}</div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
    </div>
  );
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const c = scoreColor(score);
  return (
    <div className={`flex h-28 w-28 items-center justify-center rounded-full border-4 ${c.ring} ${c.bg} shrink-0`}>
      <div className="text-center">
        <div className={`text-3xl font-bold ${c.text}`}>{score ?? "—"}</div>
        <div className="text-xs text-zinc-400">/100</div>
      </div>
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────

function ResultPanel({ analysis, onSendTelegram, sending }) {
  if (!analysis) return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10">
      <div className="text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <p className="text-sm text-zinc-400">Analiz sonucu burada görüntülenecek</p>
      </div>
    </div>
  );

  const r = analysis;
  const sc = scoreColor(r.opportunity_score);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
      {/* header */}
      <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5">
        <ScoreRing score={r.opportunity_score} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-zinc-900 truncate">{r.app_name}</h2>
          {r.category && <span className="mt-1 inline-block rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500">{r.category}</span>}
          {r.verdict && (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-sm font-medium ${verdictBg(r.verdict_color)}`}>
              {r.verdict}
            </div>
          )}
          {r.revenue_estimate && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-600">
              <span>💰</span>
              <span>{r.revenue_estimate}</span>
            </p>
          )}
        </div>
      </div>

      {/* market analysis */}
      {r.market_analysis && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Pazar Analizi</h3>
          <p className="text-sm leading-relaxed text-zinc-700">{r.market_analysis}</p>
        </div>
      )}

      {/* strengths & risks */}
      {(r.strengths?.length > 0 || r.risks?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {r.strengths?.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Güçlü Yönler</h3>
              <ul className="space-y-1.5">
                {r.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="shrink-0">✅</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {r.risks?.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Riskler</h3>
              <ul className="space-y-1.5">
                {r.risks.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="shrink-0">⚠️</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* recommendation */}
      {r.recommendation && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Öneri</h3>
          <p className="text-sm italic leading-relaxed text-zinc-600">{r.recommendation}</p>
        </div>
      )}

      {/* competitors */}
      {r.competitors?.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Rakipler</h3>
          <ul className="divide-y divide-zinc-100">
            {r.competitors.map((c, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-zinc-800">{c.name}</span>
                <div className="flex items-center gap-3 text-zinc-500">
                  {c.rating != null && <span>⭐ {c.rating}</span>}
                  {c.price && <span>{c.price}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* telegram */}
      <button
        onClick={onSendTelegram}
        disabled={sending}
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
      >
        {sending ? (
          <>
            <Spinner />
            Gönderiliyor…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.945-.918c-.64-.203-.653-.64.135-.954l11.566-4.461c.537-.194 1.006.131.968.887z"/>
            </svg>
            Telegram'a Gönder
          </>
        )}
      </button>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AppScoutClient() {
  // form state
  const [appName, setAppName] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [category, setCategory] = useState("");
  const [screenshots, setScreenshots] = useState([]); // array of URLs
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [sendingTelegram, setSendingTelegram] = useState(false);

  // history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // toast
  const [toast, setToast] = useState(null);

  function showError(msg) {
    setToast(msg);
  }

  // ── load history ──
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/app-scout/analyses", { credentials: "include" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setHistory(data?.analyses ?? data ?? []);
    } catch (e) {
      showError("Geçmiş analizler yüklenemedi: " + e.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── file upload ──
  async function uploadFile(file) {
    if (screenshots.length >= 5) {
      showError("En fazla 5 görsel yükleyebilirsiniz.");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(`/api/app-scout/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setScreenshots((prev) => [...prev, data.url]);
    } catch (e) {
      showError("Görsel yüklenemedi: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    imgs.slice(0, 5 - screenshots.length).forEach(uploadFile);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  // ── analyze ──
  async function handleAnalyze(e) {
    e.preventDefault();
    if (!appName.trim()) { showError("Uygulama adı zorunludur."); return; }
    setAnalyzing(true);
    try {
      // 1. create analysis
      const createRes = await fetch("/api/app-scout/analyses", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_name: appName, app_description: appDesc, category, screenshots }),
      });
      if (!createRes.ok) throw new Error(await createRes.text());
      const created = await createRes.json();
      const id = created?.analysis?.id ?? created?.id;

      // 2. trigger AI analysis
      const analyzeRes = await fetch(`/api/app-scout/analyses/${id}/analyze`, {
        method: "POST",
        credentials: "include",
      });
      if (!analyzeRes.ok) throw new Error(await analyzeRes.text());
      const analyzed = await analyzeRes.json();

      const result = analyzed?.analysis ?? analyzed;
      setSelectedAnalysis(result);
      await loadHistory();
    } catch (e) {
      showError("Analiz başarısız: " + e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  // ── send telegram ──
  async function handleSendTelegram() {
    if (!selectedAnalysis?.id) return;
    setSendingTelegram(true);
    try {
      const res = await fetch(`/api/app-scout/analyses/${selectedAnalysis.id}/send-telegram`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      showError("Telegram gönderilemedi: " + e.message);
    } finally {
      setSendingTelegram(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">App Scout</h1>
        <p className="mt-1 text-sm text-zinc-500">AI destekli uygulama fırsat analizi</p>
      </div>

      {/* main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* ── left: form ── */}
        <div className="flex flex-col gap-4">
          <form
            onSubmit={handleAnalyze}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
          >
            <h2 className="text-sm font-semibold text-zinc-700">Yeni Analiz</h2>

            {/* app name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Uygulama Adı <span className="text-red-500">*</span>
              </label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="örn. Notion, Headspace…"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition"
              />
            </div>

            {/* description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Açıklama</label>
              <textarea
                value={appDesc}
                onChange={(e) => setAppDesc(e.target.value)}
                rows={3}
                placeholder="Uygulama ne yapıyor, hedef kitle kim?"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-none transition"
              />
            </div>

            {/* category */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Kategori</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="örn. Productivity, Health…"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition"
              />
            </div>

            {/* screenshots */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Ekran Görüntüleri ({screenshots.length}/5)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition ${
                  dragOver ? "border-zinc-400 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                }`}
              >
                {uploading ? (
                  <><Spinner /><span className="text-xs text-zinc-400">Yükleniyor…</span></>
                ) : (
                  <>
                    <svg className="h-6 w-6 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    <span className="text-xs text-zinc-400">Görselleri sürükle bırak veya tıkla</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {screenshots.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {screenshots.map((url, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-12 w-12 rounded-md border border-zinc-200 object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setScreenshots((p) => p.filter((_, j) => j !== i)); }}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-white text-xs leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={analyzing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              {analyzing ? (
                <><Spinner />AI analiz ediyor…</>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  Analiz Et
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── right: result ── */}
        <ResultPanel
          analysis={selectedAnalysis}
          onSendTelegram={handleSendTelegram}
          sending={sendingTelegram}
        />
      </div>

      {/* ── history ── */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Geçmiş Analizler</h2>
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          {historyLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-400">Henüz analiz yok</div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {history.map((item) => {
                const sc = scoreColor(item.opportunity_score);
                return (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-zinc-900 truncate">{item.app_name}</span>
                        {item.opportunity_score != null && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${sc.ring} ${sc.text} ${sc.bg}`}>
                            {item.opportunity_score}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                        {item.verdict && <span>{item.verdict}</span>}
                        <span>·</span>
                        <span>{fmt(item.created_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAnalysis(item)}
                      className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      Detay
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
