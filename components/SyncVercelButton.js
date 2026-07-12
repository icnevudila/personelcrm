"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SyncVercelButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    const toastId = toast.loading("Vercel projeleri çekiliyor...");

    try {
      const res = await fetch("/api/projects/sync-vercel", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Proje çekme sırasında bir hata oluştu.");
      }

      toast.success(
        `Eşitleme başarılı! ${data.importedCount} yeni proje içe aktarıldı.`,
        {
          id: toastId,
        }
      );

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Eşitleme sırasında bir hata oluştu.", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <svg
        className={`h-4 w-4 text-zinc-500 dark:text-zinc-400 ${loading ? "animate-spin" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L20 6"
        />
      </svg>
      {loading ? "Eşitleniyor..." : "Vercel'den Çek"}
    </button>
  );
}
