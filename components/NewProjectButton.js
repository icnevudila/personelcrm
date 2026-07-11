"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROJECT_TYPES = [
  { value: "landing_page", label: "Landing Page" },
  { value: "saas", label: "SaaS" },
  { value: "mobile_app", label: "Mobile App" },
];

export default function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("landing_page");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function closeModal() {
    setOpen(false);
    setName("");
    setProjectType("landing_page");
    setError("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type: projectType }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Bir hata oluştu");
      setLoading(false);
      return;
    }
    closeModal();
    setLoading(false);
    router.push(`/projects/${data.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        <span className="text-base leading-none">+</span>
        Yeni Proje
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Yeni Proje
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Proje Adı
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="Örn: ABC İşletme Web Sitesi"
                />
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Proje Türü
                </legend>
                <div className="mt-2 space-y-2">
                  {PROJECT_TYPES.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                        projectType === option.value
                          ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="project_type"
                        value={option.value}
                        checked={projectType === option.value}
                        onChange={() => setProjectType(option.value)}
                        className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                      />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {loading ? "Oluşturuluyor…" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
