import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Oturum doğrulanamadı
      </h1>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        Bağlantının süresi dolmuş veya geçersiz olabilir. Lütfen tekrar giriş yapmayı deneyin.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
