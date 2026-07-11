export const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export const textareaCls =
  "w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[5rem]";

export const selectCls = inputCls;
export const labelCls = "mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400";
export const btnPrimaryCls =
  "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900";
export const btnGhostCls =
  "rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

export function SectionCard({ title, description, children, action }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function SaveIndicator({ saveStatus, errorMsg }) {
  if (saveStatus === "idle" && !errorMsg) return null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {saveStatus === "saving" && <span className="text-xs text-zinc-400">Kaydediliyor…</span>}
      {saveStatus === "saved" && (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckIcon className="h-3.5 w-3.5" />
          Kaydedildi
        </span>
      )}
      {saveStatus === "error" && errorMsg && (
        <span className="text-xs text-red-600 dark:text-red-400">{errorMsg}</span>
      )}
    </div>
  );
}

export function PriorityBadge({ priority }) {
  const colors = {
    low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    high: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  };
  const labels = { low: "Düşük", medium: "Orta", high: "Yüksek" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[priority] || colors.medium}`}>
      {labels[priority] || priority}
    </span>
  );
}
