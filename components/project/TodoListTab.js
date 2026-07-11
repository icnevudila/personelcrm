"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";

const TODO_COLORS = [
  { id: "blue", label: "Mavi", dot: "bg-sky-500" },
  { id: "amber", label: "Sarı", dot: "bg-amber-500" },
  { id: "rose", label: "Kırmızı", dot: "bg-rose-500" },
];

function getColorMeta(colorId) {
  return TODO_COLORS.find((c) => c.id === colorId) || null;
}

const BULLET_LINE_RE = /^(\s*)([-*•])\s+(.*)$/;

function TodoTitleContent({ title }) {
  const lines = String(title || "").split("\n");

  return (
    <span className="block">
      {lines.map((line, i) => {
        const bulletMatch = line.match(BULLET_LINE_RE);
        if (bulletMatch) {
          return (
            <span key={i} className="flex gap-1.5">
              <span className="shrink-0 select-none" aria-hidden>
                •
              </span>
              <span className="min-w-0">{bulletMatch[3]}</span>
            </span>
          );
        }

        return (
          <span key={i} className="block">
            {line || "\u00A0"}
          </span>
        );
      })}
    </span>
  );
}

function handleTodoTextareaKeyDown(e, value, setValue) {
  if (e.key !== "Enter") return;

  if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${value.slice(0, start)}\n${value.slice(end)}`;
    setValue(next);
    requestAnimationFrame(() => {
      const pos = start + 1;
      el.selectionStart = pos;
      el.selectionEnd = pos;
    });
    return;
  }

  e.preventDefault();
  e.currentTarget.form?.requestSubmit();
}

function DragHandleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

function ColorPicker({ value, onChange, size = "md" }) {
  const btnSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <div className="flex items-center gap-1">
      {TODO_COLORS.map((color) => {
        const selected = value === color.id;
        return (
          <button
            key={color.id}
            type="button"
            title={color.label}
            aria-label={color.label}
            onClick={() => onChange(selected ? null : color.id)}
            className={`${btnSize} rounded-full ${color.dot} transition-transform hover:scale-110 ${
              selected ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900" : ""
            }`}
          />
        );
      })}
    </div>
  );
}

const menuItemCls =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

function TodoRowActions({
  todo,
  canReorder,
  isFirst,
  isLast,
  onColorChange,
  onClearColor,
  onArchive,
  onUnarchive,
  onMarkLater,
  onUnmarkLater,
  onEdit,
  onDelete,
  onMoveTop,
  onMoveBottom,
  onCopy,
}) {
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

  function run(action) {
    setOpen(false);
    action?.();
  }

  return (
    <div
      className={`ml-auto flex shrink-0 items-center gap-0.5 transition-opacity duration-150 ${
        open
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      }`}
    >
      <button
        type="button"
        title="Kopyala"
        aria-label="Kopyala"
        onClick={() => onCopy(todo)}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
      </button>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          title="Aksiyonlar"
          aria-label="Aksiyonlar"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="px-2.5 py-1.5">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Renk</p>
              <div className="flex items-center gap-1.5">
                {TODO_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    title={color.label}
                    aria-label={`${color.label} yap`}
                    onClick={() => run(() => onColorChange(todo, color.id))}
                    className={`h-6 w-6 rounded-full ${color.dot} hover:scale-110 ${
                      todo.color === color.id
                        ? "ring-2 ring-zinc-400 ring-offset-1 dark:ring-offset-zinc-900"
                        : ""
                    }`}
                  />
                ))}
                {todo.color && (
                  <button
                    type="button"
                    title="Rengi kaldır"
                    aria-label="Rengi kaldır"
                    onClick={() => run(() => onClearColor(todo))}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

            {canReorder && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={isFirst}
                  onClick={() => run(() => onMoveTop(todo))}
                  className={`${menuItemCls} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 11h3v10h2V11h3l-4-4-4 4zM4 4v2h16V4H4z" />
                  </svg>
                  En üste taşı
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={isLast}
                  onClick={() => run(() => onMoveBottom(todo))}
                  className={`${menuItemCls} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 20v2h16v-2H4z" />
                  </svg>
                  En alta taşı
                </button>
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              </>
            )}

            {todo.is_later ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => run(() => onUnmarkLater(todo))}
                className={menuItemCls}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
                </svg>
                Aktif listeye al
              </button>
            ) : !todo.is_archived ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => run(() => onMarkLater(todo))}
                className={menuItemCls}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
                </svg>
                Later olarak işaretle
              </button>
            ) : null}

            {todo.is_archived ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => run(() => onUnarchive(todo))}
                className={menuItemCls}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 10.5l4 4h-3v3h-2v-3H8l4-4zM20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27z" />
                </svg>
                Arşivden çıkar
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => run(() => onArchive(todo))}
                className={menuItemCls}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
                </svg>
                Arşivle
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => run(() => onEdit(todo))}
              className={menuItemCls}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              Düzenle
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => run(() => onDelete(todo))}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              Sil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TodoEditModal({ todo, saving, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setColor(todo.color || null);
    }
  }, [todo]);

  if (!todo) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ title: trimmed, color });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Todo Düzenle</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">İçerik</label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => handleTodoTextareaKeyDown(e, title, setTitle)}
              rows={5}
              className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder={"Görev metni…\n- Madde 1\n- Madde 2"}
              autoFocus
            />
            <p className="mt-1 text-xs text-zinc-400">Enter kaydeder, ⌘/Ctrl+Enter alt satıra geçer. Satır başında - ile madde ekleyebilirsiniz.</p>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-500">Renk</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TodoDeleteConfirmModal({ todo, deleting, onClose, onConfirm }) {
  if (!todo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-delete-title"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="todo-delete-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Todo silinsin mi?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Bu işlem geri alınamaz. Todo listeden kaldırılacak.
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100">
              <TodoTitleContent title={todo.title} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting ? "Siliniyor…" : "Evet, sil"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TodoListTab({ projectId }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [showLater, setShowLater] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingTodo, setDeletingTodo] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const visibleTodos = useMemo(() => todos.filter((t) => !t.is_deleted), [todos]);
  const activeTodos = useMemo(
    () => visibleTodos.filter((t) => !t.is_archived && !t.is_later),
    [visibleTodos]
  );
  const laterTodos = useMemo(
    () => visibleTodos.filter((t) => t.is_later && !t.is_archived),
    [visibleTodos]
  );
  const archivedTodos = useMemo(() => visibleTodos.filter((t) => t.is_archived), [visibleTodos]);

  function mergeActiveOrder(nextActive) {
    const activeIds = new Set(nextActive.map((t) => t.id));
    setTodos((prev) => [...nextActive, ...prev.filter((t) => !activeIds.has(t.id))]);
  }

  useEffect(() => {
    fetch(`/api/projects/${projectId}/todos`)
      .then((r) => r.json())
      .then((data) => {
        setTodos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  async function patchTodo(todoId, payload) {
    const res = await fetch(`/api/projects/${projectId}/todos/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Güncellenemedi");
    return data;
  }

  function replaceTodo(updated) {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleAdd(e) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || adding) return;

    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, color: newColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eklenemedi");
      setTodos((prev) => [...prev, data]);
      setNewTitle("");
      setNewColor(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(todo) {
    const nextCompleted = !todo.is_completed;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_completed: nextCompleted } : t))
    );
    try {
      const updated = await patchTodo(todo.id, { is_completed: nextCompleted });
      replaceTodo(updated);
    } catch (err) {
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, is_completed: todo.is_completed } : t))
      );
      setError(err.message);
    }
  }

  async function handleColorChange(todo, colorId) {
    const nextColor = todo.color === colorId ? null : colorId;
    const prevColor = todo.color;
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, color: nextColor } : t)));
    try {
      const updated = await patchTodo(todo.id, { color: nextColor });
      replaceTodo(updated);
    } catch (err) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, color: prevColor } : t)));
      setError(err.message);
    }
  }

  async function handleClearColor(todo) {
    if (!todo.color) return;
    const prevColor = todo.color;
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, color: null } : t)));
    try {
      const updated = await patchTodo(todo.id, { color: null });
      replaceTodo(updated);
    } catch (err) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, color: prevColor } : t)));
      setError(err.message);
    }
  }

  async function handleArchive(todo) {
    const prev = { is_archived: todo.is_archived, is_later: todo.is_later };
    setTodos((prevList) =>
      prevList.map((t) => (t.id === todo.id ? { ...t, is_archived: true, is_later: false } : t))
    );
    try {
      const updated = await patchTodo(todo.id, { is_archived: true });
      replaceTodo(updated);
    } catch (err) {
      setTodos((prevList) =>
        prevList.map((t) => (t.id === todo.id ? { ...t, ...prev } : t))
      );
      setError(err.message);
    }
  }

  async function handleUnarchive(todo) {
    const prev = { is_archived: todo.is_archived, is_later: todo.is_later };
    setTodos((prevList) =>
      prevList.map((t) => (t.id === todo.id ? { ...t, is_archived: false, is_later: false } : t))
    );
    try {
      const updated = await patchTodo(todo.id, { is_archived: false });
      replaceTodo(updated);
    } catch (err) {
      setTodos((prevList) =>
        prevList.map((t) => (t.id === todo.id ? { ...t, ...prev } : t))
      );
      setError(err.message);
    }
  }

  async function handleMarkLater(todo) {
    const prev = { is_later: todo.is_later, is_archived: todo.is_archived };
    setTodos((prevList) =>
      prevList.map((t) => (t.id === todo.id ? { ...t, is_later: true, is_archived: false } : t))
    );
    try {
      const updated = await patchTodo(todo.id, { is_later: true });
      replaceTodo(updated);
    } catch (err) {
      setTodos((prevList) =>
        prevList.map((t) => (t.id === todo.id ? { ...t, ...prev } : t))
      );
      setError(err.message);
    }
  }

  async function handleUnmarkLater(todo) {
    const prev = { is_later: todo.is_later };
    setTodos((prevList) =>
      prevList.map((t) => (t.id === todo.id ? { ...t, is_later: false } : t))
    );
    try {
      const updated = await patchTodo(todo.id, { is_later: false });
      replaceTodo(updated);
    } catch (err) {
      setTodos((prevList) =>
        prevList.map((t) => (t.id === todo.id ? { ...t, ...prev } : t))
      );
      setError(err.message);
    }
  }

  async function confirmDelete() {
    if (!deletingTodo || deleteSaving) return;
    const todo = deletingTodo;
    setDeleteSaving(true);
    setError("");
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    try {
      const res = await fetch(`/api/projects/${projectId}/todos/${todo.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silinemedi");
      setDeletingTodo(null);
    } catch (err) {
      setTodos((prev) => [...prev, todo]);
      setError(err.message);
    } finally {
      setDeleteSaving(false);
    }
  }

  async function handleEditSave(payload) {
    if (!editingTodo) return;
    setEditSaving(true);
    setError("");
    try {
      const updated = await patchTodo(editingTodo.id, payload);
      replaceTodo(updated);
      setEditingTodo(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function persistOrder(nextTodos) {
    setReordering(true);
    const res = await fetch(`/api/projects/${projectId}/todos/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered_ids: nextTodos.map((t) => t.id) }),
    });
    const data = await res.json();
    setReordering(false);

    if (!res.ok) {
      setError(data.error || "Sıralama kaydedilemedi");
      fetch(`/api/projects/${projectId}/todos`)
        .then((r) => r.json())
        .then((list) => setTodos(Array.isArray(list) ? list : []));
      return;
    }

    const nextActive = Array.isArray(data) ? data : nextTodos;
    const activeIds = new Set(nextActive.map((t) => t.id));
    setTodos((prev) => [...nextActive, ...prev.filter((t) => !activeIds.has(t.id))]);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setOverIndex(index);
    }
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    const next = [...activeTodos];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    mergeActiveOrder(next);
    setDragIndex(null);
    setOverIndex(null);
    persistOrder(next);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleMoveTop(todo) {
    const index = activeTodos.findIndex((t) => t.id === todo.id);
    if (index <= 0) return;
    const next = [...activeTodos];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    mergeActiveOrder(next);
    persistOrder(next);
  }

  function handleMoveBottom(todo) {
    const index = activeTodos.findIndex((t) => t.id === todo.id);
    if (index < 0 || index >= activeTodos.length - 1) return;
    const next = [...activeTodos];
    const [moved] = next.splice(index, 1);
    next.push(moved);
    mergeActiveOrder(next);
    persistOrder(next);
  }

  async function handleCopy(todo) {
    try {
      await navigator.clipboard.writeText(todo.title || "");
      toast.success("Kopyalandı", {
        duration: 2000,
        classNames: {
          toast: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
          title: "text-emerald-800 dark:text-emerald-100",
          icon: "text-emerald-600 dark:text-emerald-400",
        },
      });
    } catch {
      setError("Kopyalanamadı");
    }
  }

  function renderTodoRow(todo, { draggable = false, index = 0 } = {}) {
    const colorMeta = getColorMeta(todo.color);
    const isDragging = draggable && dragIndex === index;
    const isOver = draggable && overIndex === index && dragIndex !== index;

    return (
      <li
        key={todo.id}
        draggable={draggable && !reordering}
        onDragStart={draggable ? () => handleDragStart(index) : undefined}
        onDragOver={draggable ? (e) => handleDragOver(e, index) : undefined}
        onDrop={draggable ? (e) => handleDrop(e, index) : undefined}
        onDragEnd={draggable ? handleDragEnd : undefined}
        className={`group flex items-start gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-2 transition-all sm:gap-3 sm:px-3 dark:border-zinc-700 dark:bg-zinc-900 ${
          isDragging
            ? "opacity-50"
            : isOver
              ? "ring-2 ring-zinc-200 dark:ring-zinc-700"
              : ""
        } ${todo.is_archived || todo.is_later ? "opacity-80" : ""}`}
      >
        {draggable ? (
          <button
            type="button"
            className="mt-0.5 cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
            aria-label="Sürükleyerek sırala"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DragHandleIcon className="h-5 w-5" />
          </button>
        ) : (
          <span className="w-5 shrink-0" aria-hidden />
        )}

        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 sm:gap-2.5">
          <input
            type="checkbox"
            checked={Boolean(todo.is_completed)}
            onChange={() => handleToggle(todo)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
            aria-label={todo.is_completed ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
          />

          {colorMeta && (
            <span
              title={colorMeta.label}
              aria-hidden
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${colorMeta.dot}`}
            />
          )}

          <span
            className={`min-w-0 flex-1 text-sm leading-relaxed select-none ${
              todo.is_completed
                ? "text-zinc-400 line-through dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            <TodoTitleContent title={todo.title} />
          </span>
        </label>

        <div className="mt-0.5">
          <TodoRowActions
            todo={todo}
            canReorder={draggable}
            isFirst={draggable && index === 0}
            isLast={draggable && index === activeTodos.length - 1}
            onColorChange={handleColorChange}
            onClearColor={handleClearColor}
            onArchive={handleArchive}
            onUnarchive={handleUnarchive}
            onMarkLater={handleMarkLater}
            onUnmarkLater={handleUnmarkLater}
            onEdit={setEditingTodo}
            onDelete={setDeletingTodo}
            onMoveTop={handleMoveTop}
            onMoveBottom={handleMoveBottom}
            onCopy={handleCopy}
          />
        </div>
      </li>
    );
  }

  const inputCls =
    "min-w-0 flex-1 resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  const completedCount = activeTodos.filter((t) => t.is_completed).length;

  if (loading) {
    return <div className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</div>;
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-center" richColors={false} />
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Todo List</h2>
        <p className="text-sm text-zinc-500">
          Proje görevlerini ekleyin, renklendirin, tamamlayın ve sürükleyerek sıralayın.
          {activeTodos.length > 0 && (
            <span className="ml-1 text-zinc-400">
              ({completedCount}/{activeTodos.length} tamamlandı)
            </span>
          )}
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => handleTodoTextareaKeyDown(e, newTitle, setNewTitle)}
          placeholder={"Yeni todo…\n- Madde 1\n- Madde 2"}
          rows={3}
          className={inputCls}
          disabled={adding}
        />
        <div className="flex w-fit shrink-0 flex-col items-stretch gap-2">
          <ColorPicker value={newColor} onChange={setNewColor} />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="w-full rounded-lg bg-zinc-900 px-2 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {adding ? "…" : "Ekle"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {activeTodos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Henüz aktif todo yok. Yukarıdan ekleyin.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {activeTodos.map((todo, index) => renderTodoRow(todo, { draggable: true, index }))}
        </ul>
      )}

      {reordering && <p className="text-xs text-zinc-400">Sıralama kaydediliyor…</p>}

      {laterTodos.length > 0 && (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowLater((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span>Later ({laterTodos.length})</span>
            <svg
              className={`h-4 w-4 transition-transform ${showLater ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>

          {showLater && (
            <ul className="mt-2 space-y-1.5">
              {laterTodos.map((todo) => renderTodoRow(todo))}
            </ul>
          )}
        </div>
      )}

      {archivedTodos.length > 0 && (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span>Arşiv ({archivedTodos.length})</span>
            <svg
              className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>

          {showArchived && (
            <ul className="mt-2 space-y-1.5">
              {archivedTodos.map((todo) => renderTodoRow(todo))}
            </ul>
          )}
        </div>
      )}
      <TodoEditModal
        todo={editingTodo}
        saving={editSaving}
        onClose={() => setEditingTodo(null)}
        onSave={handleEditSave}
      />
      <TodoDeleteConfirmModal
        todo={deletingTodo}
        deleting={deleteSaving}
        onClose={() => !deleteSaving && setDeletingTodo(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
