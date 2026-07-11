"use client";

const STATUS_STYLES = {
  pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  generating: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  generated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  error: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

function StatusIcon({ status }) {
  if (status === "generating") {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </span>
    );
  }
  if (status === "generated") return <span className="text-sm font-bold">✓</span>;
  if (status === "error") return <span className="text-sm font-bold">✕</span>;
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current opacity-60" />
    </span>
  );
}

function ScannerOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      <div className="copyfast-scanner-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
    </div>
  );
}

export default function CopyFastGeneratingModal({ open, items, progressMap, onClose }) {
  if (!open) return null;

  const done = items.filter((i) => {
    const s = progressMap[i.id] || i.status;
    return s === "generated" || s === "error";
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Generating Your Pages
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {done} / {items.length} tamamlandı
          </p>
        </div>

        <div className="flex flex-wrap gap-2 overflow-y-auto p-4">
          {items.map((item) => {
            const status = progressMap[item.id] || item.status;
            const thumb = item.web_image_url || item.mobile_image_url;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
              >
                {thumb ? (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-black/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                    {status === "generating" && <ScannerOverlay />}
                  </div>
                ) : null}
                <span className="max-w-[8rem] truncate">{item.name}</span>
                <StatusIcon status={status} />
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-200 px-6 py-3 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Kapat
          </button>
        </div>
      </div>

      <style jsx>{`
        .copyfast-scanner-line {
          animation: copyfast-scan 1.8s ease-in-out infinite;
        }
        @keyframes copyfast-scan {
          0%, 100% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
