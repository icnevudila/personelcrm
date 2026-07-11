"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AUTO_SAVE_MS = 2000;

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PromptTab({ projectId, initialSetupPrompt = "" }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialSetupPrompt || "");
  const [savedPrompt, setSavedPrompt] = useState(initialSetupPrompt || "");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const savingRef = useRef(false);

  const isDirty = prompt !== savedPrompt;

  const savePrompt = useCallback(
    async (manual = false) => {
      if (!isDirty && !manual) return;
      if (savingRef.current) return;

      savingRef.current = true;
      setSaveStatus("saving");
      setErrorMsg("");

      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setup_prompt: prompt }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Kaydedilemedi");

        setSavedPrompt(prompt);
        setSaveStatus("saved");
        router.refresh();
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch (err) {
        setSaveStatus("error");
        setErrorMsg(err.message);
      } finally {
        savingRef.current = false;
      }
    },
    [projectId, prompt, savedPrompt, isDirty, router]
  );

  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => savePrompt(false), AUTO_SAVE_MS);
    return () => clearTimeout(timer);
  }, [prompt, isDirty, savePrompt]);

  const textareaCls =
    "w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[20rem] sm:min-h-[28rem]";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Kurulum Prompt</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Projenin kurulum detaylarını, AI talimatlarını ve teknik notları buraya yazın. Değişiklikler otomatik kaydedilir.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
              <CheckIcon className="h-4 w-4" />
              Kaydedildi
            </span>
          )}
          {saveStatus === "saving" && (
            <span className="text-sm text-zinc-400">Kaydediliyor…</span>
          )}
          {saveStatus === "error" && errorMsg && (
            <span className="text-sm text-red-600">{errorMsg}</span>
          )}
          {isDirty && saveStatus === "idle" && (
            <span className="text-xs text-zinc-400">Kaydedilmemiş değişiklik</span>
          )}
          <button
            type="button"
            onClick={() => savePrompt(true)}
            disabled={saveStatus === "saving" || !isDirty}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Kaydet
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className={textareaCls}
          placeholder="Örn: Sektör, hedef kitle, sayfa yapısı, renk tercihleri, özel istekler, entegrasyonlar..."
          spellCheck={false}
        />
      </div>
      <p className="text-xs text-zinc-400">
        Otomatik kayıt: yazmayı bıraktıktan {AUTO_SAVE_MS / 1000} saniye sonra.
      </p>
    </div>
  );
}
