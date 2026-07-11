"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoSection({
  logoUrl,
  logoGenerate,
  logoAiUrls,
  sector,
  businessName,
  services,
  colorPalette,
  projectId,
  onLogoChange,
  onAiGenerated,
}) {
  const fileRef = useRef(null);
  const [mode, setMode] = useState(logoGenerate === false ? "manual" : "ai");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const supabase = createClient();

  const aiUrls = Array.isArray(logoAiUrls) ? logoAiUrls : [];
  const alreadyGenerated = aiUrls.length > 0;

  async function handleGenerate() {
    if (alreadyGenerated) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          sector,
          services,
          color_palette: colorPalette,
          project_id: projectId,
        }),
      });
      const data = await res.json();
      if (data.urls?.length) {
        onAiGenerated(data.urls);
        // İlk logoyu varsayılan seç
        onLogoChange(data.urls[0]);
      } else {
        setError(data.error || "Logo üretilemedi");
      }
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setGenerating(false);
    }
  }

  async function uploadFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Dosya 5 MB'tan büyük olamaz");
      return;
    }
    setUploading(true);
    setError("");
    const path = `${projectId || "public"}/manual-logo-${Date.now()}-${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from("crm-logos")
      .upload(path, file, { upsert: true });
    setUploading(false);
    if (uploadError) {
      setError("Yükleme hatası: " + uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from("crm-logos").getPublicUrl(data.path);
    onLogoChange(urlData.publicUrl);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleModeChange(newMode) {
    setMode(newMode);
    onLogoChange(""); // seçili logoyu sıfırla
  }

  return (
    <div className="space-y-4">
      {/* Radio seçimi */}
      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="logo_mode"
            value="ai"
            checked={mode === "ai"}
            onChange={() => handleModeChange("ai")}
            className="accent-indigo-600"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            AI Logo Oluşturucu
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="logo_mode"
            value="manual"
            checked={mode === "manual"}
            onChange={() => handleModeChange("manual")}
            className="accent-indigo-600"
          />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Logomu kendim yükleyeceğim
          </span>
        </label>
      </div>

      {/* ===== AI MODU ===== */}
      {mode === "ai" && (
        <div className="space-y-4">
          {!alreadyGenerated ? (
            /* Henüz üretilmemiş */
            <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 p-6 text-center dark:border-indigo-700 dark:bg-indigo-950/30">
              <p className="mb-1 text-sm font-medium text-indigo-900 dark:text-indigo-200">
                AI ile 3 farklı logo seçeneği oluşturun
              </p>
              <p className="mb-4 text-xs text-indigo-600 dark:text-indigo-400">
                Sektörünüze ve marka dilinize uygun 3 logo üretilecek ve kalıcı olarak kaydedilecek.
                Bu işlem yalnızca bir kez yapılabilir.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Logolar Üretiliyor… (bu ~30 sn sürebilir. Sayfayı yenilemeyin!)
                  </>
                ) : (
                  "AI ile 3 Logo Üret"
                )}
              </button>
            </div>
          ) : (
            /* Üretilmiş — seçim */
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Logonuzu seçin:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {aiUrls.map((url, i) => {
                  const isSelected = logoUrl === url;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onLogoChange(url)}
                      className={`group relative overflow-hidden rounded-xl border-2 bg-white p-2 transition-all dark:bg-zinc-800 ${isSelected
                        ? "border-indigo-600 shadow-md shadow-indigo-100 dark:border-indigo-400"
                        : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                        }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Logo ${i + 1}`}
                        className="aspect-square w-full object-contain"
                      />
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                          ✓
                        </div>
                      )}
                      <p className="mt-1.5 text-center text-xs text-zinc-500">
                        {isSelected ? "Seçili" : `Logo ${i + 1}`}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-400">
                Logo değiştirmek isterseniz &ldquo;Logomu kendim yükleyeceğim&rdquo; seçeneğine geçin.
              </p>
            </div>
          )}
        </div>
      )}


      {/* ===== MANUEL MODU ===== */}
      {mode === "manual" && (
        <div className="space-y-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragOver
              ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/30"
              : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
              }`}
          >
            <div className="flex flex-col items-center gap-2">
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {uploading ? "Yükleniyor…" : "Logoyu buraya sürükleyin veya tıklayın"}
              </p>
              <p className="text-xs text-zinc-400">PNG, JPG, SVG — maks. 5 MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>
      )}

      {/* Seçili / yüklenen logo önizlemesi */}
      {logoUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Seçili logo"
            className="h-16 w-16 rounded-lg border border-zinc-200 bg-white object-contain p-1 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {mode === "ai" ? "Seçili AI Logosu" : "Yüklenen Logo"}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-zinc-400">
              {logoUrl.split("/").pop()}
            </p>
            <button
              type="button"
              onClick={() => onLogoChange("")}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Kaldır
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
