"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import {
  COLUMN_TYPES,
  buildDraftFingerprint,
  cloneSchemaData,
  defaultWelcomeMessage,
  emptySchemaData,
  generateSupabaseSql,
  normalizeTables,
} from "@/lib/dbSchemaUtils";

const TABLE_WIDTH = 220;
const HEADER_H = 40;
const ROW_H = 28;
const FOOTER_H = 36;

function tableHeight(table) {
  return HEADER_H + table.columns.length * ROW_H + FOOTER_H;
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function BackIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
    </svg>
  );
}

function RevertIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.5 8c-2.65 0-5.05 1.54-6.17 3.95L3.5 10.5V16h5.5l-1.97-1.97C7.86 12.47 10.05 11 12.5 11c2.76 0 5.21 1.79 6.07 4.36l1.46-.47C18.88 11.52 15.93 8 12.5 8z" />
    </svg>
  );
}

function LinkIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}

function CopyIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
}

export default function DbSchemaPlannerTab({
  projectId,
  projectName,
  projectDescription = "",
  fullscreen = false,
  onBack,
}) {
  const [tables, setTables] = useState([]);
  const [chatMessages, setChatMessages] = useState([defaultWelcomeMessage()]);
  const [projectContext, setProjectContext] = useState(projectDescription || "");
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(null);
  const [linking, setLinking] = useState(null);
  const [linkPointer, setLinkPointer] = useState(null);
  const [editingTableId, setEditingTableId] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState(null);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  const isDirty =
    savedFingerprint !==
    buildDraftFingerprint({
      schemaData: { tables },
      chatMessages,
      projectContext,
    });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/db-schema`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yüklenemedi");
        if (cancelled) return;

        const loadedTables = normalizeTables(data.schema_data?.tables || []);
        const loadedMessages = data.chat_messages?.length
          ? data.chat_messages
          : [defaultWelcomeMessage()];
        const loadedContext =
          data.project_context ||
          projectDescription ||
          `${projectName} projesi için veritabanı şema taslağı.`;

        setTables(loadedTables);
        setChatMessages(loadedMessages);
        setProjectContext(loadedContext);
        setSavedFingerprint(
          buildDraftFingerprint({
            schemaData: { tables: loadedTables },
            chatMessages: loadedMessages,
            projectContext: loadedContext,
          })
        );
      } catch {
        if (!cancelled) {
          setTables([]);
          setChatMessages([defaultWelcomeMessage()]);
          setProjectContext(projectDescription || "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, projectName, projectDescription]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selectedRelation) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      e.preventDefault();
      clearForeignKey(selectedRelation.sourceTableId, selectedRelation.sourceColumnId);
      setSelectedRelation(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRelation]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setTables((prev) =>
        prev.map((t) =>
          t.id === dragging.tableId
            ? { ...t, x: Math.max(0, dragging.origX + dx), y: Math.max(0, dragging.origY + dy) }
            : t
        )
      );
    }
    function onUp() {
      setDragging(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (!panning) return;
    function onMove(e) {
      const el = canvasRef.current;
      if (!el) return;
      el.scrollLeft = panning.scrollLeft - (e.clientX - panning.startX);
      el.scrollTop = panning.scrollTop - (e.clientY - panning.startY);
    }
    function onUp() {
      setPanning(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [panning]);

  useEffect(() => {
    if (!linking) return;
    function onMove(e) {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setLinkPointer({
        x: e.clientX - rect.left + el.scrollLeft,
        y: e.clientY - rect.top + el.scrollTop,
      });
    }
    function onUp() {
      setLinking(null);
      setLinkPointer(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [linking]);

  const getColumnAnchor = useCallback((tableId, columnId) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return null;
    const colIndex = table.columns.findIndex((c) => c.id === columnId);
    if (colIndex < 0) return null;
    return {
      x: table.x + TABLE_WIDTH,
      y: table.y + HEADER_H + colIndex * ROW_H + ROW_H / 2,
    };
  }, [tables]);

  const getRelations = useCallback(() => {
    const lines = [];
    tables.forEach((source) => {
      source.columns.forEach((col, colIndex) => {
        if (!col.fkRef) return;
        const target = tables.find((t) => t.id === col.fkRef.tableId);
        if (!target) return;
        const targetColIndex = target.columns.findIndex((c) => c.name === col.fkRef.column);
        const targetColumn = target.columns[targetColIndex >= 0 ? targetColIndex : 0];
        const srcY = source.y + HEADER_H + colIndex * ROW_H + ROW_H / 2;
        const tgtY =
          target.y + HEADER_H + (targetColIndex >= 0 ? targetColIndex : 0) * ROW_H + ROW_H / 2;
        const srcX = source.x + TABLE_WIDTH;
        const tgtX = target.x;
        const midX = (srcX + tgtX) / 2;
        lines.push({
          id: `${source.id}-${col.id}`,
          sourceTableId: source.id,
          sourceColumnId: col.id,
          targetTableId: target.id,
          targetColumnId: targetColumn?.id,
          d: `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX} ${tgtY}`,
        });
      });
    });
    return lines;
  }, [tables]);

  function handleAddTable(e) {
    e.preventDefault();
    const name = newTableName.trim().replace(/\s+/g, "_").toLowerCase();
    if (!name || tables.some((t) => t.name === name)) return;
    setTables((prev) => [
      ...prev,
      {
        id: nanoid(8),
        name,
        x: 120 + prev.length * 40,
        y: 120 + prev.length * 30,
        columns: [{ id: nanoid(8), name: "id", type: "uuid", isPk: true }],
      },
    ]);
    setNewTableName("");
  }

  function handleDeleteTable(tableId) {
    if (!confirm("Bu tabloyu silmek istediğinize emin misiniz?")) return;
    setTables((prev) =>
      prev
        .filter((t) => t.id !== tableId)
        .map((t) => ({
          ...t,
          columns: t.columns.map((c) =>
            c.fkRef?.tableId === tableId ? { ...c, fkRef: undefined } : c
          ),
        }))
    );
  }

  function handleRenameTable(tableId, name) {
    const safe = name.trim().replace(/\s+/g, "_").toLowerCase();
    if (!safe) return;
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, name: safe } : t)));
    setEditingTableId(null);
  }

  function handleAddColumn(tableId) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: [
                ...t.columns,
                { id: nanoid(8), name: "new_field", type: "text", isPk: false },
              ],
            }
          : t
      )
    );
  }

  function handleUpdateColumn(tableId, columnId, patch) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)),
            }
          : t
      )
    );
  }

  function handleDeleteColumn(tableId, columnId) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) } : t
      )
    );
  }

  function handleTogglePk(tableId, columnId) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.map((c) =>
                c.id === columnId
                  ? { ...c, isPk: !c.isPk, fkRef: !c.isPk ? undefined : c.fkRef }
                  : c.isPk
                    ? { ...c, isPk: false }
                    : c
              ),
            }
          : t
      )
    );
  }

  function clearForeignKey(sourceTableId, sourceColumnId) {
    setSelectedRelation((prev) =>
      prev?.sourceTableId === sourceTableId && prev?.sourceColumnId === sourceColumnId
        ? null
        : prev
    );
    setTables((prev) =>
      prev.map((t) =>
        t.id === sourceTableId
          ? {
              ...t,
              columns: t.columns.map((c) =>
                c.id === sourceColumnId ? { ...c, fkRef: undefined } : c
              ),
            }
          : t
      )
    );
  }

  function startLink(e, tableId, columnId) {
    e.stopPropagation();
    e.preventDefault();
    const anchor = getColumnAnchor(tableId, columnId);
    setLinking({ fromTableId: tableId, fromColumnId: columnId });
    setLinkPointer(anchor);
  }

  function completeLink(targetTableId, targetColumnId) {
    if (!linking) return;
    if (linking.fromTableId === targetTableId) return;
    const targetTable = tables.find((t) => t.id === targetTableId);
    const targetCol = targetTable?.columns.find((c) => c.id === targetColumnId);
    if (!targetCol) return;

    setTables((prev) =>
      prev.map((t) =>
        t.id === linking.fromTableId
          ? {
              ...t,
              columns: t.columns.map((c) =>
                c.id === linking.fromColumnId
                  ? { ...c, fkRef: { tableId: targetTableId, column: targetCol.name }, isPk: false }
                  : c
              ),
            }
          : t
      )
    );
    setLinking(null);
    setLinkPointer(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/projects/${projectId}/db-schema`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_context: projectContext,
          schema_data: { tables: normalizeTables(tables) },
          chat_messages: chatMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi");

      const fp = buildDraftFingerprint({
        schemaData: data.schema_data,
        chatMessages: data.chat_messages,
        projectContext: data.project_context,
      });
      setSavedFingerprint(fp);
      setSaveMsg("Kaydedildi");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (e) {
      setSaveMsg(e.message || "Hata");
    } finally {
      setSaving(false);
    }
  }

  async function handleChatSubmit(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const schemaSnapshot = cloneSchemaData({ tables: normalizeTables(tables) });
    const userMsg = {
      id: nanoid(8),
      role: "user",
      content: text,
      schemaSnapshot,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/db-schema/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          project_context: projectContext,
          schema_data: { tables: normalizeTables(tables) },
          recent_messages: [...chatMessages, userMsg].slice(-10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI yanıt veremedi");

      setTables(normalizeTables(data.schema_data?.tables || tables));
      setChatMessages((prev) => [
        ...prev,
        { id: nanoid(8), role: "assistant", content: data.message },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: nanoid(8),
          role: "assistant",
          content: "Hata: " + (err.message || "Bağlantı sorunu"),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function revertToMessage(messageId) {
    const idx = chatMessages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;
    const msg = chatMessages[idx];
    if (!msg.schemaSnapshot) return;
    if (!confirm("Bu mesajdan sonraki şema değişiklikleri geri alınacak. Devam?")) return;
    setTables(normalizeTables(msg.schemaSnapshot.tables || []));
    setChatMessages((prev) => prev.slice(0, idx));
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    setShowSettings(false);
  }

  function startCanvasPan(e) {
    if (linking) return;
    if (e.button !== 0) return;
    if (e.target.closest("[data-schema-table]")) return;
    if (e.target.closest("[data-relation-line]")) return;
    if (e.target.closest("button,input,select,textarea")) return;
    setSelectedRelation(null);
    const el = canvasRef.current;
    if (!el) return;
    setPanning({
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    });
    e.preventDefault();
  }

  function startDrag(e, table) {
    if (linking) return;
    if (e.target.closest("button,input,select,textarea")) return;
    e.stopPropagation();
    setDragging({
      tableId: table.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: table.x,
      origY: table.y,
    });
  }

  async function copySql() {
    const sql = generateSupabaseSql(tables);
    await navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  }

  const relations = getRelations();
  const sqlText = generateSupabaseSql(tables);
  const linkFromAnchor = linking
    ? getColumnAnchor(linking.fromTableId, linking.fromColumnId)
    : null;

  function isRelationColumnHighlighted(tableId, columnId) {
    if (!selectedRelation) return false;
    return (
      (selectedRelation.sourceTableId === tableId &&
        selectedRelation.sourceColumnId === columnId) ||
      (selectedRelation.targetTableId === tableId && selectedRelation.targetColumnId === columnId)
    );
  }

  const canvasCursor = linking
    ? "cursor-crosshair"
    : panning
      ? "cursor-grabbing"
      : dragging
        ? "cursor-grabbing"
        : "cursor-grab";

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${fullscreen ? "h-screen" : "h-64"}`}>
        <p className="text-sm text-zinc-400">Şema yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${fullscreen ? "h-screen" : ""}`}>
      <div
        className={`flex overflow-hidden border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${
          fullscreen ? "h-full border-0" : "h-[calc(100vh-200px)] min-h-[560px] rounded-lg border"
        }`}
      >
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                title="Projeye dön"
                aria-label="Projeye dön"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <BackIcon className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            >
              SQL
            </button>
            <form onSubmit={handleAddTable} className="flex items-center gap-2">
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="yeni_tablo"
                className="w-36 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                + Tablo
              </button>
            </form>
            <span className="hidden text-xs text-zinc-400 sm:inline">
              İlişki: link ikonundan sürükle · çizgiye tıkla seç · Del ile sil
            </span>
            {selectedRelation && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                İlişki seçili — Del
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {isDirty ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Kaydedilmedi
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Kayıtlı
                </span>
              )}
              {saveMsg && (
                <span className={`text-xs ${saveMsg === "Kaydedildi" ? "text-emerald-600" : "text-red-600"}`}>
                  {saveMsg}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>

          <div
            ref={canvasRef}
            onPointerDown={startCanvasPan}
            className={`relative flex-1 overflow-auto select-none bg-[radial-gradient(circle,_#d4d4d8_1px,_transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(circle,_#3f3f46_1px,_transparent_1px)] ${canvasCursor}`}
          >
            {linkFromAnchor && linkPointer && (
              <svg className="pointer-events-none absolute inset-0 z-[5] h-full min-h-[1200px] w-full min-w-[1600px]">
                <path
                  d={`M ${linkFromAnchor.x} ${linkFromAnchor.y} L ${linkPointer.x} ${linkPointer.y}`}
                  fill="none"
                  stroke="currentColor"
                  className="text-indigo-500"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              </svg>
            )}

            <div className="relative min-h-[1200px] min-w-[1600px]">
              {tables.map((table) => (
                <div
                  key={table.id}
                  data-schema-table
                  className={`absolute cursor-auto select-none rounded-lg border border-zinc-300 bg-white shadow-md dark:border-zinc-600 dark:bg-zinc-800 ${dragging?.tableId === table.id ? "z-20 ring-2 ring-zinc-400" : "z-10"}`}
                  style={{
                    left: table.x,
                    top: table.y,
                    width: TABLE_WIDTH,
                    height: tableHeight(table),
                  }}
                  onPointerDown={(e) => startDrag(e, table)}
                >
                  <div className="flex cursor-grab items-center justify-between gap-1 rounded-t-lg border-b border-zinc-200 bg-zinc-100 px-2 py-2 active:cursor-grabbing dark:border-zinc-600 dark:bg-zinc-700/80">
                    {editingTableId === table.id ? (
                      <input
                        autoFocus
                        defaultValue={table.name}
                        className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-1 py-0.5 font-mono text-xs dark:border-zinc-500 dark:bg-zinc-900"
                        onBlur={(e) => handleRenameTable(table.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameTable(table.id, e.currentTarget.value);
                          if (e.key === "Escape") setEditingTableId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        type="button"
                        className="truncate font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTableId(table.id);
                        }}
                      >
                        {table.name}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.id);
                      }}
                      className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>

                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
                    {table.columns.map((col) => (
                      <li
                        key={col.id}
                        className={`flex items-center gap-1 px-2 py-1 text-[11px] transition-colors ${
                          isRelationColumnHighlighted(table.id, col.id)
                            ? "bg-indigo-100 ring-2 ring-inset ring-indigo-400 dark:bg-indigo-950/70 dark:ring-indigo-500"
                            : linking
                              ? "ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800"
                              : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        onPointerUp={(e) => {
                          if (linking && linking.fromTableId !== table.id) {
                            e.stopPropagation();
                            completeLink(table.id, col.id);
                          }
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (col.fkRef) {
                              clearForeignKey(table.id, col.id);
                            } else {
                              handleTogglePk(table.id, col.id);
                            }
                          }}
                          className={`shrink-0 rounded px-0.5 font-mono text-[9px] font-bold ${col.isPk ? "text-amber-600" : col.fkRef ? "text-emerald-600" : "text-zinc-300"}`}
                          title={
                            col.fkRef
                              ? "Foreign key — tıkla sil"
                              : col.isPk
                                ? "Primary key"
                                : "PK yap"
                          }
                        >
                          {col.isPk ? "PK" : col.fkRef ? "FK" : "··"}
                        </button>
                        <input
                          value={col.name}
                          onChange={(e) =>
                            handleUpdateColumn(table.id, col.id, {
                              name: e.target.value.replace(/\s+/g, "_"),
                            })
                          }
                          className="min-w-0 flex-1 rounded border-0 bg-transparent font-mono text-zinc-800 focus:bg-zinc-50 focus:ring-1 focus:ring-zinc-300 dark:text-zinc-200"
                        />
                        <select
                          value={col.type}
                          onChange={(e) =>
                            handleUpdateColumn(table.id, col.id, { type: e.target.value })
                          }
                          className="max-w-[72px] shrink-0 rounded border border-zinc-200 bg-zinc-50 px-0.5 py-0 font-mono text-[10px] dark:border-zinc-600 dark:bg-zinc-900"
                        >
                          {COLUMN_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {!col.isPk && (
                          <button
                            type="button"
                            onPointerDown={(e) => startLink(e, table.id, col.id)}
                            className={`shrink-0 rounded p-0.5 ${linking?.fromColumnId === col.id ? "text-indigo-600" : "text-zinc-400 hover:text-indigo-600"}`}
                            title="İlişki kur — sürükle"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(table.id, col.id)}
                          className="shrink-0 text-zinc-300 hover:text-red-500"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddColumn(table.id);
                    }}
                    className="w-full rounded-b-lg border-t border-zinc-100 py-2 text-center text-[10px] text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700"
                  >
                    + Alan ekle
                  </button>
                </div>
              ))}
            </div>

            <svg className="pointer-events-none absolute inset-0 z-[15] h-full min-h-[1200px] w-full min-w-[1600px]">
              {relations.map((line) => {
                const isSelected = selectedRelation?.id === line.id;
                return (
                  <g
                    key={line.id}
                    data-relation-line
                    className="pointer-events-auto cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRelation(isSelected ? null : line);
                    }}
                  >
                    <path
                      d={line.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="16"
                    />
                    <path
                      d={line.d}
                      fill="none"
                      stroke="currentColor"
                      className={
                        isSelected
                          ? "text-indigo-500 dark:text-indigo-400"
                          : "text-emerald-500/70 hover:text-emerald-600 dark:text-emerald-400/60 dark:hover:text-emerald-300"
                      }
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={isSelected ? "none" : "4 3"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <aside className="flex w-[min(100%,380px)] shrink-0 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Şema Asistanı</span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              title="Proje bağlamı"
            >
              <SettingsIcon />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" && msg.schemaSnapshot && (
                  <button
                    type="button"
                    onClick={() => revertToMessage(msg.id)}
                    title="Bu mesaja geri dön"
                    aria-label="Bu mesaja geri dön"
                    className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <RevertIcon className="h-4 w-4" />
                  </button>
                )}
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide opacity-50">
                    {msg.role === "user" ? "Siz" : "Asistan"}
                  </p>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="mr-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                Düşünüyor…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="border-t border-zinc-200 p-3 dark:border-zinc-700">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Örn: Bu bir e-ticaret projesi, users ve products tabloları oluştur…"
              rows={3}
              disabled={chatLoading}
              className="mb-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="w-full rounded-xl bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {chatLoading ? "Gönderiliyor…" : "Gönder"}
            </button>
          </form>
        </aside>
      </div>

      {showSqlModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Supabase SQL</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copySql}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200"
                >
                  <CopyIcon className="h-4 w-4" />
                  {sqlCopied ? "Kopyalandı" : "Kopyala"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Kapat
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto bg-zinc-950 p-4 text-xs leading-relaxed text-emerald-400">
              {sqlText}
            </pre>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Proje bağlamı</h3>
            <p className="mb-3 text-xs text-zinc-500">
              AI asistanı bu metni okur. Kalıcı kayıt için üstteki <strong>Kaydet</strong> butonunu kullanın.
            </p>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <textarea
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button type="submit" className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                Tamam
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
