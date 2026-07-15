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

  if (loading) return <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">Automation çalışma alanı hazırlanıyor…</div>;
  if (!workflow) return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900"><h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Native Automations</h1><p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">İlk akışınızı oluşturun. n8n iframe’i veya harici workflow editörü kullanılmaz.</p><button onClick={create} className="mt-5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">İlk workflow’u oluştur</button>{notice && <p className="mt-4 text-sm text-rose-600">{notice}</p>}</div>;

  return <div className="-mx-4 -my-6 flex h-[calc(100vh-65px)] min-h-[720px] flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 sm:-mx-6">
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"><div className="min-w-0 flex-1"><input value={workflow.name} onChange={(event) => setWorkflow({ ...workflow, name: event.target.value })} className="w-full max-w-sm bg-transparent text-base font-semibold text-zinc-900 outline-none dark:text-zinc-50" aria-label="Workflow adı" /><p className="mt-0.5 text-xs text-zinc-500">{workflow.status === "active" ? "Aktif sürüm yayınlandı" : "Taslak"} · {definition?.settings?.timezone || "Europe/Istanbul"}</p></div><select value={workflow.id} onChange={(event) => open(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">{workflows.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={create} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">Yeni</button><button onClick={save} disabled={saving} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200">{saving ? "Kaydediliyor" : "Kaydet"}</button><button onClick={activate} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">Aktifleştir</button><button onClick={test} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">Test çalıştır</button></header>
    <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(560px,1fr)_300px]"><aside className="overflow-y-auto border-r border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"><p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Node kütüphanesi</p>{CATALOG.map(([type, label, group]) => <button key={type} onClick={() => addNode(type)} className="mb-1 flex w-full flex-col rounded-lg px-2 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"><span className="text-xs font-medium text-zinc-800 dark:text-zinc-100">{label}</span><span className="text-[10px] text-zinc-500">{group}</span></button>)}<p className="mt-4 px-2 text-[10px] leading-4 text-zinc-500">Çıkış noktasına, sonra hedef node’un giriş noktasına tıklayın. Hatalı bağlantılar kaydedilirken doğrulanır.</p></aside>
      <main onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} className="relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,#d4d4d8_1px,transparent_0)] bg-[size:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,#3f3f46_1px,transparent_0)]"><div className="relative h-[760px] min-w-[1040px]">{definition.edges.map((edge) => { const source = definition.nodes.find((node) => node.id === edge.source); const target = definition.nodes.find((node) => node.id === edge.target); if (!source || !target) return null; const x1 = source.position.x + 190; const y1 = source.position.y + 48; const x2 = target.position.x; const y2 = target.position.y + 48; return <svg key={edge.id} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"><path d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`} fill="none" stroke="#a1a1aa" strokeWidth="2" /></svg>; })}{definition.nodes.map((node) => <div key={node.id} style={{ left: node.position.x, top: node.position.y }} onPointerDown={(event) => startDrag(event, node)} className={`absolute w-[190px] cursor-grab rounded-xl border bg-white shadow-sm active:cursor-grabbing dark:bg-zinc-900 ${selected === node.id ? "border-zinc-900 ring-2 ring-zinc-300 dark:border-zinc-100 dark:ring-zinc-700" : "border-zinc-200 dark:border-zinc-700"}`}><button onClick={(event) => { event.stopPropagation(); setSelected(node.id); }} className="block w-full px-3 py-2 text-left"><span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">{CATALOG.find(([type]) => type === node.type)?.[2]}</span><span className="mt-1 block text-sm font-semibold text-zinc-900 dark:text-zinc-50">{node.name}</span><span className="mt-1 block truncate text-[10px] text-zinc-500">{node.type}</span></button><button onClick={(event) => { event.stopPropagation(); setConnecting(node.id); }} className={`absolute -right-2 top-9 h-4 w-4 rounded-full border-2 border-white ${connecting === node.id ? "bg-amber-400" : "bg-zinc-500"}`} aria-label={`${node.name} çıkışını bağla`} /><button onClick={(event) => { event.stopPropagation(); connect(node); }} className="absolute -left-2 top-9 h-4 w-4 rounded-full border-2 border-white bg-zinc-300 dark:border-zinc-900 dark:bg-zinc-600" aria-label={`${node.name} girişini bağla`} /></div>)}</div></main>
      <aside className="overflow-y-auto border-l border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">{selectedNode ? <><p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{selectedNode.name}</p><p className="mt-1 text-[11px] text-zinc-500">{selectedNode.type}</p><label className="mt-4 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Node adı<input value={selectedNode.name} onChange={(event) => updateNode({ ...selectedNode, name: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800" /></label><label className="mt-3 block text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Config (JSON)<textarea value={JSON.stringify(selectedNode.config, null, 2)} onChange={(event) => { try { updateNode({ ...selectedNode, config: JSON.parse(event.target.value) }); } catch { /* JSON is validated on save. */ } }} className="mt-1 h-40 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-2 font-mono text-[10px] leading-4 dark:border-zinc-700 dark:bg-zinc-950" /></label></> : <p className="text-sm text-zinc-500">Ayarları görmek için bir node seçin.</p>}<div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800"><p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Execution</p>{execution ? <div className={`mt-2 rounded-lg p-2 ${statusClass(execution.execution.status)}`}><p className="text-xs font-semibold">{execution.execution.status}</p><p className="mt-1 font-mono text-[10px]">{execution.execution.id}</p><pre className="mt-2 max-h-44 overflow-auto text-[10px] leading-4">{JSON.stringify(execution.logs?.length ? execution.logs : execution.nodes, null, 2)}</pre></div> : <p className="mt-2 text-[11px] text-zinc-500">Test çalıştırıldığında kalıcı node logları burada canlı yenilenir.</p>}</div></aside></div>{notice && <div className="border-t border-zinc-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-zinc-800 dark:bg-amber-950/30 dark:text-amber-100">{notice}</div>}</div>;
}
