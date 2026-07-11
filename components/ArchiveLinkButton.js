import Link from "next/link";

export default function ArchiveLinkButton() {
  return (
    <Link
      href="/dashboard/archive"
      title="Arşiv"
      aria-label="Arşivlenmiş projeler"
      className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.81 1H5.44l.8-1zM5 8h14v11H5V8zm2 2v2h10v-2H7zm0 4v2h6v-2H7z" />
      </svg>
    </Link>
  );
}
