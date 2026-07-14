import { AutomationError } from "./errors.js";

const TOKEN = /{{\s*([^{}]+?)\s*}}/g;

function readPath(source, path) {
  const parts = path.replace(/^\$json\.?/, "input.").split(".").filter(Boolean);
  let value = source;
  for (const part of parts) {
    if (!/^[A-Za-z0-9_$-]+$/.test(part) || value == null || typeof value !== "object") return undefined;
    value = value[part];
  }
  return value;
}

export function resolveExpression(value, context) {
  if (typeof value !== "string") {
    if (Array.isArray(value)) return value.map((item) => resolveExpression(item, context));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveExpression(item, context)]));
    return value;
  }
  const exact = value.match(/^{{\s*([^{}]+?)\s*}}$/);
  if (exact) return resolveToken(exact[1], context);
  return value.replace(TOKEN, (_, token) => {
    const resolved = resolveToken(token, context);
    return resolved == null ? "" : typeof resolved === "string" ? resolved : JSON.stringify(resolved);
  });
}

function resolveToken(rawToken, context) {
  const token = rawToken.trim();
  if (token === "$now") return new Date().toISOString();
  if (token.startsWith("nodes.")) return readPath(context.nodes, token.slice(6));
  if (token.startsWith("workflow.variables.")) return readPath(context.workflow.variables || {}, token.slice(19));
  if (token.startsWith("execution.")) return readPath(context.execution, token.slice(10));
  if (token === "$json" || token.startsWith("$json.")) return readPath({ input: context.input }, token);
  throw new AutomationError("WORKFLOW_CONFIG", `Desteklenmeyen ifade: ${token}`, { name: "WorkflowConfigError", httpStatus: 400 });
}
