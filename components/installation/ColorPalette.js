"use client";

import { useState } from "react";

const PRESET_PALETTES = [
  {
    name: "Okyanus Mavisi",
    colors: { primary: "#0077B6", secondary: "#00B4D8", accent: "#90E0EF", background: "#F8FAFF", text: "#03045E" },
  },
  {
    name: "Orman Yeşili",
    colors: { primary: "#2D6A4F", secondary: "#52B788", accent: "#95D5B2", background: "#F8FFF9", text: "#1B4332" },
  },
  {
    name: "Altın Sarısı",
    colors: { primary: "#D4A017", secondary: "#F2C94C", accent: "#FDEAA0", background: "#FFFDF2", text: "#7B4F00" },
  },
  {
    name: "Koyu Mor",
    colors: { primary: "#6C3483", secondary: "#A569BD", accent: "#D2B4DE", background: "#FAF0FE", text: "#2E0854" },
  },
  {
    name: "Yakut Kırmızı",
    colors: { primary: "#C0392B", secondary: "#E74C3C", accent: "#FADBD8", background: "#FFF9F9", text: "#7B241C" },
  },
  {
    name: "Kurumsal Lacivert",
    colors: { primary: "#1A237E", secondary: "#283593", accent: "#5C6BC0", background: "#F5F6FF", text: "#0D1243" },
  },
  {
    name: "Turkuaz & Mercan",
    colors: { primary: "#00897B", secondary: "#FF6B35", accent: "#B2DFDB", background: "#F0FAFA", text: "#004D40" },
  },
  {
    name: "Karanlık Çelik",
    colors: { primary: "#212121", secondary: "#424242", accent: "#757575", background: "#FAFAFA", text: "#212121" },
  },
  {
    name: "Gün Batımı",
    colors: { primary: "#E64A19", secondary: "#FF7043", accent: "#FFCCBC", background: "#FFF9F6", text: "#BF360C" },
  },
  {
    name: "Nane Yeşil",
    colors: { primary: "#00796B", secondary: "#26A69A", accent: "#B2DFDB", background: "#F4FFFD", text: "#004D40" },
  },
];

const COLOR_KEYS = ["primary", "secondary", "accent", "background", "text"];
const COLOR_LABELS = {
  primary: "Ana",
  secondary: "İkincil",
  accent: "Vurgu",
  background: "Arkaplan",
  text: "Metin",
};

export default function ColorPalette({
  value,
  onChange,
  sector,
  brandTone,
  mainGoal,
  projectId,
  mode = "preset",
  aiPalettes = [],
  onModeChange,
  onAIGenerated,
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(value || { primary: "#000000", secondary: "#444444", accent: "#888888", background: "#ffffff", text: "#111111" });

  const safeMode = ["ai", "preset", "manual"].includes(mode) ? mode : "preset";
  const generatedAiPalettes = Array.isArray(aiPalettes) ? aiPalettes : [];
  const hasGeneratedAiPalettes = generatedAiPalettes.length > 0;
  const displayPalettes = safeMode === "ai" ? generatedAiPalettes : PRESET_PALETTES;
  const showGenerateSection = safeMode === "ai" && !hasGeneratedAiPalettes;

  async function handleAIGenerate() {
    if (hasGeneratedAiPalettes) return;
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,
          brand_tone: brandTone,
          main_goal: mainGoal,
          project_id: projectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI renk paleti üretilemedi.");

      const palettes = Array.isArray(data.palettes) ? data.palettes : [];
      if (!palettes.length) throw new Error("AI geçerli bir palet üretemedi.");

      onAIGenerated?.(palettes);
      onModeChange?.("ai");
    } catch (err) {
      setError(err.message || "AI renk paleti üretilemedi.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleModeChange(nextMode) {
    onModeChange?.(nextMode);
    setError("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {[
          { key: "ai", label: "AI ile oluştur" },
          { key: "preset", label: "Hazır renkler" },
          { key: "manual", label: "Elle gir" },
        ].map((option) => (
          <label key={option.key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
            <input
              type="radio"
              name="color_palette_mode"
              value={option.key}
              checked={safeMode === option.key}
              onChange={() => handleModeChange(option.key)}
              className="accent-indigo-600"
            />
            {option.label}
          </label>
        ))}
      </div>

      {showGenerateSection && (
        <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-700 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
            AI ile 3 farklı renk paleti oluşturabilirsiniz.
          </p>
          <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
            Bu işlem bir kez yapılır ve üretilen paletler otomatik kaydedilir.
          </p>
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiLoading}
            className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {aiLoading ? "Üretiliyor..." : "AI Uyumlu Palet Üret"}
          </button>
        </div>
      )}

      {safeMode === "manual" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COLOR_KEYS.map((key) => (
            <div key={key} className="text-center">
              <label className="text-xs text-zinc-500">{COLOR_LABELS[key]}</label>
              <div className="relative mt-1">
                <div
                  className="h-12 w-full cursor-pointer rounded-xl border border-zinc-200 dark:border-zinc-700"
                  style={{ background: manual[key] || "#ffffff" }}
                  onClick={() => document.getElementById(`color-${key}`)?.click()}
                />
                <input
                  id={`color-${key}`}
                  type="color"
                  value={manual[key] || "#ffffff"}
                  onChange={(e) => {
                    const updated = { ...manual, [key]: e.target.value };
                    setManual(updated);
                    onChange(updated);
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <input
                type="text"
                value={manual[key] || ""}
                onChange={(e) => {
                  const updated = { ...manual, [key]: e.target.value };
                  setManual(updated);
                  onChange(updated);
                }}
                className="mt-1 w-full rounded border border-zinc-200 px-1 py-0.5 text-center font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                maxLength={7}
              />
            </div>
          ))}
        </div>
      ) : displayPalettes.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {displayPalettes.map((palette, i) => {
            const isSelected = JSON.stringify(value) === JSON.stringify(palette.colors);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(palette.colors)}
                className={`rounded-xl border p-3 text-left transition-all hover:shadow-md ${isSelected
                  ? "border-zinc-900 shadow-sm dark:border-zinc-100"
                  : "border-zinc-200 dark:border-zinc-700"
                  }`}
              >
                <div className="mb-2 flex items-center">
                  {COLOR_KEYS.map((k) => (
                    <div
                      key={k}
                      className="-ml-2 h-7 w-7 rounded-full border-2 border-white shadow-sm first:ml-0 dark:border-zinc-900"
                      style={{ background: palette.colors[k] }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{palette.name}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Lütfen yukarıdaki buton ile AI Uyumlu renk paleti üretiniz.
        </p>
      )}


      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
