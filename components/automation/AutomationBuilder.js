"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CATALOG = [
  ["trigger.manual", "Manual Trigger", "Tetikleyiciler"],
  ["data.set", "Set Fields", "Veri"],
  ["logic.if", "If", "Mantık"],
  ["http.request", "HTTP Request", "HTTP"],
  ["ai.chat", "AI Chat", "AI"],
  ["telegram.send", "Send Message", "Telegram"],
  ["crm.create", "Create Record", "CRM"],
];

const DEFAULT_CONFIG = {
  "trigger.manual": {},
  "data.set": { values: { field: "value" } },
  "logic.if": { left: "", operator: "not_empty", right: "" },
  "http.request": { method: "GET", url: "https://api.example.com", timeoutMs: 30000 },
  "ai.chat": { provider: "auto", systemPrompt: "", prompt: "" },
  "telegram.send": { chatId: "", text: "" },
  "crm.create": { tableId: "", values: {} },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createNode(type, index, customPos = null) {
  const [, label] = CATALOG.find(([key]) => key === type) || [type, type];
  return {
    id: `${type.replace(/[^a-z]/g, "")}-${Date.now()}-${index}`,
    type,
    name: label,
    position: customPos || { x: 100 + (index % 3) * 220, y: 150 + Math.floor(index / 3) * 120 },
    config: clone(DEFAULT_CONFIG[type] || {}),
  };
}

function statusClass(status) {
  if (["succeeded", "partially_succeeded"].includes(status))
    return "bg-emerald-950/40 text-emerald-300 border border-emerald-900/30";
  if (["queued", "running", "waiting"].includes(status))
    return "bg-amber-950/40 text-amber-300 border border-amber-900/30";
  return "bg-rose-955/20 text-rose-300 border border-rose-900/30";
}

// Minimalist vector SVG icon definitions to replace amateur emojis
const ICONS = {
  manual: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  set: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  if: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  http: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  ai: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  telegram: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  crm: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const NODE_THEMES = {
  "trigger.manual": { border: "border-l-amber-500", icon: ICONS.manual, color: "#f59e0b", label: "Manual Trigger" },
  "data.set": { border: "border-l-emerald-500", icon: ICONS.set, color: "#10b981", label: "Set Fields" },
  "logic.if": { border: "border-l-zinc-550", icon: ICONS.if, color: "#71717a", label: "If" },
  "http.request": { border: "border-l-purple-500", icon: ICONS.http, color: "#a855f7", label: "HTTP Request" },
  "ai.chat": { border: "border-l-indigo-500", icon: ICONS.ai, color: "#6366f1", label: "AI Chat" },
  "telegram.send": { border: "border-l-sky-500", icon: ICONS.telegram, color: "#0ea5e9", label: "Send Message" },
  "crm.create": { border: "border-l-rose-500", icon: ICONS.crm, color: "#f43f5e", label: "Create Record" },
};

export default function AutomationBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [execution, setExecution] = useState(null);

  // Layout and n8n States
  const [rightTab, setRightTab] = useState("config");
  const [showDrawer, setShowDrawer] = useState(false); // Modal state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [palettePosition, setPalettePosition] = useState({ x: 200, y: 200 });

  // AI states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // AI chat states
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Merhaba! Ben senin AI Otomasyon Ajanınım. Tuvale çift tıklayarak veya Ctrl+K kombinasyonuyla yeni node arama panelini açabilirsin. Akışta ne yapmak istediğini yaz, senin için çizelim!"
    }
  ]);

  const drag = useRef(null);
  const canvasRef = useRef(null);
  const definition = workflow?.draft_definition;
  const selectedNode = useMemo(() => definition?.nodes?.find((node) => node.id === selected) || null, [definition, selected]);

  // Load workflows
  useEffect(() => {
    async function load() {
      const response = await fetch("/api/automation/workflows");
      const data = await response.json();
      if (!response.ok) setNotice(data.error || "Workflow listesi yüklenemedi.");
      else if (data.workflows[0]) {
        setWorkflows(data.workflows);
        setWorkflow(data.workflows[0]);
        setSelected(data.workflows[0].draft_definition.nodes?.[0]?.id || null);
      } else setWorkflows([]);
      setLoading(false);
    }
    load();
  }, []);

  // Poll executions
  useEffect(() => {
    const id = execution?.execution?.id;
    const active = ["queued", "running", "waiting"].includes(execution?.execution?.status);
    if (!id || !active) return undefined;
    const poll = async () => {
      const response = await fetch(`/api/automation/executions/${id}`);
      const data = await response.json();
      if (response.ok) setExecution(data);
    };
    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [execution?.execution?.id, execution?.execution?.status]);

  // Cmd+K Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPalettePosition({ x: 300, y: 200 });
        setShowCommandPalette(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function open(id) {
    const response = await fetch(`/api/automation/workflows/${id}`);
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "Workflow açılamadı.");
    setWorkflow(data.workflow);
    setSelected(data.workflow.draft_definition.nodes?.[0]?.id || null);
    setExecution(null);
  }

  async function create() {
    const response = await fetch("/api/automation/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "İlk native workflow" }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "Workflow oluşturulamadı.");
    setWorkflows((items) => [data.workflow, ...items]);
    await open(data.workflow.id);
    setNotice("Native başlangıç akışı oluşturuldu.");
  }

  function updateDefinition(next) {
    setWorkflow((current) => ({ ...current, draft_definition: next }));
  }

  function updateNode(nextNode) {
    updateDefinition({
      ...definition,
      nodes: definition.nodes.map((node) => (node.id === nextNode.id ? nextNode : node)),
    });
  }

  function addNode(type, position = null) {
    const pos = position || { x: 150 + (definition.nodes.length % 3) * 220, y: 150 + Math.floor(definition.nodes.length / 3) * 120 };
    const node = createNode(type, definition.nodes.length, pos);
    updateDefinition({ ...definition, nodes: [...definition.nodes, node] });
    setSelected(node.id);
    setShowCommandPalette(false);
    setCommandSearch("");
  }

  // Smooth dragging setup using direct style updates to bypass React lags
  function startDrag(event, node) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const element = document.getElementById(`node-${node.id}`);
    drag.current = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      x: node.position.x,
      y: node.position.y,
      element,
    };
  }

  function moveDrag(event) {
    if (!drag.current) return;
    const deltaX = event.clientX - drag.current.startX;
    const deltaY = event.clientY - drag.current.startY;
    const newX = Math.max(16, drag.current.x + deltaX);
    const newY = Math.max(16, drag.current.y + deltaY);

    // 1. Instantly update node DOM coordinates (60fps)
    if (drag.current.element) {
      drag.current.element.style.left = `${newX}px`;
      drag.current.element.style.top = `${newY}px`;
    }

    // 2. Instantly update connected path lines (SVG)
    definition.edges.forEach((edge) => {
      if (edge.source === drag.current.id || edge.target === drag.current.id) {
        const pathEl = document.getElementById(`path-${edge.id}`);
        if (pathEl) {
          const sourceNode = definition.nodes.find((n) => n.id === edge.source);
          const targetNode = definition.nodes.find((n) => n.id === edge.target);
          if (sourceNode && targetNode) {
            const isSource = edge.source === drag.current.id;
            const sx = isSource ? newX + 176 : sourceNode.position.x + 176;
            const sy = isSource ? newY + 28 : sourceNode.position.y + 28;
            const tx = isSource ? targetNode.position.x : newX;
            const ty = isSource ? targetNode.position.y + 28 : newY + 28;
            const offset = Math.abs(tx - sx) * 0.5;
            pathEl.setAttribute("d", `M ${sx} ${sy} C ${sx + offset} ${sy}, ${tx - offset} ${ty}, ${tx} ${ty}`);
          }
        }
      }
    });
  }

  function endDrag() {
    if (!drag.current) return;
    const node = definition.nodes.find((item) => item.id === drag.current.id);
    if (node) {
      const element = drag.current.element;
      const finalX = parseInt(element.style.left, 10) || node.position.x;
      const finalY = parseInt(element.style.top, 10) || node.position.y;
      updateNode({ ...node, position: { x: finalX, y: finalY } });
    }
    drag.current = null;
  }

  function connect(target) {
    if (!connecting) return setConnecting(target.id);
    if (connecting === target.id || definition.edges.some((edge) => edge.source === connecting && edge.target === target.id))
      return setConnecting(null);
    updateDefinition({
      ...definition,
      edges: [
        ...definition.edges,
        { id: `${connecting}-${target.id}`, source: connecting, target: target.id, sourceHandle: "success" },
      ],
    });
    setConnecting(null);
  }

  async function save() {
    if (!workflow) return false;
    setSaving(true);
    const response = await fetch(`/api/automation/workflows/${workflow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: workflow.name, description: workflow.description, definition }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setNotice(data.error || "Kaydedilemedi.");
      return false;
    }
    setWorkflow(data.workflow);
    setWorkflows((items) => items.map((item) => (item.id === data.workflow.id ? data.workflow : item)));
    return true;
  }

  async function test() {
    if (!(await save())) return;
    const response = await fetch(`/api/automation/workflows/${workflow.id}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: {} }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "Test başlatılamadı.");
    setExecution({ execution: data.execution, nodes: [], logs: [] });
    setNotice(`Test execution ${data.execution.id.slice(0, 8)} kuyruğa alındı.`);
  }

  async function activate() {
    if (!(await save())) return;
    const response = await fetch(`/api/automation/workflows/${workflow.id}/activate`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "Aktifleştirilemedi.");
    setWorkflow(data.workflow);
    setWorkflows((items) => items.map((item) => (item.id === data.workflow.id ? data.workflow : item)));
    setNotice(`Workflow v${data.version.version_number} olarak aktifleştirildi.`);
  }

  function deleteNode(nodeId) {
    updateDefinition({
      ...definition,
      nodes: definition.nodes.filter((n) => n.id !== nodeId),
      edges: definition.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
    if (selected === nodeId) {
      setSelected(null);
      setShowDrawer(false);
    }
  }

  function clearEdges() {
    updateDefinition({
      ...definition,
      edges: [],
    });
  }

  // Handle double-clicking canvas to open command palette
  const handleCanvasDoubleClick = (e) => {
    if (e.target.tagName === "MAIN" || e.target.id === "canvas-container") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
      const y = e.clientY - rect.top + e.currentTarget.scrollTop;
      setPalettePosition({ x: Math.max(16, x - 100), y: Math.max(16, y - 50) });
      setShowCommandPalette(true);
    }
  };

  // AI Assistant Chat trigger
  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          context: { type: "workflow", state: definition },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ajan yanıt veremedi.");

      let text = data.reply || "";
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = text.match(jsonRegex);
      if (match) {
        try {
          const actionData = JSON.parse(match[1].trim());
          if (actionData.action) {
            handleAgentAction(actionData.action);
          }
          if (actionData.actions && Array.isArray(actionData.actions)) {
            runAgentActions(actionData.actions);
          }
          text = text.replace(jsonRegex, "").trim();
        } catch (e) {
          console.error("Action parsing error:", e);
        }
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Bir hata oluştu: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  }

  function runAgentActions(actionsList) {
    let currentDef = clone(definition);
    let nodeCount = currentDef.nodes.length;
    
    actionsList.forEach((action) => {
      if (action.type === "ADD_NODE") {
        const node = createNode(action.nodeType, nodeCount);
        nodeCount++;
        node.position = {
          x: 100 + (currentDef.nodes.length % 3) * 220,
          y: 150 + Math.floor(currentDef.nodes.length / 3) * 120
        };
        currentDef.nodes.push(node);
      } else if (action.type === "CONNECT_NODES") {
        const actualSource = currentDef.nodes.find(n => n.id === action.sourceId || n.id.startsWith(action.sourceId.split("-")[0]) || n.type === action.sourceId);
        const actualTarget = currentDef.nodes.find(n => n.id === action.targetId || n.id.startsWith(action.targetId.split("-")[0]) || n.type === action.targetId);
        
        if (actualSource && actualTarget) {
          currentDef.edges.push({
            id: `${actualSource.id}-${actualTarget.id}`,
            source: actualSource.id,
            target: actualTarget.id,
            sourceHandle: "success"
          });
        }
      } else if (action.type === "DELETE_NODE") {
        currentDef.nodes = currentDef.nodes.filter(n => n.id !== action.nodeId);
        currentDef.edges = currentDef.edges.filter(e => e.source !== action.nodeId && e.target !== action.nodeId);
      }
    });

    updateDefinition(currentDef);
    setNotice(`AI Ajanı ${actionsList.length} adet eylemi gerçekleştirdi.`);
  }

  function handleAgentAction(action) {
    if (action.type === "ADD_NODE") {
      addNode(action.nodeType);
      setNotice(`AI Ajanı yeni bir '${action.nodeType}' düğümü ekledi!`);
    } else if (action.type === "CONNECT_NODES") {
      if (definition.nodes.some((n) => n.id === action.sourceId) && definition.nodes.some((n) => n.id === action.targetId)) {
        updateDefinition({
          ...definition,
          edges: [
            ...definition.edges,
            { id: `${action.sourceId}-${action.targetId}`, source: action.sourceId, target: action.targetId, sourceHandle: "success" },
          ],
        });
        setNotice("AI Ajanı düğümleri birbirine bağladı.");
      }
    } else if (action.type === "DELETE_NODE") {
      deleteNode(action.nodeId);
      setNotice(`AI Ajanı '${action.nodeId}' düğümünü sildi.`);
    }
  }

  async function buildWorkflowWithAI() {
    if (!aiPrompt) return;
    setAiLoading(true);
    setNotice("AI akışı planlıyor ve çiziyor...");
    try {
      const res = await fetch("/api/automation/ai-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: "workflow" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI akış çizemedi.");

      updateDefinition({
        nodes: data.nodes || [],
        edges: data.edges || [],
        variables: definition.variables || {},
        settings: definition.settings || {},
      });
      setSelected(data.nodes?.[0]?.id || null);
      setNotice(`AI Akış Çizdi: ${data.plan}`);
      setAiPrompt("");
    } catch (err) {
      setNotice("Hata: " + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  const filteredCatalog = CATALOG.filter(
    ([, label, group]) =>
      label.toLowerCase().includes(commandSearch.toLowerCase()) || group.toLowerCase().includes(commandSearch.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Automation çalışma alanı hazırlanıyor…
      </div>
    );
  if (!workflow)
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Native Automations</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">İlk akışınızı oluşturun. Harici workflow editörü gerekmez.</p>
        <button
          onClick={create}
          className="mt-5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          İlk workflow’u oluştur
        </button>
        {notice && <p className="mt-4 text-sm text-rose-600">{notice}</p>}
      </div>
    );

  return (
    <div className="flex h-[calc(100vh-var(--dashboard-header-height,3.75rem))] w-full flex-col overflow-hidden bg-[#09090b] text-zinc-100">
      {/* Header Bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-[#121214] px-6 py-3">
        <div className="min-w-0 flex-1">
          <input
            value={workflow.name}
            onChange={(event) => setWorkflow({ ...workflow, name: event.target.value })}
            className="w-full max-w-sm bg-transparent text-sm font-semibold text-zinc-200 outline-none focus:border-b focus:border-zinc-700"
            aria-label="Workflow adı"
          />
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {workflow.status === "active" ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Aktif
              </span>
            ) : (
              "Taslak"
            )}{" "}
            · {definition?.settings?.timezone || "Europe/Istanbul"}
          </p>
        </div>
        <select
          value={workflow.id}
          onChange={(event) => open(event.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          {workflows.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          onClick={create}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Yeni
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          onClick={activate}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Aktifleştir
        </button>
        <button
          onClick={test}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          Test Çalıştır
        </button>
      </header>

      {/* Main Workspace Area */}
      <div className="grid min-h-0 flex-1 grid-cols-[60px_1fr_340px] relative">
        {/* Slim Left Navigation Panel (n8n Style) */}
        <aside className="flex flex-col items-center justify-between py-4 border-r border-zinc-800 bg-[#121214] text-zinc-550 z-20 relative">
          <div className="space-y-4 w-full flex flex-col items-center">
            <button className="h-8 w-8 rounded-lg bg-zinc-900 text-zinc-200 flex items-center justify-center text-xs font-extrabold shadow-md border border-zinc-800 hover:text-white" title="Personal">
              P
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-zinc-850 hover:text-zinc-300" title="Overview">
              O
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-zinc-850 hover:text-zinc-300 relative" title="AI Assistant">
              AI
              <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-[5px] font-bold text-white px-0.5 py-0.2 rounded">CO</span>
            </button>
          </div>
          <div className="text-[10px] font-mono text-zinc-650">v1.0</div>
        </aside>

        {/* Center - Visual Canvas (Dark n8n Theme) */}
        <main
          ref={canvasRef}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onDoubleClick={handleCanvasDoubleClick}
          id="canvas-container"
          className="relative overflow-auto bg-[#101012] bg-[radial-gradient(circle_at_1px_1px,#222225_1px,transparent_0)] bg-[size:16px_16px] z-10"
        >
          {/* AI Co-Pilot Floating Input */}
          <div className="absolute left-6 right-6 top-6 z-20 mx-auto flex max-w-xl gap-2 rounded-2xl border border-zinc-850 bg-[#121214]/95 p-2 shadow-xl backdrop-blur-md">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Yapay zeka ile akış çiz... (örn: 'Manuel başlasın, AI ile metin yazıp Telegram\\'a göndersin')"
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-550 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") buildWorkflowWithAI();
              }}
            />
            <button
              onClick={buildWorkflowWithAI}
              disabled={aiLoading || !aiPrompt}
              className="rounded-xl bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-250 disabled:opacity-50"
            >
              Akış Çiz
            </button>
          </div>

          {/* Node Connections Container */}
          <div className="relative h-[900px] min-w-[1200px]">
            <svg className="absolute inset-0 h-full w-full pointer-events-none overflow-visible">
              {definition.edges.map((edge) => {
                const source = definition.nodes.find((node) => node.id === edge.source);
                const target = definition.nodes.find((node) => node.id === edge.target);
                if (!source || !target) return null;

                const sx = source.position.x + 176;
                const sy = source.position.y + 28;
                const tx = target.position.x;
                const ty = target.position.y + 28;
                const offset = Math.abs(tx - sx) * 0.5;

                return (
                  <path
                    key={edge.id}
                    id={`path-${edge.id}`}
                    d={`M ${sx} ${sy} C ${sx + offset} ${sy}, ${tx - offset} ${ty}, ${tx} ${ty}`}
                    fill="none"
                    stroke="#48484a"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="opacity-70 transition-opacity hover:opacity-100"
                  />
                );
              })}
            </svg>

            {/* n8n Style Horizontal Capsule Nodes */}
            {definition.nodes.map((node) => {
              const theme = NODE_THEMES[node.type] || { icon: "📦", border: "border-l-zinc-650", label: node.name };
              const isSelected = selected === node.id;
              const isExecuting = execution?.logs?.some((l) => l.details?.nodeId === node.id);

              return (
                <div
                  key={node.id}
                  id={`node-${node.id}`}
                  style={{ left: node.position.x, top: node.position.y }}
                  className="absolute flex items-center group cursor-grab active:cursor-grabbing z-20"
                  onPointerDown={(event) => startDrag(event, node)}
                  onDoubleClick={(event) => {
                    event.stopPropagation();
                    setSelected(node.id);
                    setShowDrawer(true);
                  }}
                >
                  {/* Capsule Card Node */}
                  <div
                    className={`relative w-44 h-14 rounded-lg bg-[#18181b] border border-zinc-850 border-l-4 flex items-center p-3 shadow-md gap-3 transition-all ${
                      theme.border
                    } ${isSelected ? "ring-1 ring-orange-500 scale-102 border-zinc-700 bg-zinc-900" : "hover:border-zinc-650"} ${
                      isExecuting ? "ring-2 ring-emerald-500 animate-pulse" : ""
                    }`}
                  >
                    {/* Node Icon */}
                    <div className="h-7 w-7 rounded-md bg-[#101012] border border-zinc-800 flex items-center justify-center text-sm shrink-0">
                      <span className="text-xs text-zinc-400 font-bold">{node.type.split(".")[0].toUpperCase().slice(0, 3)}</span>
                    </div>

                    {/* Text Container */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-zinc-200 truncate">{node.name}</p>
                      <p className="text-[8px] text-zinc-550 truncate mt-0.5">{theme.label}</p>
                    </div>

                    {/* Action hover bubble to delete node */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center h-4.5 w-4.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-rose-500 text-[8px]"
                      title="Node'u sil"
                    >
                      ✕
                    </button>

                    {/* Input/Output Tiny Port Handles */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConnecting(node.id);
                      }}
                      className={`absolute -right-1 top-5 h-2.5 w-2.5 rounded-full border border-[#101012] transition-colors ${
                        connecting === node.id ? "bg-orange-500 animate-ping" : "bg-zinc-600 hover:bg-orange-400"
                      }`}
                      aria-label="Çıkış bağla"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        connect(node);
                      }}
                      className="absolute -left-1.5 top-5 h-2.5 w-2.5 rounded-full border border-[#101012] bg-zinc-750 hover:bg-orange-400"
                      aria-label="Giriş bağla"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Side - n8n Copilot Sidebar */}
        <aside className="flex flex-col border-l border-zinc-800 bg-[#121214] z-20 relative pointer-events-auto">
          {selectedNode ? (
            /* Selected Node Settings tabs */
            <div className="flex-1 flex flex-col h-full justify-between min-h-0">
              <div className="flex border-b border-zinc-800 shrink-0">
                <button
                  onClick={() => setRightTab("config")}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${
                    rightTab === "config" ? "border-b-2 border-zinc-100 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Ayarlar
                </button>
                <button
                  onClick={() => setRightTab("ai")}
                  className={`flex-1 py-3 text-xs font-bold transition-all ${
                    rightTab === "ai" ? "border-b-2 border-zinc-100 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  AI Chat
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                {rightTab === "ai" ? (
                  /* Chat */
                  <div className="flex-1 flex flex-col min-h-0 justify-between">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-1 min-h-0">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl p-3 text-xs leading-relaxed max-w-[85%] ${
                            msg.role === "user"
                              ? "bg-zinc-800 text-zinc-250 self-end ml-auto"
                              : "bg-blue-955/20 text-blue-300 border border-blue-900/30"
                          }`}
                        >
                          <p className="font-semibold text-[8px] uppercase tracking-wider opacity-60 mb-1">
                            {msg.role === "user" ? "Sen" : "AI Ajanı"}
                          </p>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="rounded-xl p-3 text-xs bg-blue-955/10 text-blue-400 w-[60%] animate-pulse">
                          Düşünülüyor...
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-zinc-800 flex gap-2 shrink-0 bg-[#121214]">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ajan ile konuşun..."
                        className="flex-1 rounded-xl border border-zinc-850 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendChatMessage();
                        }}
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={chatLoading || !chatInput.trim()}
                        className="rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-250 disabled:opacity-50"
                      >
                        Gönder
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Node parameters */
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-zinc-250">{selectedNode.name}</h3>
                        <p className="text-[9px] font-mono text-zinc-550 mt-0.5">{selectedNode.id}</p>
                      </div>
                      <button
                        onClick={() => deleteNode(selectedNode.id)}
                        className="rounded-lg border border-rose-900 px-2 py-1 text-[10px] font-semibold text-rose-400 hover:bg-rose-955/20"
                      >
                        Sil
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550">Node Adı</span>
                        <input
                          value={selectedNode.name}
                          onChange={(event) => updateNode({ ...selectedNode, name: event.target.value })}
                          className="mt-1.5 w-full rounded-lg border border-zinc-850 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550">Config (JSON)</span>
                        <textarea
                          value={JSON.stringify(selectedNode.config, null, 2)}
                          onChange={(event) => {
                            try {
                              updateNode({ ...selectedNode, config: JSON.parse(event.target.value) });
                            } catch {
                              /* parsed on save */
                            }
                          }}
                          className="mt-1.5 h-44 w-full resize-y rounded-lg border border-zinc-850 bg-[#141416] p-2 font-mono text-[9px] leading-relaxed text-zinc-300 focus:outline-none"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* n8n Style "What happens next?" menu when no node is selected */
            <div className="p-4 space-y-4 flex flex-col h-full justify-between min-h-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-250">What happens next?</h3>
                  <p className="text-[9px] text-zinc-550 mt-0.5">Akışa eklemek için bir düğüm kategorisine tıklayın:</p>
                </div>

                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => addNode("ai.chat")}
                    className="w-full flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5 text-left hover:bg-zinc-800"
                  >
                    <span>AI</span>
                    <div>
                      <p className="font-bold text-zinc-200">AI Node</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">Build autonomous agents, summarize docs, etc.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => addNode("telegram.send")}
                    className="w-full flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5 text-left hover:bg-zinc-800"
                  >
                    <span>APP</span>
                    <div>
                      <p className="font-bold text-zinc-200">Action in an app</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">Do something in Telegram or Google Sheets.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => addNode("data.set")}
                    className="w-full flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5 text-left hover:bg-zinc-800"
                  >
                    <span>DAT</span>
                    <div>
                      <p className="font-bold text-zinc-200">Data transformation</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">Manipulate, filter or convert payload fields.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => addNode("logic.if")}
                    className="w-full flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5 text-left hover:bg-zinc-800"
                  >
                    <span>FLO</span>
                    <div>
                      <p className="font-bold text-zinc-200">Flow</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">Branch, logic gates, merge or loop the flow.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => addNode("http.request")}
                    className="w-full flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5 text-left hover:bg-zinc-800"
                  >
                    <span>REQ</span>
                    <div>
                      <p className="font-bold text-zinc-200">Core</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">Run code, make HTTP requests, webhooks.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => addNode("trigger.manual")}
                    className="w-full flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5 text-left hover:bg-zinc-800"
                  >
                    <span>TRG</span>
                    <div>
                      <p className="font-bold text-zinc-200">Add trigger</p>
                      <p className="text-[8px] text-zinc-500 mt-0.5">Manual or webhook trigger events to start.</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950/20 border border-zinc-800 rounded-xl text-[9px] text-zinc-550 leading-relaxed">
                Sürükle-bırak yaparken kasılma yaşanmaması için DOM optimizasyonu yapıldı (60fps). Herhangi bir düğümü çift tıklayarak parametre çekmecesini alttan kaydırabilirsiniz.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Premium Liquid Glass Parameter Modal (Centered popup style) */}
      {showDrawer && selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          {/* Glass Card Container */}
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-700/40 bg-zinc-900/75 backdrop-blur-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-zinc-150 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-950/40 border border-orange-900/30 px-2 py-0.5 rounded-lg">
                  {selectedNode.type.split(".")[0].toUpperCase()}
                </span>
                <h3 className="text-sm font-bold text-zinc-100">{selectedNode.name} Ayarları</h3>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-zinc-400 hover:text-zinc-200 rounded-lg p-1.5 hover:bg-zinc-800/60"
              >
                ✕ Kapat
              </button>
            </div>

            {/* Split Content columns */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              {/* Parameter Editor Inputs */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550">Düğüm İsmi</span>
                  <input
                    value={selectedNode.name}
                    onChange={(event) => updateNode({ ...selectedNode, name: event.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#101012] px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-550">Düğüm Konfigürasyonu (JSON)</span>
                  <textarea
                    value={JSON.stringify(selectedNode.config, null, 2)}
                    onChange={(event) => {
                      try {
                        updateNode({ ...selectedNode, config: JSON.parse(event.target.value) });
                      } catch {
                        /* ignored */
                      }
                    }}
                    className="mt-1.5 h-60 w-full resize-none rounded-lg border border-zinc-800 bg-[#101012] p-3 font-mono text-[10px] leading-relaxed text-zinc-300 focus:outline-none focus:border-zinc-700 transition"
                  />
                </label>
              </div>

              {/* Data and Variable Context view */}
              <div className="w-[40%] rounded-xl bg-zinc-950/40 border border-zinc-800/60 p-4 overflow-y-auto space-y-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/60 pb-2">Değişkenler Sözdizimi</h4>
                
                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-550 font-bold">Giriş Parametresi:</p>
                  <code className="block rounded bg-zinc-950 p-2 text-[9px] text-emerald-400 font-mono select-all border border-zinc-900">
                    {"{{ nodes." + selectedNode.id.split("-")[0] + ".output.FIELD }}"}
                  </code>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-550 font-bold">Düğüm ID'si:</p>
                  <code className="block rounded bg-zinc-950 p-2 text-[9px] text-sky-400 font-mono select-all border border-zinc-900">
                    {selectedNode.id}
                  </code>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-850 mt-4 pt-4 flex justify-end">
              <button
                onClick={() => setShowDrawer(false)}
                className="rounded-xl bg-zinc-100 px-5 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-200 transition"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* n8n Style Command Palette (Node Finder Popup Modal) */}
      {showCommandPalette && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#121214] p-4 shadow-2xl flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-zinc-400">Arama: Eklenecek Düğümü Seçin</span>
              <button
                onClick={() => {
                  setShowCommandPalette(false);
                  setCommandSearch("");
                }}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <input
              autoFocus
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              placeholder="Düğüm ismi veya kategori arayın..."
              className="mt-3 w-full rounded-xl border border-zinc-850 bg-zinc-900 px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-550 focus:outline-none focus:border-zinc-700"
            />

            <div className="flex-1 overflow-y-auto mt-3 space-y-1 pr-1 min-h-[200px]">
              {filteredCatalog.map(([type, label, group]) => {
                const theme = NODE_THEMES[type] || { icon: "📦" };
                return (
                  <button
                    key={type}
                    onClick={() => addNode(type, palettePosition)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left hover:bg-zinc-850 hover:border-zinc-800"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs">
                      {theme.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-250">{label}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{group}</p>
                    </div>
                  </button>
                );
              })}
              {filteredCatalog.length === 0 && (
                <p className="text-xs text-center text-zinc-550 py-8">Aradığınız kriterlere uygun düğüm bulunamadı.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="border-t border-zinc-800 bg-amber-950/20 px-6 py-2.5 text-xs font-medium text-amber-300">
          ⚠️ {notice}
        </div>
      )}
    </div>
  );
}
