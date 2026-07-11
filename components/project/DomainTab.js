"use client";

import { useState } from "react";

const VERCEL_NS = ["ns1.vercel-dns.com", "ns2.vercel-dns.com"];

export default function DomainTab({ projectId, initialDomains }) {
  const [domains, setDomains] = useState(initialDomains);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nsModal, setNsModal] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, domain: newDomain.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Hata oluştu");
      setLoading(false);
      return;
    }
    setDomains((prev) => [...prev, data]);
    setNewDomain("");
    setLoading(false);
  }

  async function handleSetPrimary(id) {
    const res = await fetch(`/api/domains/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_primary: true }),
    });
    if (res.ok) {
      setDomains((prev) =>
        prev.map((d) => ({ ...d, is_primary: d.id === id }))
      );
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bu domaini silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/domains/${id}`, { method: "DELETE" });
    if (res.ok) {
      const deleted = domains.find((d) => d.id === id);
      const remaining = domains.filter((d) => d.id !== id);
      if (deleted?.is_primary && remaining.length > 0) {
        remaining[0].is_primary = true;
      }
      setDomains(remaining);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Domain Yönetimi</h2>
        <p className="text-sm text-zinc-500">İlk eklenen domain ana domain olarak seçilir. Dilediğinizi ana domain yapabilirsiniz.</p>
      </div>

      {/* Domain ekleme */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          + Domain Ekle
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Domain listesi */}
      {domains.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Henüz domain eklenmemiş.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {domains.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-zinc-800 dark:text-zinc-200">{d.domain}</span>
                {d.is_primary && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    Ana Domain
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNsModal(d.domain)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Domain Bağla
                </button>
                {!d.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(d.id)}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Ana Yap
                  </button>
                )}
                <button
                  onClick={() => handleDelete(d.id)}
                  className="rounded-lg px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Vercel NS talimatları modal */}
      {nsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setNsModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Domain Bağlama Talimatları
            </h3>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">{nsModal}</span> domain&apos;ini domain kayıt
              firmanızın yönetim panelinden aşağıdaki Vercel nameserver adreslerine yönlendirin:
            </p>
            <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              {VERCEL_NS.map((ns) => (
                <div key={ns} className="flex items-center justify-between gap-2">
                  <code className="text-sm text-zinc-800 dark:text-zinc-200">{ns}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(ns)}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Kopyala
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">Adımlar:</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Domain kayıt firmanıza giriş yapın (GoDaddy, Namecheap, vb.)</li>
                <li>Domain yönetim panelinden DNS/Nameserver ayarlarına girin</li>
                <li>Mevcut nameserver kayıtlarını silin</li>
                <li>Yukarıdaki iki Vercel NS adresini ekleyin</li>
                <li>Değişikliklerin yayılması 24-48 saat sürebilir</li>
              </ol>
            </div>
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <strong>Not:</strong> Vercel Dashboard üzerinden projenize bu domaini eklemeyi unutmayın.
            </div>
            <button
              onClick={() => setNsModal(null)}
              className="mt-4 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
