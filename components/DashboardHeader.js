"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProjectSwitcher from "@/components/ProjectSwitcher";

function DefaultAvatarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function ProjectsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
    </svg>
  );
}

function DeepWorkIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
    </svg>
  );
}

function RoadmapIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V9.5h16V18zm0-10.5H4V6h16v1.5zM6.5 15.5h3v-3h-3v3zm0-4h3v-3h-3v3zm4 4h3v-3h-3v3zm0-4h3v-3h-3v3zm4 4h3v-3h-3v3zm0-4h3v-3h-3v3z" />
    </svg>
  );
}

function CallIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
    </svg>
  );
}

function navLinkClass(active) {
  return `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${active
    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    }`;
}

export default function DashboardHeader({ user, admin = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef(null);
  const projectsMenuRef = useRef(null);
  const projectsCloseTimer = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);

  const isDeepWorkActive = pathname?.startsWith("/dashboard/deep-work");
  const isRoadmapActive = pathname?.startsWith("/dashboard/roadmap");
  const isAppScoutActive = pathname?.startsWith("/dashboard/app-scout");
  const isMcpActive = pathname?.startsWith("/dashboard/mcp");
  const isN8nActive = pathname?.startsWith("/dashboard/n8n") || pathname?.startsWith("/dashboard/automations");
  const isSocialActive = pathname?.startsWith("/dashboard/social");
  const isProjectsActive =
    !isDeepWorkActive &&
    !isRoadmapActive &&
    !isAppScoutActive &&
    !isMcpActive &&
    !isN8nActive &&
    !isSocialActive &&
    (pathname === "/dashboard" ||
      pathname?.startsWith("/dashboard/") ||
      pathname?.startsWith("/projects/"));
  const isCrmActive = pathname === "/crm" || pathname?.startsWith("/crm/");

  function openProjectsMenu() {
    if (projectsCloseTimer.current) {
      clearTimeout(projectsCloseTimer.current);
      projectsCloseTimer.current = null;
    }
    setProjectsMenuOpen(true);
  }

  function closeProjectsMenu(delay = 120) {
    if (projectsCloseTimer.current) clearTimeout(projectsCloseTimer.current);
    projectsCloseTimer.current = setTimeout(() => {
      setProjectsMenuOpen(false);
      projectsCloseTimer.current = null;
    }, delay);
  }

  useEffect(() => {
    return () => {
      if (projectsCloseTimer.current) clearTimeout(projectsCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!userMenuOpen && !projectsMenuOpen) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setProjectsMenuOpen(false);
      }
    }

    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (projectsMenuRef.current && !projectsMenuRef.current.contains(e.target)) {
        setProjectsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [userMenuOpen, projectsMenuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
            onClick={() => setUserMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
              priority
            />
            <span className="truncate text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              AI Product OS
            </span>
          </Link>


          <nav className="flex shrink-0 items-center gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-700 sm:pl-3">
            <div
              ref={projectsMenuRef}
              className="relative"
              onMouseEnter={openProjectsMenu}
              onMouseLeave={() => closeProjectsMenu()}
            >
              <button
                type="button"
                className={navLinkClass(isProjectsActive)}
                title="Projeler"
                aria-expanded={projectsMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setUserMenuOpen(false);
                  setProjectsMenuOpen((open) => !open);
                }}
              >
                <ProjectsIcon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Projeler</span>
                <svg
                  className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform ${projectsMenuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div
                role="menu"
                className={`absolute left-0 top-full z-50 pt-1 ${projectsMenuOpen ? "" : "hidden"}`}
                aria-hidden={!projectsMenuOpen}
                onMouseEnter={openProjectsMenu}
                onMouseLeave={() => closeProjectsMenu()}
              >
                <div className="w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  <Suspense
                    fallback={
                      <p className="px-3 py-2 text-sm text-zinc-400">Yükleniyor…</p>
                    }
                  >
                    <ProjectSwitcher
                      onNavigate={() => {
                        setProjectsMenuOpen(false);
                        setUserMenuOpen(false);
                      }}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/deep-work"
              className={navLinkClass(isDeepWorkActive)}
              title="Deep Work"
              onClick={() => setUserMenuOpen(false)}
            >
              <DeepWorkIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Deep Work</span>
            </Link>
            <Link
              href="/dashboard/roadmap"
              className={navLinkClass(isRoadmapActive)}
              title="RoadMap"
              onClick={() => setUserMenuOpen(false)}
            >
              <RoadmapIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">RoadMap</span>
            </Link>
            <Link href="/dashboard/app-scout" className={navLinkClass(isAppScoutActive)} title="App Scout" onClick={() => setUserMenuOpen(false)}>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <span className="hidden sm:inline">App Scout</span>
            </Link>
            <Link href="/dashboard/mcp" className={navLinkClass(isMcpActive)} title="MCP" onClick={() => setUserMenuOpen(false)}>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
              </svg>
              <span className="hidden sm:inline">MCP</span>
            </Link>
            <Link href="/dashboard/automations" className={navLinkClass(isN8nActive)} title="Automations" onClick={() => setUserMenuOpen(false)}>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span className="hidden sm:inline">Automations</span>
            </Link>
            <Link href="/dashboard/social" className={navLinkClass(isSocialActive)} title="Social" onClick={() => setUserMenuOpen(false)}>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4"/>
                <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
              </svg>
              <span className="hidden sm:inline">Social</span>
            </Link>
            {admin && (
              <Link
                href="/crm"
                className={navLinkClass(isCrmActive)}
                title="Müşteri CRM"
                onClick={() => setUserMenuOpen(false)}
              >
                <CallIcon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Müşteri CRM</span>
              </Link>
            )}
          </nav>
        </div>

        {user && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label="Hesap menüsü"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              <DefaultAvatarIcon className="h-5 w-5" />
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Hesap</p>
                  <p className="mt-1 break-all text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user.email}
                  </p>
                </div>
                <div className="p-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    Çıkış
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
