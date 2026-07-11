"use client";

function StarIcon({ filled, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function FavoriteButton({ favorited, onToggle, title = "Favorile" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={favorited ? "Favoriden çıkar" : title}
      aria-label={favorited ? "Favoriden çıkar" : title}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
        favorited
          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          : "text-zinc-300 hover:bg-zinc-100 hover:text-amber-400 dark:hover:bg-zinc-800"
      }`}
    >
      <StarIcon filled={favorited} className="h-4 w-4" />
    </button>
  );
}

export function SourceBadge({ source }) {
  if (source === "ai") {
    return (
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
        AI
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      Manuel
    </span>
  );
}
