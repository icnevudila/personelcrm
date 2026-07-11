"use client";

import { useEffect, useRef, useState } from "react";

function clampProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function ProgressBar({ value, size = "md" }) {
  const pct = clampProgress(value);
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={`w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ${height}`}>
      <div
        className={`${height} rounded-full bg-emerald-500 transition-all duration-300 dark:bg-emerald-400`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function MoreIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

function RoundPlusButton({ onClick, title, size = "md" }) {
  const sizeCls = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconCls = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`${sizeCls} flex shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white`}
    >
      <PlusIcon className={iconCls} />
    </button>
  );
}

function CardMenu({ onEdit, onDelete, disabled, groupName = "card" }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const hoverCls =
    groupName === "goal"
      ? "group-hover/goal:opacity-100 group-focus-within/goal:opacity-100"
      : "group-hover/sub:opacity-100 group-focus-within/sub:opacity-100";

  return (
    <div
      ref={menuRef}
      className={`absolute right-2 top-2 z-10 transition-opacity ${
        open ? "opacity-100" : `opacity-0 ${hoverCls}`
      }`}
    >
      <button
        type="button"
        title="Aksiyonlar"
        aria-label="Aksiyonlar"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <MoreIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Düzenle
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
            Sil
          </button>
        </div>
      )}
    </div>
  );
}

