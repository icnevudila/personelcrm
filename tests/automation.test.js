import test from "node:test";
import assert from "node:assert/strict";
import { resolveExpression } from "../lib/automation/expression.js";
import { validateWorkflowDefinition } from "../lib/automation/schema.js";
import { executeWorkflow } from "../lib/automation/engine.js";

test("expression engine resolves explicit node paths without executing JavaScript", () => {
  const value = resolveExpression("Merhaba {{ nodes.contact.output.name }}", { nodes: { contact: { output: { name: "Ada" } } }, workflow: { variables: {} }, execution: {}, input: {} });
  assert.equal(value, "Merhaba Ada");
  assert.throws(() => resolveExpression("{{ process.env.SECRET }}", { nodes: {}, workflow: { variables: {} }, execution: {}, input: {} }), /Desteklenmeyen/);
});

test("workflow validation rejects graph cycles", () => {
  assert.throws(() => validateWorkflowDefinition({ nodes: [{ id: "a", type: "trigger.manual" }, { id: "b", type: "data.set" }], edges: [{ source: "a", target: "b" }, { source: "b", target: "a" }] }), /Döngü/);
});

test("workflow validation accepts a simple directed acyclic graph", () => {
  assert.equal(validateWorkflowDefinition({ nodes: [{ id: "a", type: "trigger.manual" }, { id: "b", type: "data.set" }], edges: [{ source: "a", target: "b" }] }).nodes.length, 2);
});

test("manual → set fields → if runs only the true branch", async () => {
  const result = await executeWorkflow({
    settings: { maxExecutionTimeMs: 10000 }, variables: {},
    nodes: [
      { id: "manual", type: "trigger.manual", config: {} },
      { id: "set", type: "data.set", config: { values: { topic: "otomasyon" } } },
      { id: "if", type: "logic.if", config: { left: "{{ nodes.set.output.topic }}", operator: "not_empty" } },
      { id: "true", type: "data.set", config: { values: { route: "true" } }, name: "True" },
      { id: "false", type: "data.set", config: { values: { route: "false" } }, name: "False" },
    ],
    edges: [
      { source: "manual", target: "set" }, { source: "set", target: "if" },
      { source: "if", sourceHandle: "true", target: "true" }, { source: "if", sourceHandle: "false", target: "false" },
    ],
  });
  assert.equal(result.output.route, "true");
  assert.equal(result.logs.length, 4);
});
