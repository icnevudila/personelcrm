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

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function createNode(type, index) {
  const [, label] = CATALOG.find(([key]) => key === type) || [type, type];
  return {
    id: `${type.replace(/[^a-z]/g, "")}-${Date.now()}-${index}`,
    type,
    name: label,
    position: { x: 80 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 170 },
    config: clone(DEFAULT_CONFIG[type] || {}),
  };
}

function statusClass(status) {
  if (["succeeded", "partially_succeeded"].includes(status)) return "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
  if (["queued", "running", "waiting"].includes(status)) return "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
  return "bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100";
}

export default function AutomationBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [execution, setExecution] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [rightTab, setRightTab] = useState("ai");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Merhaba! Ben senin AI Otomasyon Ajanınım. 🤖\n\nSana bu akışı tasarlamada yardımcı olabilirim. Bana ne yapmak istediğini yaz, senin için akışa yeni düğümler (node'lar) ekleyeyim, bağlantıları kurayım veya ayarları yapılandırayım.\n\n**Örnek İstekler:**\n* *'Akışıma bir Telegram bildirim düğümü ekle'*\n* *'HTTP Request düğümü nasıl kullanılır?'*\n* *'Manuel tetiklenen ve AI ile metin özetleyen bir akış kur'*"
    }
  ]);

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
          context: { type: "workflow", state: definition }
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

  function handleAgentAction(action) {
    if (action.type === "ADD_NODE") {
      addNode(action.nodeType);
      setNotice(`AI Ajanı yeni bir '${action.nodeType}' düğümü ekledi!`);
    } else if (action.type === "CONNECT_NODES") {
      if (definition.nodes.some(n => n.id === action.sourceId) && definition.nodes.some(n => n.id === action.targetId)) {
        updateDefinition({
          ...definition,
          edges: [...definition.edges, { id: `${action.sourceId}-${action.targetId}`, source: action.sourceId, target: action.targetId, sourceHandle: "success" }]
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
  const drag = useRef(null);
  const definition = workflow?.draft_definition;
  const selectedNode = useMemo(() => definition?.nodes?.find((node) => node.id === selected) || null, [definition, selected]);

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

  async function open(id) {
    const response = await fetch(`/api/automation/workflows/${id}`);
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "Workflow açılamadı.");
    setWorkflow(data.workflow);
    setSelected(data.workflow.draft_definition.nodes?.[0]?.id || null);
    setExecution(null);
  }

  async function create() {
    const response = await fetch("/api/automation/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "İlk native workflow" }) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || "Workflow oluşturulamadı.");
    setWorkflows((items) => [data.workflow, ...items]);
    await open(data.workflow.id);
    setNotice("Native başlangıç akışı oluşturuldu.");
  }

  function updateDefinition(next) { setWorkflow((current) => ({ ...current, draft_definition: next })); }
  function updateNode(nextNode) { updateDefinition({ ...definition, nodes: definition.nodes.map((node) => node.id === nextNode.id ? nextNode : node) }); }
  function addNode(type) {
    const node = createNode(type, definition.nodes.length);
    updateDefinition({ ...definition, nodes: [...definition.nodes, node] });
    setSelected(node.id);
  }
  function startDrag(event, node) {
    if (event.button !== 0) return;
    drag.current = { id: node.id, startX: event.clientX, startY: event.clientY, x: node.position.x, y: node.position.y };
  }
  function moveDrag(event) {
    if (!drag.current) return;
    const node = definition.nodes.find((item) => item.id === drag.current.id);
    if (!node) return;
    updateNode({ ...node, position: { x: Math.max(16, drag.current.x + event.clientX - drag.current.startX), y: Math.max(16, drag.current.y + event.clientY - drag.current.startY) } });
  }
  function connect(target) {
    if (!connecting) return setConnecting(target.id);
    if (connecting === target.id || definition.edges.some((edge) => edge.source === connecting && edge.target === target.id)) return setConnecting(null);
    updateDefinition({ ...definition, edges: [...definition.edges, { id: `${connecting}-${target.id}`, source: connecting, target: target.id, sourceHandle: "success" }] });
    setConnecting(null);
  }

  async function save() {
    if (!workflow) return false;
    setSaving(true);
    const response = await fetch(`/api/automation/workflows/${workflow.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: workflow.name, description: workflow.description, definition }) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) { setNotice(data.error || "Kaydedilemedi."); return false; }
    setWorkflow(data.workflow);
    setWorkflows((items) => items.map((item) => item.id === data.workflow.id ? data.workflow : item));
    return true;
  }
  async function test() {
    if (!(await save())) return;
    const response = await fetch(`/api/automation/workflows/${workflow.id}/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: {} }) });
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
    setWorkflows((items) => items.map((item) => item.id === data.workflow.id ? data.workflow : item));
    setNotice(`Workflow v${data.version.version_number} olarak aktifleştirildi.`);
  }

  function deleteNode(nodeId) {
    updateDefinition({
      ...definition,
      nodes: definition.nodes.filter((n) => n.id !== nodeId),
      edges: definition.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    });
    if (selected === nodeId) setSelected(null);
  }

  function clearEdges() {
    updateDefinition({
      ...definition,
      edges: [],
    });
  }

  const getNodeTheme = (type) => {
    switch (type) {
      case "trigger.manual":
        return { border: "border-l-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", icon: "⚡" };
      case "data.set":
        return { border: "border-l-blue-500", bg: "bg-blue-50/50 dark:bg-blue-950/20", icon: "📝" };
      case "logic.if":
        return { border: "border-l-amber-500", bg: "bg-amber-50/50 dark:bg-amber-950/20", icon: "🔀" };
      case "http.request":
        return { border: "border-l-purple-500", bg: "bg-purple-50/50 dark:bg-purple-950/20", icon: "🌐" };
      case "ai.chat":
        return { border: "border-l-indigo-500", bg: "bg-indigo-50/50 dark:bg-indigo-950/20", icon: "🧠" };
      case "telegram.send":
        return { border: "border-l-sky-500", bg: "bg-sky-50/50 dark:bg-sky-950/20", icon: "✈️" };
      case "crm.create":
        return { border: "border-l-rose-500", bg: "bg-rose-50/50 dark:bg-rose-950/20", icon: "👥" };
      default:
        return { border: "border-l-zinc-500", bg: "bg-zinc-50/50 dark:bg-zinc-950/20", icon: "⚙️" };
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">Automation çalışma alanı hazırlanıyor…</div>;
  if (!workflow) return <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900"><h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Native Automations</h1><p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">İlk akışınızı oluşturun. n8n iframe’i veya harici workflow editörü kullanılmaz.</p><button onClick={create} className="mt-5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">İlk workflow’u oluştur</button>{notice && <p className="mt-4 text-sm text-rose-600">{notice}</p>}</div>;

  return (
    <div className="flex h-[calc(100vh-var(--dashboard-header-height,3.75rem))] w-full flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-6 py-3.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-w-0 flex-1">
          <input
            value={workflow.name}
            onChange={(event) => setWorkflow({ ...workflow, name: event.target.value })}
            className="w-full max-w-sm bg-transparent text-base font-semibold text-zinc-900 outline-none dark:text-zinc-50"
            aria-label="Workflow adı"
          />
          <p className="mt-0.5 text-xs text-zinc-500">
            {workflow.status === "active" ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Aktif sürüm yayınlandı
              </span>
            ) : "Taslak"} · {definition?.settings?.timezone || "Europe/Istanbul"}
          </p>
        </div>
        <select
          value={workflow.id}
          onChange={(event) => open(event.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {workflows.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <button onClick={create} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-850">Yeni</button>
        <button onClick={save} disabled={saving} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-60 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-850">{saving ? "Kaydediliyor..." : "Kaydet"}</button>
        <button onClick={activate} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-850">Aktifleştir</button>
        <button onClick={test} className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">Test çalıştır</button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(480px,1fr)_340px]">
        {/* Left Side - Node Library */}
        <aside className="flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Node Kütüphanesi</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {CATALOG.map(([type, label, group]) => {
              const theme = getNodeTheme(type);
              return (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  className={`flex w-full items-center gap-3 rounded-xl border border-zinc-100 p-2.5 text-left transition hover:border-zinc-200 hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/40`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-base dark:bg-zinc-800">{theme.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{group}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              ⚡ Çıkış noktasına (sarı/gri buton), ardından hedef node’un solundaki giriş butonuna tıklayarak bağlantı kurabilirsiniz.
            </p>
          </div>
        </aside>

        {/* Center - Visual Canvas */}
        <main
          onPointerMove={moveDrag}
          onPointerUp={() => { drag.current = null; }}
          className="relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,#e4e4e7_1.5px,transparent_0)] bg-[size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,#27272a_1.5px,transparent_0)]"
        >
          {/* AI Co-Pilot Floating Input */}
          <div className="absolute left-6 right-6 top-6 z-10 mx-auto flex max-w-xl gap-2 rounded-2xl border border-zinc-200 bg-white/95 p-2 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Yapay zeka ile akış çiz... (örn: 'Manuel başlasın, Groq ile özet çıkarıp Telegram\\'a göndersin')"
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
              onKeyDown={(e) => { if (e.key === "Enter") buildWorkflowWithAI(); }}
            />
            <button
              onClick={buildWorkflowWithAI}
              disabled={aiLoading || !aiPrompt}
              className="rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-250 animate-shimmer"
            >
              {aiLoading ? "Çiziliyor..." : "Akış Çiz ⚡"}
            </button>
          </div>

          <div className="relative h-[900px] min-w-[1200px]">
            {definition.edges.map((edge) => {
              const source = definition.nodes.find((node) => node.id === edge.source);
              const target = definition.nodes.find((node) => node.id === edge.target);
              if (!source || !target) return null;
              const x1 = source.position.x + 220;
              const y1 = source.position.y + 36;
              const x2 = target.position.x;
              const y2 = target.position.y + 36;
              return (
                <svg key={edge.id} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                  <path
                    d={`M ${x1} ${y1} C ${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              );
            })}

            {definition.nodes.map((node) => {
              const theme = getNodeTheme(node.type);
              const isSelected = selected === node.id;
              return (
                <div
                  key={node.id}
                  style={{ left: node.position.x, top: node.position.y }}
                  onPointerDown={(event) => startDrag(event, node)}
                  className={`absolute w-[220px] cursor-grab rounded-xl border border-l-4 bg-white shadow-sm transition-all active:cursor-grabbing dark:bg-zinc-900 ${theme.border} ${
                    isSelected
                      ? "ring-2 ring-zinc-500 border-zinc-900 dark:border-zinc-100"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className={`flex items-start justify-between p-3.5 ${theme.bg} rounded-t-xl`}>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {theme.icon} {CATALOG.find(([type]) => type === node.type)?.[2]}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                        {node.name}
                      </span>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="ml-2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"
                      title="Node'u sil"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="border-t border-zinc-100 p-2.5 dark:border-zinc-800">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(node.id);
                      }}
                      className="w-full text-center text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-450 dark:hover:text-zinc-100"
                    >
                      Ayarları Düzenle
                    </button>
                  </div>

                  {/* Handles */}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setConnecting(node.id);
                    }}
                    className={`absolute -right-2 top-8 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-900 ${
                      connecting === node.id ? "bg-amber-400 animate-ping" : "bg-zinc-400 hover:bg-zinc-600"
                    }`}
                    aria-label={`${node.name} çıkışını bağla`}
                  />
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      connect(node);
                    }}
                    className="absolute -left-2 top-8 h-4 w-4 rounded-full border-2 border-white bg-zinc-300 hover:bg-zinc-500 dark:border-zinc-900 dark:bg-zinc-650"
                    aria-label={`${node.name} girişini bağla`}
                  />
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Side - AI Copilot or Details */}
        <aside className="flex flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {/* Tab Switcher */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setRightTab("ai")}
              className={`flex-1 py-3 text-xs font-bold transition-all ${
                rightTab === "ai"
                  ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500"
              }`}
            >
              🤖 AI Ajanı Chat
            </button>
            <button
              onClick={() => setRightTab("config")}
              className={`flex-1 py-3 text-xs font-bold transition-all ${
                rightTab === "config"
                  ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500"
              }`}
            >
              ⚙️ Node Ayarları
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col justify-between">
            {rightTab === "ai" ? (
              /* AI Agent chat mode */
              <div className="flex flex-col h-full justify-between min-h-0">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-3 text-xs leading-relaxed max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-zinc-100 text-zinc-800 self-end ml-auto dark:bg-zinc-800 dark:text-zinc-200"
                          : "bg-blue-50 text-blue-900 dark:bg-blue-950/20 dark:text-blue-200"
                      }`}
                    >
                      <p className="font-semibold text-[9px] uppercase tracking-wider opacity-60 mb-1">
                        {msg.role === "user" ? "Sen" : "AI Ajanı"}
                      </p>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="rounded-xl p-3 text-xs bg-blue-50/50 text-blue-800 dark:bg-blue-950/10 dark:text-blue-300 w-[60%] animate-pulse">
                      Ajan düşünüyor...
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-850 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ajan ile konuşun... (örn: 'Bir crm düğümü ekle')"
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendChatMessage();
                    }}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Gönder
                  </button>
                </div>
              </div>
            ) : (
              /* Config and execution logs mode */
              <div className="space-y-5">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{selectedNode.name}</h3>
                        <p className="text-[9px] font-mono text-zinc-400 mt-0.5">{selectedNode.id}</p>
                      </div>
                      <button
                        onClick={() => deleteNode(selectedNode.id)}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        Node'u Sil
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Node Adı</span>
                        <input
                          value={selectedNode.name}
                          onChange={(event) => updateNode({ ...selectedNode, name: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Config (JSON)</span>
                        <textarea
                          value={JSON.stringify(selectedNode.config, null, 2)}
                          onChange={(event) => {
                            try {
                              updateNode({ ...selectedNode, config: JSON.parse(event.target.value) });
                            } catch {
                              /* JSON validated on save */
                            }
                          }}
                          className="mt-1 h-44 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-2 font-mono text-[10px] leading-relaxed text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-zinc-500">Ayarları düzenlemek için tuval üzerindeki bir node'u seçin.</p>
                    {definition.edges.length > 0 && (
                      <button
                        onClick={clearEdges}
                        className="mt-3 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-850"
                      >
                        Tüm Bağlantıları Temizle
                      </button>
                    )}
                  </div>
                )}

                <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Çalışma Logları (Execution)</p>
                  {execution ? (
                    <div className={`mt-3 rounded-xl p-3 border ${statusClass(execution.execution.status)}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase">{execution.execution.status}</p>
                        <span className="text-[9px] text-zinc-450 dark:text-zinc-400">{execution.execution.duration_ms ? `${execution.execution.duration_ms}ms` : ""}</span>
                      </div>
                      <p className="mt-1 font-mono text-[9px] text-zinc-500">{execution.execution.id}</p>
                      <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-white/60 p-2.5 font-mono text-[9px] leading-relaxed text-zinc-900 dark:bg-black/20 dark:text-zinc-100">
                        {JSON.stringify(execution.logs?.length ? execution.logs : execution.nodes, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-450 dark:text-zinc-400">
                      Akışı test et butonuna bastığınızda gerçek zamanlı loglar burada görünecektir.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      {notice && (
        <div className="border-t border-zinc-200 bg-amber-50 px-6 py-2.5 text-xs font-medium text-amber-900 dark:border-zinc-800 dark:bg-amber-950/30 dark:text-amber-100">
          {notice}
        </div>
      )}
    </div>
  );
}
