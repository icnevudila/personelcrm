import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { generateText } from "./ai.js";
import { AutomationError, normalizeAutomationError } from "./errors.js";
import { resolveExpression } from "./expression.js";
import { validateWorkflowDefinition } from "./schema.js";
import { sendMessage } from "@/lib/telegram/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function executeWorkflow(definition, { input = {}, workspaceId, onNodeEvent = async () => {} } = {}) {
  validateWorkflowDefinition(definition);
  const context = { nodes: {}, input, workspaceId, workflow: { variables: definition.variables || {} }, execution: { startedAt: new Date().toISOString() } };
  const roots = definition.nodes.filter((node) => !definition.edges.some((edge) => edge.target === node.id));
  let current = roots.find((node) => node.type.startsWith("trigger."));
  if (!current) throw new AutomationError("WORKFLOW_CONFIG", "Workflow bir trigger node ile başlamalı.", { httpStatus: 400 });
  let incoming = input; const logs = []; const visited = new Set();
  while (current) {
    if (visited.has(current.id)) throw new AutomationError("WORKFLOW_CONFIG", "Döngü tespit edildi.", { httpStatus: 400 });
    visited.add(current.id); const started = Date.now(); await onNodeEvent({ node: current, status: "running" });
    try {
      const output = await executeNode(current, incoming, context); context.nodes[current.id] = { output };
      const event = { nodeId: current.id, nodeName: current.name, status: "succeeded", input: incoming, output: { ...output }, durationMs: Date.now() - started }; logs.push(event); await onNodeEvent({ node: current, ...event });
      const handle = output?.__handle || "success"; if (output && typeof output === "object") delete output.__handle;
      const edge = definition.edges.find((item) => item.source === current.id && (item.sourceHandle || "success") === handle) || definition.edges.find((item) => item.source === current.id && (item.sourceHandle || "success") === "success");
      current = edge ? definition.nodes.find((node) => node.id === edge.target) : null; incoming = output;
    } catch (error) {
      const normalized = normalizeAutomationError(error); const event = { nodeId: current.id, nodeName: current.name, status: "failed", input: incoming, error: { code: normalized.code, message: normalized.message, retryable: normalized.retryable }, durationMs: Date.now() - started }; logs.push(event); await onNodeEvent({ node: current, ...event }); throw Object.assign(normalized, { executionLogs: logs });
    }
  }
  return { status: "succeeded", output: incoming, logs, startedAt: context.execution.startedAt, finishedAt: new Date().toISOString() };
}

async function executeNode(node, input, context) {
  const config = resolveExpression(node.config || {}, { ...context, input });
  if (node.type === "trigger.manual") return input;
  if (node.type === "data.set") return { ...(input || {}), ...(config.values || {}) };
  if (node.type === "logic.if") { const matched = config.operator === "not_empty" ? Boolean(config.left) : config.operator === "equals" ? String(config.left) === String(config.right) : false; return { ...(input || {}), condition: matched, __handle: matched ? "true" : "false" }; }
  if (node.type === "http.request") return runHttpRequest(config);
  if (node.type === "ai.chat") return generateText(config);
  if (node.type === "telegram.send") { const chatId = config.chatId || process.env.TELEGRAM_ALLOWED_USER_ID; if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) throw new AutomationError("CREDENTIAL_ERROR", "Telegram bağlantısı yapılandırılmamış.", { name: "CredentialError", httpStatus: 422 }); const result = await sendMessage(chatId, String(config.text || "")); return { messageId: result.message_id, chatId }; }
  if (node.type === "crm.create") {
    if (!context.workspaceId || !config.tableId) throw new AutomationError("WORKFLOW_CONFIG", "CRM node için tableId zorunludur.", { httpStatus: 400 });
    const db = createAdminClient(); const { data, error } = await db.from("crm_records").insert({ workspace_id: context.workspaceId, table_id: config.tableId, values: config.values || input || {} }).select("id,values,created_at").single();
    if (error) throw new AutomationError("PROVIDER_ERROR", "CRM kaydı oluşturulamadı.", { details: { message: error.message }, httpStatus: 502 }); return data;
  }
  throw new AutomationError("WORKFLOW_CONFIG", `Desteklenmeyen node: ${node.type}`, { httpStatus: 400 });
}

async function runHttpRequest(config) {
  const url = new URL(config.url); if (!/^https?:$/.test(url.protocol)) throw new AutomationError("VALIDATION_ERROR", "Sadece http/https URL'lerine izin verilir.", { name: "ValidationError", httpStatus: 400 }); await assertSafeHost(url.hostname);
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), Math.min(Number(config.timeoutMs) || 30000, 30000));
  try { const response = await fetch(url, { method: config.method || "GET", headers: { Accept: "application/json", ...(config.headers || {}) }, body: config.body && config.method !== "GET" ? JSON.stringify(config.body) : undefined, signal: controller.signal, redirect: "error" }); const text = (await response.text()).slice(0, 250000); let body; try { body = JSON.parse(text); } catch { body = text; } if (!response.ok) throw new AutomationError(response.status === 429 ? "PROVIDER_RATE_LIMIT" : "PROVIDER_ERROR", `HTTP isteği ${response.status} ile başarısız oldu.`, { retryable: response.status === 429 || response.status >= 500, httpStatus: response.status }); return { status: response.status, body }; } catch (error) { if (error.name === "AbortError") throw new AutomationError("TIMEOUT", "HTTP isteği zaman aşımına uğradı.", { name: "TimeoutError", retryable: true, httpStatus: 504 }); throw error; } finally { clearTimeout(timeout); }
}

async function assertSafeHost(hostname) { const host = hostname.toLowerCase(); if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw blockedHost(); const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((item) => item.address); if (addresses.some((address) => address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80") || /^(10\.|127\.|0\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(address))) throw blockedHost(); }
function blockedHost() { return new AutomationError("SSRF_BLOCKED", "Bu HTTP hedefi güvenlik politikası tarafından engellendi.", { name: "AuthorizationError", httpStatus: 403 }); }
