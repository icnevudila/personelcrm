import test from "node:test";
import assert from "node:assert/strict";
import { resolveExpression } from "../lib/automation/expression.js";
import { validateWorkflowDefinition } from "../lib/automation/schema.js";

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
