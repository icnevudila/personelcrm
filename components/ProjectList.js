"use client";

import { useState } from "react";
import Link from "next/link";

import { TYPE_LABEL, TYPE_COLOR } from "@/lib/projectMeta";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

function sortProjects(list) {
  return [...list].sort((a, b) => {
    const favDiff = Number(b.is_favorited) - Number(a.is_favorited);
    if (favDiff !== 0) return favDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function StarIcon({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${filled ? "fill-amber-400 text-amber-400" : "fill-none stroke-current text-zinc-400"}`}
      strokeWidth={filled ? 0 : 1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

export default function ProjectList({ initialProjects, isAdmin, emptyMessage }) {
  const [projects, setProjects] = useState(() => sortProjects(initialProjects));

  async function toggleFavorite(e, projectId, current) {
    e.preventDefault();
    e.stopPropagation();

    const next = !current;
    setProjects((prev) =>
      sortProjects(prev.map((p) => (p.id === projectId ? { ...p, is_favorited: next } : p)))
    );

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorited: next }),
    });

    if (!res.ok) {
      setProjects((prev) =>
        sortProjects(prev.map((p) => (p.id === projectId ? { ...p, is_favorited: current } : p)))
      );
    }
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500">
          {emptyMessage || 'Henüz proje yok. "+ Yeni Site" ile başlayın.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <button
                type="button"
                onClick={(e) => toggleFavorite(e, project.id, !!project.is_favorited)}
                aria-label={project.is_favorited ? "Favoriden çıkar" : "Favoriye ekle"}
                className={`mt-0.5 shrink-0 rounded-md p-0.5 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  project.is_favorited ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <StarIcon filled={!!project.is_favorited} />
              </button>
              <h3 className="min-w-0 font-semibold text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                {project.name}
              </h3>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[project.type] || TYPE_COLOR.landing_page}`}
            >
              {TYPE_LABEL[project.type] || project.type || "Landing Page"}
            </span>
          </div>
          {project.description && (
            <p className="mt-1 pl-7 text-sm text-zinc-500 line-clamp-2">{project.description}</p>
          )}
          <p className="mt-2 pl-7 text-xs text-zinc-400">
            {formatRelativeTime(project.created_at)}
          </p>
        </Link>
      ))}
    </div>
  );
}
