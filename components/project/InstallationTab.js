"use client";

import { useState, useEffect } from "react";
import InstallationForm from "@/components/installation/InstallationForm";

export default function InstallationTab({ projectId, publicToken: initialToken, isAdmin }) {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState(initialToken || null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = token ? `${origin}/public/form/${token}` : null;

  useEffect(() => {
    fetch(`/api/installation/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setFormData(d);
        // Kayıt varsa token'ı güncelle
        if (d?.public_token) setToken(d.public_token);
        setLoading(false);
      })
      .catch(() => {
        setError("Form yüklenemedi");
        setLoading(false);
      });
  }, [projectId]);

  async function ensureToken() {
    if (token) return token;
    setGeneratingLink(true);
    try {
      const res = await fetch(`/api/installation/${projectId}/token`, { method: "POST" });
      const data = await res.json();
      if (data.public_token) {
        setToken(data.public_token);
        return data.public_token;
      }
    } finally {
      setGeneratingLink(false);
    }
    return null;
  }

  async function handleCopy() {
    const t = await ensureToken();
    if (!t) return;
    const url = `${origin}/public/form/${t}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (loading) return <div className="py-10 text-center text-sm text-zinc-400">Yükleniyor…</div>;
  if (error) return <div className="py-10 text-center text-sm text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {/* ===== Paylaş Kartı ===== */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              Müşteriye Paylaş
            </p>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
              Bu linki müşteriyle paylaşın — giriş yapmadan formu doldurup gönderebilirler.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              onClick={handleCopy}
              disabled={generatingLink}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${copied
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                } disabled:opacity-60`}
            >
              {generatingLink ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Link oluşturuluyor…
                </>
              ) : copied ? (
                <>✓ Kopyalandı!</>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Linki Kopyala
                </>
              )}
            </button>

            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
              >
                Önizle ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <InstallationForm
        initialData={formData}
        projectId={projectId}
        isAdmin={isAdmin}
        onSave={(updated) => setFormData(updated)}
        apiUrl={`/api/installation/${projectId}`}
        method="PUT"
      />
    </div>
  );
}
