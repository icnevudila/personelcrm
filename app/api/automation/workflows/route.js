import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { getOrCreatePersonalWorkspace } from "@/lib/automation/workspace";
import { STARTER_WORKFLOW, validateWorkflowDefinition } from "@/lib/automation/schema";
import { audit } from "@/lib/automation/persistence";

export const runtime = "nodejs";
export async function GET() {
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase); if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try { const workspace = await getOrCreatePersonalWorkspace(user); const { data, error } = await supabase.from("workflows").select("id,name,description,status,draft_definition,updated_at,active_version_id").eq("workspace_id", workspace.id).is("deleted_at", null).order("updated_at", { ascending: false }); if (error) throw error; return NextResponse.json({ workspace, workflows: data || [] }); } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
export async function POST(request) {
  const supabase = await createClient(); const { user } = await getCurrentUser(supabase); if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try { const body = await request.json(); const definition = validateWorkflowDefinition(body.definition || STARTER_WORKFLOW); const workspace = await getOrCreatePersonalWorkspace(user); const { data, error } = await supabase.from("workflows").insert({ workspace_id: workspace.id, name: String(body.name || definition.name || "İsimsiz workflow").slice(0, 120), description: String(body.description || definition.description || "").slice(0, 500), draft_definition: definition, created_by: user.id }).select().single(); if (error) throw error; await audit({ workspaceId: workspace.id, actorId: user.id, action: "workflow.created", entityType: "workflow", entityId: data.id }); return NextResponse.json({ workflow: data }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error.message || "Workflow oluşturulamadı." }, { status: 400 }); }
}
