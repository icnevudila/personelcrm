"use client";

import { useState, useCallback } from "react";
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
      className={`h-4 w-4 ${filled ? "fill-amber-400 text-amber-400" : "fill-none stroke-current text-zinc-300 dark:text-zinc-600"}`}
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

function ExternalIcon() {
  return (
    <svg className="h-3 w-3 opacity-50 group-hover/link:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function DeploymentBadge({ status }) {
  if (!status) return null;

  const cfg = {
    active:    { dot: "bg-emerald-500", ping: "bg-emerald-400", text: "Canlı",      bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400", animate: true },
    building:  { dot: "bg-amber-500",   ping: "bg-amber-400",   text: "Build...",   bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",           animate: true },
    error:     { dot: "bg-red-500",     ping: "bg-red-400",     text: "Hata",       bg: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400",                   animate: false },
    canceled:  { dot: "bg-zinc-400",    ping: "bg-zinc-300",    text: "İptal",      bg: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",                  animate: false },
    queued:    { dot: "bg-blue-400",    ping: "bg-blue-300",    text: "Kuyrukta",   bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",               animate: true },
    unknown:   { dot: "bg-zinc-300",    ping: "bg-zinc-200",    text: "Bilinmiyor", bg: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",                  animate: false },
  }[status] || { dot: "bg-zinc-300", ping: "bg-zinc-200", text: status, bg: "bg-zinc-100 text-zinc-400", animate: false };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.bg}`}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {cfg.animate && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.ping} opacity-75`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      </span>
      {cfg.text}
    </span>
  );
}

function UrlChip({ href, label, icon }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="group/link inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 max-w-[160px]"
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      <ExternalIcon />
    </a>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label && <span className="text-zinc-500 dark:text-zinc-400">{label}: </span>}{value}</span>
    </div>
  );
}

function VercelIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 76 65" fill="currentColor">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function ProjectList({ initialProjects, isAdmin, emptyMessage }) {
  const [projects, setProjects] = useState(() => sortProjects(initialProjects));
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  async function toggleFavorite(e, projectId, current) {
    e.preventDefault();
    e.stopPropagation();
    const next = !current;
    setProjects((prev) => sortProjects(prev.map((p) => (p.id === projectId ? { ...p, is_favorited: next } : p))));
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorited: next }),
    });
    if (!res.ok) {
      setProjects((prev) => sortProjects(prev.map((p) => (p.id === projectId ? { ...p, is_favorited: current } : p))));
    }
  }

  const syncVercelStatus = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSyncing(true);
    try {
      const res = await fetch("/api/projects/vercel-status", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Merge updated deployment info into local state
      setProjects((prev) =>
        sortProjects(
          prev.map((p) => {
            const updated = data.projects?.find((vp) => vp.db_project_id === p.id);
            if (!updated) return p;
            return {
              ...p,
              vercel_url: updated.vercel_url || p.vercel_url,
              custom_domain: updated.custom_domain || p.custom_domain,
              live_url: updated.custom_domain || updated.vercel_url || p.live_url,
              deployment_status: updated.deployment_status,
              last_deployed_at: updated.last_deployed_at,
            };
          })
        )
      );
      setLastSync(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  }, []);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500">{emptyMessage || 'Henüz proje yok. "+ Yeni Site" ile başlayın.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sync bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          {lastSync ? `Son güncelleme: ${formatRelativeTime(lastSync.toISOString())}` : "Vercel durumu güncel değil olabilir"}
        </p>
        <button
          onClick={syncVercelStatus}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <RefreshIcon spinning={syncing} />
          {syncing ? "Güncelleniyor..." : "Vercel Durumunu Yenile"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => {
          const displayUrl = project.custom_domain || project.live_url || project.vercel_url;
          const hasVercel = !!(project.vercel_url || project.vercel_project_id);
          const hasCustom = !!project.custom_domain;

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group relative flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(e, project.id, !!project.is_favorited)}
                    aria-label={project.is_favorited ? "Favoriden çıkar" : "Favoriye ekle"}
                    className={`mt-0.5 shrink-0 rounded p-0.5 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800 ${project.is_favorited ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <StarIcon filled={!!project.is_favorited} />
                  </button>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-200">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{project.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLOR[project.type] || TYPE_COLOR.landing_page}`}>
                    {TYPE_LABEL[project.type] || project.type || "Landing Page"}
                  </span>
                  {project.deployment_status && (
                    <DeploymentBadge status={project.deployment_status} />
                  )}
                </div>
              </div>

              {/* URL chips */}
              {(hasVercel || hasCustom) && (
                <div className="flex flex-wrap gap-1.5">
                  {hasCustom && (
                    <UrlChip
                      href={project.custom_domain}
                      label={project.custom_domain?.replace(/^https?:\/\//, "")}
                      icon={<GlobeIcon />}
                    />
                  )}
                  {project.vercel_url && (
                    <UrlChip
                      href={project.vercel_url}
                      label={project.vercel_url.replace(/^https?:\/\//, "").split(".vercel.app")[0] + ".vercel.app"}
                      icon={<VercelIcon />}
                    />
                  )}
                </div>
              )}

              {/* Meta info row */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                <InfoRow
                  icon="🕐"
                  value={project.last_deployed_at
                    ? `Deploy: ${formatRelativeTime(project.last_deployed_at)}`
                    : `Oluşturuldu: ${formatRelativeTime(project.created_at)}`}
                />
                {!project.deployment_status && !hasVercel && (
                  <InfoRow icon="⚪" value="Vercel bağlantısı yok" />
                )}
                {project.supabase_project_ref && (
                  <InfoRow icon="🗄️" label="Supabase" value={project.supabase_project_ref} />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
