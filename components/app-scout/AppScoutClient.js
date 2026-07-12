"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export default function AppScoutClient() {
  const [analyses, setAnalyses] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [category, setCategory] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [sendingTelegram, setSendingTelegram] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  async function fetchAnalyses() {
    try {
      const res = await fetch("/api/app-scout/analyses");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalyses(data.analyses || []);
      if (data.analyses?.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(data.analyses[0]);
      }
    } catch (err) {
      toast.error("Analiz geçmişi yüklenemedi: " + err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (screenshots.length + files.length > 5) {
      toast.error("En fazla 5 ekran görüntüsü yükleyebilirsiniz.");
      return;
    }

    setUploading(true);
    const uploadedUrls = [...screenshots];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/app-scout/upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        uploadedUrls.push(data.url);
      } catch (err) {
        toast.error(`${file.name} yüklenemedi: ${err.message}`);
      }
    }

    setScreenshots(uploadedUrls);
    setUploading(false);
  }

  function removeScreenshot(indexToRemove) {
    setScreenshots(screenshots.filter((_, i) => i !== indexToRemove));
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!appName.trim()) return;

    setAnalyzing(true);
    const toastId = toast.loading("Analiz başlatılıyor...");

    try {
      // 1. Create analysis entry
      const createRes = await fetch("/api/app-scout/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName,
          app_description: appDescription,
          category,
          screenshots,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);

      toast.loading("AI App Store rakiplerini çekiyor ve analiz ediyor...", { id: toastId });

      // 2. Perform Gemini + iTunes analysis
      const analyzeRes = await fetch(`/api/app-scout/analyses/${createData.analysis.id}/analyze`, {
        method: "POST",
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);

      toast.success("Analiz başarıyla tamamlandı!", { id: toastId });

      // Reset form
      setAppName("");
      setAppDescription("");
      setCategory("");
      setScreenshots([]);

      // Reload list & select new one
      setSelectedAnalysis(analyzeData.analysis);
      fetchAnalyses();
    } catch (err) {
      toast.error("Analiz başarısız: " + err.message, { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSendTelegram(id) {
    if (!id) return;
    setSendingTelegram(true);
    try {
      const res = await fetch(`/api/app-scout/analyses/${id}/send-telegram`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Rapor Telegram'a gönderildi!");
      fetchAnalyses(); // Update status
    } catch (err) {
      toast.error("Telegram gönderimi başarısız: " + err.message);
    } finally {
      setSendingTelegram(false);
    }
  }

  const scoreColor = (score) => {
    if (score >= 75) return "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30";
    if (score >= 45) return "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30";
    return "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30";
  };

  const verdictBadge = (color) => {
    const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold";
    if (color === "green") return `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400`;
    if (color === "yellow") return `${base} bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400`;
    if (color === "red") return `${base} bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400`;
    return `${base} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">App Scout</h1>
        <p className="text-sm text-zinc-500">
          Uygulama fikirlerini iTunes App Store rakipleri ve Gemini AI ile tarayın, gelir tahminlerini görün ve fırsatları skorlayın.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Yeni Fikir Analizi</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Uygulama Adı *</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="örn: Habit Tracker, Pomodoro Focus"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Kategori / Anahtar Kelimeler</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="örn: Productivity, Health"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Uygulama Açıklaması & Farkın</label>
                <textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Uygulamanın ne yapacağını ve rakiplerinden neyi farklı yapacağını açıklayın..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Ekran Görüntüleri (İsteğe bağlı, En fazla 5)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                />
                {uploading && <p className="text-xs text-amber-500 mt-1">Görseller yükleniyor...</p>}
                
                {screenshots.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {screenshots.map((url, i) => (
                      <div key={i} className="relative group w-12 h-12 rounded border border-zinc-200 overflow-hidden">
                        <img src={url} className="object-cover w-full h-full" alt="" />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(i)}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={analyzing || uploading}
                className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-zinc-800 disabled:opacity-50 transition-colors dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI Analiz Ediyor...
                  </>
                ) : "Fikri Analiz Et"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Details */}
        <div className="lg:col-span-7 space-y-4">
          {selectedAnalysis ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{selectedAnalysis.app_name}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Analiz Tarihi: {formatRelativeTime(selectedAnalysis.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={verdictBadge(selectedAnalysis.verdict_color)}>
                    {selectedAnalysis.verdict}
                  </span>
                  {selectedAnalysis.status === "done" && (
                    <button
                      onClick={() => handleSendTelegram(selectedAnalysis.id)}
                      disabled={sendingTelegram}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      ✈️ {sendingTelegram ? "Gönderiliyor..." : "Telegram'a At"}
                    </button>
                  )}
                </div>
              </div>

              {/* AI Details */}
              {selectedAnalysis.status === "done" && selectedAnalysis.ai_analysis && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Score */}
                  <div className={`rounded-xl border p-4 text-center ${scoreColor(selectedAnalysis.opportunity_score)}`}>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-85">Fırsat Skoru</p>
                    <p className="text-3xl font-extrabold mt-1">{selectedAnalysis.opportunity_score}/100</p>
                  </div>
                  
                  {/* Revenue */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tahmini Ciro</p>
                    <p className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1.5">
                      {selectedAnalysis.revenue_estimate || "Bilinmiyor"}
                    </p>
                  </div>

                  {/* Level */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rekabet Seviyesi</p>
                    <p className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1.5 uppercase">
                      {selectedAnalysis.ai_analysis.competition_level === "high" ? "🚨 Yüksek" :
                       selectedAnalysis.ai_analysis.competition_level === "medium" ? "⚠️ Orta" : "✅ Düşük"}
                    </p>
                  </div>
                </div>
              )}

              {/* Analysis Text */}
              {selectedAnalysis.ai_analysis?.market_analysis && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Pazar Analizi</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {selectedAnalysis.ai_analysis.market_analysis}
                  </p>
                </div>
              )}

              {/* Strengths & Risks */}
              {selectedAnalysis.ai_analysis && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  {selectedAnalysis.ai_analysis.strengths?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Güçlü Yönler & Avantajlar</h3>
                      <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                        {selectedAnalysis.ai_analysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="shrink-0 text-emerald-500">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedAnalysis.ai_analysis.risks?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Riskler & Zorluklar</h3>
                      <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
                        {selectedAnalysis.ai_analysis.risks.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="shrink-0 text-red-500">⚠️</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedAnalysis.ai_analysis?.recommendation && (
                <div className="rounded-lg bg-indigo-50/50 p-4 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                  <h3 className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1">Stratejik Öneri</h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
                    "{selectedAnalysis.ai_analysis.recommendation}"
                  </p>
                </div>
              )}

              {/* iTunes Competitors */}
              {selectedAnalysis.competitors?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    App Store'daki Rakipler ({selectedAnalysis.competitors.length})
                  </h3>
                  <div className="divide-y divide-zinc-100 border rounded-xl overflow-hidden dark:divide-zinc-800 dark:border-zinc-800">
                    {selectedAnalysis.competitors.slice(0, 5).map((comp, i) => (
                      <div key={i} className="p-3 text-sm flex items-center justify-between gap-4 bg-zinc-50/30 dark:bg-zinc-900/30">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{comp.trackName}</p>
                          <p className="text-xs text-zinc-400 truncate">{comp.sellerName} • {comp.primaryGenreName}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {comp.price === 0 ? "Ücretsiz" : `$${comp.price}`}
                          </p>
                          {comp.averageUserRating && (
                            <p className="text-xs text-amber-500 font-semibold">
                              ⭐ {comp.averageUserRating.toFixed(1)} ({comp.userRatingCount})
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">
                Sol taraftan yeni bir fikir analiz edin veya aşağıdaki listeden geçmiş bir analizi seçin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Geçmiş Analizler</h2>
        {loadingHistory ? (
          <p className="text-sm text-zinc-500">Yükleniyor...</p>
        ) : analyses.length === 0 ? (
          <p className="text-sm text-zinc-500">Henüz hiç fikir analizi yapılmamış.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead>
                <tr className="text-zinc-500">
                  <th className="pb-3 font-semibold">Uygulama</th>
                  <th className="pb-3 font-semibold">Kategori</th>
                  <th className="pb-3 font-semibold">Fırsat Skoru</th>
                  <th className="pb-3 font-semibold">Ciro</th>
                  <th className="pb-3 font-semibold">Telegram Raporu</th>
                  <th className="pb-3 font-semibold">Tarih</th>
                  <th className="pb-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {analyses.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 font-medium text-zinc-900 dark:text-zinc-100">{item.app_name}</td>
                    <td className="py-3 text-zinc-500">{item.category || "—"}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === "done" ? scoreColor(item.opportunity_score) : "bg-zinc-100 text-zinc-400"}`}>
                        {item.status === "done" ? `${item.opportunity_score}/100` : item.status === "analyzing" ? "Analiz ediliyor..." : "Bekliyor"}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-600 dark:text-zinc-400">{item.revenue_estimate || "—"}</td>
                    <td className="py-3">
                      {item.telegram_sent ? (
                        <span className="text-emerald-500 font-semibold text-xs flex items-center gap-1">✈️ Gönderildi</span>
                      ) : (
                        <span className="text-zinc-400 text-xs">Gönderilmedi</span>
                      )}
                    </td>
                    <td className="py-3 text-zinc-400 text-xs">{formatRelativeTime(item.created_at)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedAnalysis(item)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Detay Gör
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
