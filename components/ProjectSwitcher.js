"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

let cachedProjects = null;
let projectsFetchPromise = null;

function sortProjects(list) {
  return [...list].sort((a, b) => {
    const favDiff = Number(b.is_favorited) - Number(a.is_favorited);
    if (favDiff !== 0) return favDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function loadProjects() {
  if (cachedProjects) return Promise.resolve(cachedProjects);
  if (projectsFetchPromise) return projectsFetchPromise;

  projectsFetchPromise = fetch("/api/projects")
    .then((r) => r.json())
    .then((list) => {
      cachedProjects = sortProjects(Array.isArray(list) ? list : []);
      return cachedProjects;
    })
    .catch(() => {
      cachedProjects = [];
      return cachedProjects;
    })
    .finally(() => {
      projectsFetchPromise = null;
    });

  return projectsFetchPromise;
}

function StarIcon({ filled, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} ${filled ? "fill-amber-400 text-amber-400" : "fill-none stroke-current text-zinc-400"}`}
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

function ProjectRow({ project, active, href, onNavigate }) {
  const favorited = !!project.is_favorited;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
        active
          ? favorited
            ? "bg-amber-50 font-medium text-zinc-900 dark:bg-amber-950/30 dark:text-zinc-100"
            : "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : favorited
            ? "text-zinc-800 hover:bg-amber-50/80 dark:text-zinc-200 dark:hover:bg-amber-950/20"
            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      <StarIcon
        filled={favorited}
        className={`h-4 w-4 shrink-0 ${favorited ? "opacity-100" : "opacity-0"}`}
      />
      <span className="min-w-0 truncate">{project.name}</span>
    </Link>
  );
}

export default function ProjectSwitcher({ onNavigate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const match = pathname?.match(/^\/projects\/([^/]+)/);
  const currentProjectId = match?.[1] || "";

  const [projects, setProjects] = useState(() => (cachedProjects ? sortProjects(cachedProjects) : []));
  const [loading, setLoading] = useState(() => !cachedProjects);

  useEffect(() => {
    let cancelled = false;

    if (cachedProjects) {
      setProjects(sortProjects(cachedProjects));
      setLoading(false);
      return;
    }

    setLoading(true);
    loadProjects().then((items) => {
      if (!cancelled) {
        setProjects(items);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const { favorites, others } = useMemo(() => {
    const favs = projects.filter((p) => p.is_favorited);
    const rest = projects.filter((p) => !p.is_favorited);
    return { favorites: favs, others: rest };
  }, [projects]);

  const qs = searchParams.toString();

  function projectHref(projectId) {
    if (currentProjectId && qs) {
      return `/projects/${projectId}?${qs}`;
    }
    return `/projects/${projectId}`;
  }

  return (
    <div className="max-h-72 overflow-y-auto py-1">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
          pathname === "/dashboard"
            ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        Ana Sayfa
      </Link>

      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

      {loading && projects.length === 0 ? (
        <p className="px-3 py-2 text-sm text-zinc-400">Yükleniyor…</p>
      ) : projects.length === 0 ? (
        <p className="px-3 py-2 text-sm text-zinc-400">Henüz proje yok</p>
      ) : (
        <>
          {favorites.length > 0 ? (
            <>
              <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                <StarIcon filled className="h-3.5 w-3.5" />
                Favoriler
              </p>
              {favorites.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  active={project.id === currentProjectId}
                  href={projectHref(project.id)}
                  onNavigate={onNavigate}
                />
              ))}
              {others.length > 0 ? (
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              ) : null}
            </>
          ) : null}

          {others.length > 0 ? (
            <>
              {favorites.length > 0 ? (
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Diğer Projeler
                </p>
              ) : null}
              {others.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  active={project.id === currentProjectId}
                  href={projectHref(project.id)}
                  onNavigate={onNavigate}
                />
              ))}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
