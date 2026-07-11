"use client";

import { useState } from "react";

export default function PromptModal({ text, onClose }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
            a.download = "site-prompt.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">AI Edit&ouml;r Prompt&apos;u</h3>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {copied ? "Kopyalandı!" : "Kopyala"}
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              İndir (.md)
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
            {text}
          </pre>
        </div>
      </div>
    </div>
  );
}
