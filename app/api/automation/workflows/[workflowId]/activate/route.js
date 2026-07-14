import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { validateWorkflowDefinition } from "@/lib/automation/schema";
import { audit } from "@/lib/automation/persistence";

export const runtime = "nodejs";
export async function POST(_request, { params }) {
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase); if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const workspace = await getOrCreatePersonalWorkspace(user); const { workflowId } = await params;
    const { data: workflow, error } = await supabase.from("workflows").select("id,draft_definition").eq("id", workflowId).eq("workspace_id", workspace.id).single(); if (error) return NextResponse.json({ error: "Workflow bulunamadı." }, { status: 404 });
    const definition = validateWorkflowDefinition(workflow.draft_definition); const { data: latest } = await supabase.from("workflow_versions").select("version_number").eq("workflow_id", workflow.id).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const { data: version, error: versionError } = await supabase.from("workflow_versions").insert({ workspace_id: workspace.id, workflow_id: workflow.id, version_number: (latest?.version_number || 0) + 1, definition, created_by: user.id, published_at: new Date().toISOString() }).select().single(); if (versionError) throw versionError;
    const nodeRows = definition.nodes.map((node) => ({ workspace_id: workspace.id, workflow_id: workflow.id, version_id: version.id, node_key: node.id, node_type: node.type, name: node.name, position: node.position || {}, config: node.config || {} }));
    const edgeRows = definition.edges.map((edge) => ({ workspace_id: workspace.id, workflow_id: workflow.id, version_id: version.id, edge_key: edge.id, source_node_key: edge.source, source_handle: edge.sourceHandle || "success", target_node_key: edge.target, target_handle: edge.targetHandle || "input", condition: edge.condition || null }));
    if (nodeRows.length) { const { error: nodeError } = await supabase.from("workflow_nodes").insert(nodeRows); if (nodeError) throw nodeError; }
    if (edgeRows.length) { const { error: edgeError } = await supabase.from("workflow_edges").insert(edgeRows); if (edgeError) throw edgeError; }
    const { data: active, error: updateError } = await supabase.from("workflows").update({ active_version_id: version.id, status: "active", updated_at: new Date().toISOString() }).eq("id", workflow.id).select().single(); if (updateError) throw updateError;
    await audit({ workspaceId: workspace.id, actorId: user.id, action: "workflow.activated", entityType: "workflow", entityId: workflow.id, metadata: { version: version.version_number } }); return NextResponse.json({ workflow: active, version });
  } catch (error) { return NextResponse.json({ error: error.message || "Workflow aktifleştirilemedi." }, { status: 400 }); }
}