function GoalFormModal({
  open,
  title: modalTitle,
  submitLabel,
  initialTitle = "",
  initialProgress = 0,
  showProgress = true,
  saving,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setProgress(initialProgress);
  }, [open, initialTitle, initialProgress]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    onSubmit({
      title: trimmed,
      progress: showProgress ? clampProgress(progress) : 0,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-form-title"
      >
        <h2 id="goal-form-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {modalTitle}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hedef metni…"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
              disabled={saving}
            />
          </div>

          {showProgress && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">İlerleme (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(clampProgress(e.target.value))}
                  className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  disabled={saving}
                />
                <span className="text-sm text-zinc-500">%</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={progress} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Kaydediliyor…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubgoalCard({ subgoal, saving, onEdit, onDelete }) {
  return (
    <div className="group/sub relative flex min-w-[11rem] max-w-[16rem] flex-1 flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 pr-10 dark:border-zinc-700 dark:bg-zinc-800/50">
      <CardMenu groupName="sub" onEdit={onEdit} onDelete={onDelete} disabled={saving} />

      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{subgoal.title}</p>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <ProgressBar value={subgoal.progress} size="sm" />
        </div>
        <p className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          %{clampProgress(subgoal.progress)}
        </p>
      </div>
    </div>
  );
}

function GoalCard({ goal, saving, onEdit, onDelete, onAddSubgoal, onEditSubgoal, onDeleteSubgoal }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-5">
      <div className="group/goal relative space-y-2 pr-10">
        <CardMenu groupName="goal" onEdit={onEdit} onDelete={onDelete} disabled={saving} />
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{goal.title}</h3>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <ProgressBar value={goal.progress} />
          </div>
          <p className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            %{clampProgress(goal.progress)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Alt hedefler</p>

        <div className="flex flex-wrap items-stretch gap-2.5">
          {(goal.subgoals || []).map((sub) => (
            <SubgoalCard
              key={sub.id}
              subgoal={sub}
              saving={saving}
              onEdit={() => onEditSubgoal(sub)}
              onDelete={() => onDeleteSubgoal(sub.id)}
            />
          ))}
          <button
            type="button"
            title="Alt hedef ekle"
            aria-label="Alt hedef ekle"
            onClick={onAddSubgoal}
            className="flex min-h-[4.5rem] min-w-[4.5rem] shrink-0 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition hover:border-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800/40 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DashboardGoals({
  initialGoals = [],
  apiBase = "/api/goals",
  title = "Hedef Yönetimi",
  description = "Öncelikli hedeflerini ve ilerlemeyi burada tut. Her gün bunun için mücadele et.",
  compact = false,
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [loading, setLoading] = useState(initialGoals.length === 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [addSubgoalGoalId, setAddSubgoalGoalId] = useState(null);
  const [editSubgoal, setEditSubgoal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(apiBase)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) setGoals(data);
      })
      .catch(() => {
        if (!cancelled) setError("Hedefler yüklenemedi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  function replaceGoal(updated) {
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }

  async function handleAddGoal({ title, progress }) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, progress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eklenemedi");
      setGoals((prev) => [...prev, data]);
      setAddGoalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateGoal({ title, progress }) {
    if (!editGoal) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/${editGoal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, progress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi");
      replaceGoal(data);
      setEditGoal(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGoal(goalId) {
    if (!window.confirm("Bu hedef ve alt hedefleri silinsin mi?")) return;
    setSaving(true);
    setError("");
    const prev = goals;
    setGoals((list) => list.filter((g) => g.id !== goalId));
    try {
      const res = await fetch(`${apiBase}/${goalId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi");
    } catch (err) {
      setGoals(prev);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSubgoal({ title, progress }) {
    if (!addSubgoalGoalId) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/${addSubgoalGoalId}/subgoals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, progress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Alt hedef eklenemedi");
      setGoals((prev) =>
        prev.map((g) =>
          g.id === addSubgoalGoalId
            ? { ...g, subgoals: [...(g.subgoals || []), data] }
            : g
        )
      );
      setAddSubgoalGoalId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSubgoal({ title, progress }) {
    if (!editSubgoal) return;
    const { goalId, subgoal } = editSubgoal;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/${goalId}/subgoals/${subgoal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, progress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncellenemedi");
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                subgoals: (g.subgoals || []).map((s) => (s.id === subgoal.id ? data : s)),
              }
            : g
        )
      );
      setEditSubgoal(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubgoal(goalId, subId) {
    if (!window.confirm("Bu alt hedef silinsin mi?")) return;
    setSaving(true);
    setError("");
    const prev = goals;
    setGoals((list) =>
      list.map((g) =>
        g.id === goalId
          ? { ...g, subgoals: (g.subgoals || []).filter((s) => s.id !== subId) }
          : g
      )
    );
    try {
      const res = await fetch(`${apiBase}/${goalId}/subgoals/${subId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi");
    } catch (err) {
      setGoals(prev);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            className={
              compact
                ? "text-base font-semibold text-zinc-900 dark:text-zinc-50"
                : "text-xl font-bold text-zinc-900 dark:text-zinc-50"
            }
          >
            {title}
          </h2>
          {description && (
            <p className={`text-sm text-zinc-500 ${compact ? "mt-1" : "mt-0.5"}`}>{description}</p>
          )}
        </div>
        <RoundPlusButton title="Hedef ekle" onClick={() => setAddGoalOpen(true)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          Yükleniyor…
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Henüz hedef yok</p>
          <p className="mt-1 text-sm text-zinc-500">
            Sağ üstteki + ile ana hedefini ekle, alt hedeflerle parçala.
          </p>
          <div className="mt-4 flex justify-center">
            <RoundPlusButton title="Hedef ekle" onClick={() => setAddGoalOpen(true)} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              saving={saving}
              onEdit={() => setEditGoal(goal)}
              onDelete={() => handleDeleteGoal(goal.id)}
              onAddSubgoal={() => setAddSubgoalGoalId(goal.id)}
              onEditSubgoal={(sub) => setEditSubgoal({ goalId: goal.id, subgoal: sub })}
              onDeleteSubgoal={(subId) => handleDeleteSubgoal(goal.id, subId)}
            />
          ))}
        </div>
      )}

      <GoalFormModal
        open={addGoalOpen}
        title="Yeni hedef"
        submitLabel="Ekle"
        initialTitle=""
        initialProgress={0}
        saving={saving}
        onClose={() => !saving && setAddGoalOpen(false)}
        onSubmit={handleAddGoal}
      />

      <GoalFormModal
        open={Boolean(editGoal)}
        title="Hedefi düzenle"
        submitLabel="Kaydet"
        initialTitle={editGoal?.title || ""}
        initialProgress={editGoal?.progress ?? 0}
        saving={saving}
        onClose={() => !saving && setEditGoal(null)}
        onSubmit={handleUpdateGoal}
      />

      <GoalFormModal
        open={Boolean(addSubgoalGoalId)}
        title="Yeni alt hedef"
        submitLabel="Ekle"
        initialTitle=""
        initialProgress={0}
        saving={saving}
        onClose={() => !saving && setAddSubgoalGoalId(null)}
        onSubmit={handleAddSubgoal}
      />

      <GoalFormModal
        open={Boolean(editSubgoal)}
        title="Alt hedefi düzenle"
        submitLabel="Kaydet"
        initialTitle={editSubgoal?.subgoal?.title || ""}
        initialProgress={editSubgoal?.subgoal?.progress ?? 0}
        saving={saving}
        onClose={() => !saving && setEditSubgoal(null)}
        onSubmit={handleUpdateSubgoal}
      />
    </section>
  );
}
