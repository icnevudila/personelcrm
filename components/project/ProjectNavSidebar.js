"use client";

import { useEffect, useRef, useState } from "react";

function TabIcon({ tabKey, className }) {
  const props = { className, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true };

  switch (tabKey) {
    case "overview":
      return (
        <svg {...props}>
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case "blueprint":
      return (
        <svg {...props}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm3-4H7v-2h8v2zm0-4H7V7h8v2z" />
        </svg>
      );
    case "name-finder":
      return (
        <svg {...props}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
      );
    case "slogans":
      return (
        <svg {...props}>
          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
        </svg>
      );
    case "todo-list":
      return (
        <svg {...props}>
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
      );
    case "roadmap":
      return (
        <svg {...props}>
          <path d="M4 6h2v12H4V6zm4 3h2v9H8V9zm4-5h2v14h-2V4zm4 4h2v10h-2V8z" />
        </svg>
      );
    case "mvp-features":
      return (
        <svg {...props}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "installation":
      return (
        <svg {...props}>
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      );
    case "updates":
      return (
        <svg {...props}>
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
        </svg>
      );
    case "domain":
      return (
        <svg {...props}>
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
        </svg>
      );
    case "pages":
      return (
        <svg {...props}>
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
      );
    case "keyword-explorer":
      return (
        <svg {...props}>
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      );
    case "logo":
      return (
        <svg {...props}>
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case "copyfast":
      return (
        <svg {...props}>
          <path d="M7 2v11h3v9l7-12h-4l4-8z" />
        </svg>
      );
    case "ai-title-generator":
      return (
        <svg {...props}>
          <path d="M12 2a7 7 0 0 0-6.08 10.52L2 22l9.48-3.92A7 7 0 1 0 12 2zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm-1 2h2v2h-2V6zm0 4h2v4h-2v-4z" />
        </svg>
      );
    case "db-schema-planner":
      return (
        <svg {...props}>
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z" />
        </svg>
      );
    case "blog":
      return (
        <svg {...props}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      );
    case "messages":
      return (
        <svg {...props}>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      );
    case "prompt":
      return (
        <svg {...props}>
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.5h8v-1.5H8v1.5zm0-3h8V11H8v1.5zm0-3h5V9H8v1.5z" />
        </svg>
      );
    case "marketing":
    case "marketing-group":
      return (
        <svg {...props}>
          <path d="M12 8H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v3c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-3h1l5 3V5l-5 3zm9.5 4c0 1.71-.96 3.26-2.5 4.03v-8.06c1.54.77 2.5 2.32 2.5 4.03zM14 5.08v13.84c2.87-.86 5-3.54 5-6.92s-2.13-6.06-5-6.92z" />
        </svg>
      );
    case "brand":
      return (
        <svg {...props}>
          <path d="M12 2l2.4 7.2H22l-6 4.8 2.3 7L12 16.8 5.7 21l2.3-7-6-4.8h7.6L12 2z" />
        </svg>
      );
    case "tech":
      return (
        <svg {...props}>
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        </svg>
      );
  }
}

const MENU_ITEMS = [
  { key: "overview", label: "Ana Sayfa" },
  { key: "todo-list", label: "Todo List" },
  { key: "roadmap", label: "Roadmap" },
  {
    key: "brand",
    label: "Marka Kiti",
    children: [
      { key: "slogans", label: "Slogan & Metin" },
      { key: "name-finder", label: "İsim Bul" },
      { key: "domain", label: "Domain" },
      { key: "keyword-explorer", label: "Keyword Explorer" },
      { key: "logo", label: "Logo" },
      { key: "ai-title-generator", label: "AI Title" },
    ],
  },
  {
    key: "tech",
    label: "Teknik / Kurulum",
    children: [
      { key: "blueprint", label: "Blueprint" },
      { key: "prompt", label: "Prompt" },
      { key: "mvp-features", label: "MVP Features", projectTypes: ["saas", "mobile_app"] },
      { key: "installation", label: "Kurulum Formu", projectTypes: ["landing_page"] },
      { key: "updates", label: "Güncellemeler" },
      { key: "pages", label: "Sayfalar" },
      { key: "db-schema-planner", label: "DB Schema" },
      { key: "copyfast", label: "CopyFast" },
    ],
  },
  {
    key: "marketing-group",
    label: "Marketing",
    children: [
      { key: "marketing", label: "Pazarlama" },
      { key: "blog", label: "Blog" },
    ],
  },
  { key: "settings", label: "Ayarlar" },
];

function isTabVisible(tab, projectType) {
  return !tab.projectTypes || tab.projectTypes.includes(projectType);
}

function flattenTabs(items) {
  const tabs = [];
  for (const item of items) {
    if (item.children) tabs.push(...item.children);
    else tabs.push(item);
  }
  return tabs;
}

function getMenuForProjectType(projectType = "landing_page") {
  return MENU_ITEMS.map((item) => {
    if (!item.children) {
      return isTabVisible(item, projectType) ? item : null;
    }
    const children = item.children.filter((child) => isTabVisible(child, projectType));
    if (children.length === 0) return null;
    return { ...item, children };
  }).filter(Boolean);
}

function getTabsForProjectType(projectType = "landing_page") {
  return flattenTabs(getMenuForProjectType(projectType));
}

const ALL_TABS = flattenTabs(MENU_ITEMS);
const DEFAULT_PROJECT_TAB = "overview";

const itemClass = (active) =>
  `flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors sm:px-3 sm:py-2.5 ${active
    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
  }`;

const childClass = (active) =>
  `flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors sm:px-3 sm:py-2 ${active
    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
  }`;

function NavLeaf({ tab, activeTab, onNavigate }) {
  const isActive = activeTab === tab.key;
  return (
    <button
      type="button"
      onClick={() => onNavigate(tab.key)}
      title={tab.label}
      aria-current={isActive ? "page" : undefined}
      className={itemClass(isActive)}
    >
      <TabIcon tabKey={tab.key} className="mx-auto h-5 w-5 shrink-0 sm:mx-0" />
      <span className="hidden truncate text-sm font-medium sm:inline">{tab.label}</span>
    </button>
  );
}

function NavGroup({ group, activeTab, onNavigate }) {
  const childKeys = group.children.map((c) => c.key);
  const hasActiveChild = childKeys.includes(activeTab);
  const [open, setOpen] = useState(hasActiveChild);
  const rootRef = useRef(null);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  useEffect(() => {
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target) && !hasActiveChild) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [hasActiveChild]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={group.label}
        aria-expanded={open}
        aria-haspopup="menu"
        className={itemClass(hasActiveChild && !open)}
      >
        <TabIcon tabKey={group.key} className="mx-auto h-5 w-5 shrink-0 sm:mx-0" />
        <span className="hidden min-w-0 flex-1 truncate text-left text-sm font-medium sm:inline">
          {group.label}
        </span>
        <svg
          className={`ml-auto hidden h-4 w-4 shrink-0 transition-transform sm:block ${open ? "rotate-90" : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>

      {open ? (
        <div className="mt-0.5 hidden flex-col gap-0.5 border-l border-zinc-200 pl-2 ml-3 sm:flex dark:border-zinc-700">
          {group.children.map((child) => {
            const isActive = activeTab === child.key;
            return (
              <button
                key={child.key}
                type="button"
                onClick={() => onNavigate(child.key)}
                title={child.label}
                aria-current={isActive ? "page" : undefined}
                className={childClass(isActive)}
              >
                <TabIcon tabKey={child.key} className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm font-medium">{child.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {open ? (
        <div
          role="menu"
          className="absolute left-full top-0 z-50 ml-1.5 flex min-w-[11rem] flex-col gap-0.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg sm:hidden dark:border-zinc-700 dark:bg-zinc-900"
        >
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {group.label}
          </p>
          {group.children.map((child) => {
            const isActive = activeTab === child.key;
            return (
              <button
                key={child.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  onNavigate(child.key);
                  setOpen(false);
                }}
                className={childClass(isActive)}
              >
                <TabIcon tabKey={child.key} className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm font-medium">{child.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function ProjectNavSidebar({ activeTab, onNavigate, projectType = "landing_page" }) {
  const menu = getMenuForProjectType(projectType);

  return (
    <aside className="w-[3.25rem] shrink-0 sm:w-52">
      <nav
        className="sticky top-[calc(var(--dashboard-header-height)+1rem)] flex flex-col gap-0.5 rounded-xl border border-zinc-200 bg-white p-1 sm:p-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        aria-label="Proje menüsü"
      >
        {menu.map((item) =>
          item.children ? (
            <NavGroup
              key={item.key}
              group={item}
              activeTab={activeTab}
              onNavigate={onNavigate}
            />
          ) : (
            <NavLeaf
              key={item.key}
              tab={item}
              activeTab={activeTab}
              onNavigate={onNavigate}
            />
          )
        )}
      </nav>
    </aside>
  );
}

export { ALL_TABS as TABS, MENU_ITEMS, getTabsForProjectType, getMenuForProjectType, TabIcon, DEFAULT_PROJECT_TAB };
