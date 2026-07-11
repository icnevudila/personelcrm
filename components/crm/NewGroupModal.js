"use client";

import { useState, useRef } from "react";

export default function NewGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Grup adı zorunlu");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crm/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const group = await res.json();
      if (!res.ok) throw new Error(group.error || "Grup oluşturulamadı");

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const importRes = await fetch(`/api/crm/groups/${group.id}/import`, {
          method: "POST",
          body: fd,
        });
        const importData = await importRes.json();
        if (!importRes.ok) throw new Error(importData.error || "CSV yüklenemedi");
        group.importedCount = importData.imported;
      }

      onCreated(group);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Yeni Müşteri Grubu
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Grup Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mobilyacılar, Berberler..."
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              CSV Listesi (İsteğe Bağlı)
            </label>
            <div
              className="cursor-pointer rounded-xl border-2 border-dashed border-zinc-200 p-4 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  📄 {file.name}{" "}
                  <span className="text-zinc-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </p>
              ) : (
                <p className="text-sm text-zinc-400">
                  CSV dosyasını buraya sürükleyin veya tıklayın
                </p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Sütunlar: business_name, maps_url, phone_number, province, district, rating,
              review_count
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
