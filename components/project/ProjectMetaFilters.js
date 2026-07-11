"use client";

import { PROJECT_STATUSES, PROJECT_TYPES } from "@/lib/projectMeta";

const chipBase = "rounded-md px-2 py-1 text-xs font-medium transition-colors";

const selectCls =
  "rounded-lg border border-zinc-200 bg-white py-1.5 pl-2.5 pr-8 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

function FilterChip({ label, active, onClick, readOnly, activeClass }) {
  if (readOnly) {
    return (
      <span
        className={`${chipBase} ${active ? activeClass : "text-zinc-400 dark:text-zinc-500"}`}
      >
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${chipBase} ${active
        ? activeClass
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        }`}
    >
      {label}
    </button>
  );
}

export default function ProjectMetaFilters({
  statusFilter = null,
  typeFilter = null,
  activeStatus = null,
  activeType = null,
  onStatusChange,
  onTypeChange,
  readOnly = false,
  variant = "sidebar",
}) {
  const statusActive = readOnly ? activeStatus : statusFilter;
  const typeActive = readOnly ? activeType : typeFilter;
  const hasActiveFilters = Boolean(statusFilter || typeFilter);

  if (variant === "inline" && !readOnly) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter ?? ""}
          onChange={(e) => onStatusChange?.(e.target.value || null)}
          className={selectCls}
          aria-label="Durum filtresi"
        >
          <option value="">Tüm durumlar</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter ?? ""}
          onChange={(e) => onTypeChange?.(e.target.value || null)}
          className={selectCls}
          aria-label="Tür filtresi"
        >
          <option value="">Tüm türler</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              onStatusChange?.(null);
              onTypeChange?.(null);
            }}
            className="rounded-lg px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            Temizle
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <div>
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Durumlar
        </p>
        <div className="flex flex-wrap gap-1 px-1">
          {!readOnly && (
            <FilterChip
              label="Tümü"
              active={!statusFilter}
              onClick={() => onStatusChange?.(null)}
              activeClass="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            />
          )}
          {PROJECT_STATUSES.map((s) => (
            <FilterChip
              key={s.id}
              label={s.label}
              active={statusActive === s.id}
              readOnly={readOnly}
              onClick={() => onStatusChange?.(statusFilter === s.id ? null : s.id)}
              activeClass="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Türler
        </p>
        <div className="flex flex-wrap gap-1 px-1">
          {!readOnly && (
            <FilterChip
              label="Tümü"
              active={!typeFilter}
              onClick={() => onTypeChange?.(null)}
              activeClass="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            />
          )}
          {PROJECT_TYPES.map((t) => (
            <FilterChip
              key={t.id}
              label={t.label}
              active={typeActive === t.id}
              readOnly={readOnly}
              onClick={() => onTypeChange?.(typeFilter === t.id ? null : t.id)}
              activeClass="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
