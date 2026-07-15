import { AutomationError } from "./errors.js";

export const NODE_REGISTRY = {
  "trigger.manual": { category: "Tetikleyiciler", label: "Manual Trigger", description: "Test veya kullanıcı eylemiyle başlar." },
  "data.set": { category: "Veri", label: "Set Fields", description: "Alanları ekler veya günceller." },
  "logic.if": { category: "Mantık", label: "If", description: "Koşula göre dallanır." },
  "http.request": { category: "HTTP", label: "HTTP Request", description: "SSRF korumalı dış API çağrısı." },
  "ai.chat": { category: "AI", label: "AI Chat", description: "xAI, OpenAI, Gemini veya Groq ile üretir." },
  "telegram.send": { category: "Telegram", label: "Send Message", description: "Yapılandırılmış Telegram botuna mesaj yollar." },
  "crm.create": { category: "CRM", label: "Create Record", description: "CRM kaydı oluşturur." },
};

export const STARTER_WORKFLOW = {
  name: "AI + Telegram başlangıç akışı",
  description: "Native engine için güvenli örnek akış.", status: "draft",
  settings: { timezone: "Europe/Istanbul", maxExecutionTimeMs: 300000, concurrency: 1, errorStrategy: "stop" },
  variables: { brandTone: "açık ve yardımcı" },
  nodes: [
    { id: "manual", type: "trigger.manual", name: "Manual Trigger", position: { x: 72, y: 180 }, config: {} },
    { id: "set", type: "data.set", name: "Set Fields", position: { x: 320, y: 180 }, config: { values: { topic: "AI ile operasyon otomasyonu", audience: "Türkiye'deki girişimciler" } } },
    { id: "if", type: "logic.if", name: "If", position: { x: 570, y: 180 }, config: { left: "{{ nodes.set.output.topic }}", operator: "not_empty", right: "" } },
    { id: "ai", type: "ai.chat", name: "AI ile taslak", position: { x: 820, y: 110 }, config: { provider: "auto", model: "", systemPrompt: "Türkçe, kısa ve faydalı yaz.", prompt: "{{ nodes.set.output.topic }} hakkında {{ nodes.set.output.audience }} için bir paylaşım taslağı üret." } },
    { id: "telegram", type: "telegram.send", name: "Telegram'a gönder", position: { x: 1080, y: 110 }, config: { chatId: "", text: "{{ nodes.ai.output.text }}" } },
  ],
  edges: [{ id: "manual-set", source: "manual", target: "set", sourceHandle: "success" }, { id: "set-if", source: "set", target: "if", sourceHandle: "success" }, { id: "if-ai", source: "if", target: "ai", sourceHandle: "true" }, { id: "ai-telegram", source: "ai", target: "telegram", sourceHandle: "success" }],
};

export function validateWorkflowDefinition(definition) {
  if (!definition || typeof definition !== "object" || !Array.isArray(definition.nodes) || !Array.isArray(definition.edges)) throw configError("Workflow tanımı geçersiz.");
  if (!definition.nodes.length) throw configError("Workflow en az bir node içermelidir.");
  const ids = new Set();
  for (const node of definition.nodes) {
    if (!node?.id || !node?.type || !NODE_REGISTRY[node.type]) throw configError("Bilinmeyen veya eksik node tipi.");
    if (ids.has(node.id)) throw configError(`Tekrarlanan node id: ${node.id}`);
    ids.add(node.id);
    validateNodeConfig(node);
  }
  for (const edge of definition.edges) if (!ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target) throw configError("Geçersiz edge.");
  const outgoing = new Map(definition.nodes.map((node) => [node.id, []]));
  definition.edges.forEach((edge) => outgoing.get(edge.source).push(edge.target));
  const visiting = new Set(); const visited = new Set();
  function visit(id) { if (visiting.has(id)) throw configError("Döngü tespit edildi. MVP yalnızca DAG akışlarını çalıştırır."); if (visited.has(id)) return; visiting.add(id); outgoing.get(id).forEach(visit); visiting.delete(id); visited.add(id); }
  definition.nodes.forEach((node) => visit(node.id));
  return definition;
}

function validateNodeConfig(node) {
  const config = node.config || {};
  if (node.type === "http.request") {
    if (typeof config.url !== "string" || !config.url) throw configError(`${node.name || "HTTP Request"}: url zorunludur.`);
    try { new URL(config.url.replace(/{{[^{}]+}}/g, "https://example.com")); } catch { throw configError(`${node.name || "HTTP Request"}: geçerli bir URL girin.`); }
  }
  if (node.type === "ai.chat" && (typeof config.prompt !== "string" || !config.prompt.trim())) throw configError(`${node.name || "AI Chat"}: prompt zorunludur.`);
  if (node.type === "telegram.send" && (typeof config.text !== "string" || !config.text.trim())) throw configError(`${node.name || "Send Message"}: mesaj zorunludur.`);
  if (node.type === "crm.create" && !config.tableId) throw configError(`${node.name || "Create Record"}: tableId zorunludur.`);
}

function configError(message) { return new AutomationError("WORKFLOW_CONFIG", message, { name: "WorkflowConfigError", httpStatus: 400 }); }
