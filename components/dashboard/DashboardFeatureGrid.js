import Link from "next/link";

const cardClass =
  "group flex min-h-[5.5rem] flex-col justify-between gap-2 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-5";

export default function DashboardFeatureGrid({ admin }) {
  if (!admin) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Link href="/crm" className={cardClass}>
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
            👥
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">Müşteri CRM</p>
            <p className="text-sm text-zinc-500">Müşteri gruplarını yönet, aramaları takip et</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>
    </div>
  );
}
