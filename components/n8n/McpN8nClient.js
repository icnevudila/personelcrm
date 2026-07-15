"use client";

import { useState } from "react";

export default function McpN8nClient() {
  const [url, setUrl] = useState("https://icnevudila.app.n8n.cloud");
  const [inputUrl, setInputUrl] = useState("https://icnevudila.app.n8n.cloud");
  const [showConfig, setShowConfig] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    setUrl(inputUrl);
    setShowConfig(false);
  }

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Banner Config */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            n8n workflow motoru bağlı: <code className="rounded bg-zinc-100 px-1 py-0.5 text-violet-600 dark:bg-zinc-800">{url}</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {showConfig ? "Kapat" : "n8n URL Değiştir"}
        </button>
      </div>

      {showConfig && (
        <div className="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSave} className="flex max-w-md gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://n8n.siteniz.com"
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Kaydet
            </button>
          </form>
          <p className="mt-2 text-[10px] text-zinc-400">
            Not: iframe içinde açılabilmesi için n8n sunucusunda <code>N8N_RESTRICT_ACCESS_TO_IFRAME=false</code> set edilmiş olmalıdır.
          </p>
        </div>
      )}

      {/* Embedded Iframe */}
      <div className="flex-1">
        <iframe
          src={url}
          className="h-full w-full border-0"
          allow="geolocation; microphone; camera; midi; encrypted-media;"
          title="n8n Workflow Builder"
        ></iframe>
      </div>
    </div>
  );
}
