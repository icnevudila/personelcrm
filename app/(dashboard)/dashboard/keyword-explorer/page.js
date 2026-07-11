import DashboardBackLink from "@/components/dashboard/DashboardBackLink";

export const metadata = { title: "Keyword Explorer — Site CRM" };

export default function KeywordExplorerPage() {
  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Keyword Explorer</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Keyword Explorer proje bazlı çalışır. Bir projeyi açıp{" "}
        <strong className="font-medium text-zinc-700 dark:text-zinc-300">Keyword Explorer</strong>{" "}
        sekmesinden kullanın.
      </p>
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Dashboard → Proje seç → Keyword Explorer sekmesi: gruplar, kombinasyonlar, Google
          autocomplete, AI genişletme, aday listesi ve projeye kayıt.
        </p>
      </div>
    </div>
  );
}
